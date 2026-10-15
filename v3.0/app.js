"use strict";
const M = window.BeamPhysics;
const L = window.BeamLessons;
const STORE_KEY = "beamlab-progress-v3";
const screen = document.getElementById("screen");
const initialState = () => ({ schema: 2, xp: 0, completed: { bridge: [], flow: [] }, active: { bridge: 0, flow: 0 }, attempts: {}, settings: { paused: false, annotations: true } });
const n = (value, digits = 2) => Number(value).toLocaleString("id-ID", { maximumFractionDigits: digits });
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (name) => {
  const paths = { arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>', check: '<path d="m5 12 4 4L19 6"/>', bridge: '<path d="M3 7h18M5 7v13m14-13v13M5 7c2 0 3 8 7 8s5-8 7-8"/>', flow: '<path d="M3 8h4l3 10h4l3-10h4M4 13h4m8 0h4M12 3v9m-3-3 3 3 3-3"/>', play: '<path d="m8 5 11 7-11 7V5Z"/>', pause: '<path d="M8 5v14M16 5v14"/>', reset: '<path d="M4 11a8 8 0 1 1 1 5M4 5v6h6"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', profile: '<path d="M5 4h14v4h-5v8h5v4H5v-4h5V8H5V4Z"/>', span: '<path d="M3 12h18M6 8l-4 4 4 4m12-8 4 4-4 4M3 4v3m18-3v3M3 17v3m18-3v3"/>' };
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.bridge) + "</svg>";
};
function validIndices(list, track) {
  return Array.isArray(list) ? [...new Set(list.filter((i) => Number.isInteger(i) && i >= 0 && i < L[track].length))] : [];
}
function newAttempt(track, index) {
  return { phase: "predict", params: { ...L[track][index].start }, seed: Math.floor(Math.random() * 4294967295), prediction: "", predictionCorrect: null, explanation: "", numeric: "", hints: 0, feedback: "", feedbackError: false, experiments: [], record: null, reward: null };
}
function loadState() {
  const data = initialState();
  try {
    const old = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!old || typeof old !== "object") return data;
    data.xp = Math.max(0, M.finite(old.xp, 0));
    data.completed.bridge = validIndices(Array.isArray(old.completed) ? old.completed : old.completed?.bridge, "bridge");
    data.completed.flow = validIndices(old.schema === 2 ? old.completed?.flow : old.flow?.completedQuestions, "flow");
    if (old.schema !== 2) return data;
    for (const track of ["bridge", "flow"]) {
      data.active[track] = M.clamp(Math.trunc(M.finite(old.active?.[track], 0)), 0, L[track].length - 1);
      for (let index = 0; index < L[track].length; index++) {
        const key = track + ":" + index;
        const a = old.attempts?.[key];
        if (!a || typeof a !== "object") continue;
        const fresh = newAttempt(track, index);
        const clean = (p) => track === "bridge" ? M.bridgeParameters(p) : M.flowParameters(p);
        fresh.params = clean(a.params);
        fresh.seed = M.finite(a.seed, fresh.seed);
        fresh.prediction = L[track][index].options.some((o) => o.id === a.prediction) ? a.prediction : "";
        fresh.predictionCorrect = typeof a.predictionCorrect === "boolean" ? a.predictionCorrect : null;
        fresh.explanation = L[track][index].explanations.some((o) => o.id === a.explanation) ? a.explanation : "";
        fresh.numeric = typeof a.numeric === "string" ? a.numeric.slice(0, 30) : "";
        fresh.hints = M.clamp(Math.trunc(M.finite(a.hints, 0)), 0, 3);
        fresh.experiments = Array.isArray(a.experiments) ? a.experiments.slice(-6).filter((r) => r && r.params).map((r) => ({ params: clean(r.params) })) : [];
        fresh.record = a.record?.params ? { params: clean(a.record.params) } : null;
        fresh.phase = ["predict", "experiment", "explain", "done"].includes(a.phase) ? a.phase : "predict";
        if (["explain", "done"].includes(fresh.phase) && (!fresh.record || !L[track][index].target(fresh.record.params))) fresh.phase = "experiment";
        if (fresh.phase === "done" && (fresh.explanation !== L[track][index].correctExplanation || !M.isClose(M.parseNumber(fresh.numeric), L[track][index].expected(fresh.record.params, L[track][index].start)))) fresh.phase = "explain";
        fresh.reward = Number.isFinite(a.reward) ? a.reward : null;
        data.attempts[key] = fresh;
      }
    }
    data.settings.paused = Boolean(old.settings?.paused);
    data.settings.annotations = old.settings?.annotations !== false;
  } catch (error) {
  }
  return data;
}
let state = loadState();
let view = { track: "home", index: 0 };
let renderedKey = "";
let toastTimer;
let playing = false;
let sampleTime = 0;
let homeParams = { ...M.BRIDGE_DEFAULTS };
let cameraMode = "perspective";
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (error) {
  }
}
function attempt() {
  const key = view.track + ":" + view.index;
  if (!state.attempts[key]) state.attempts[key] = newAttempt(view.track, view.index);
  return state.attempts[key];
}
function lesson() {
  return L[view.track][view.index];
}
function nextIndex(track) {
  const index = L[track].findIndex((_, i) => !state.completed[track].includes(i));
  return index < 0 ? 0 : index;
}
function canOpen(track, index) {
  return index === 0 || state.completed[track].includes(index - 1) || state.completed[track].includes(index);
}
function route() {
  const hash = location.hash.replace(/^#/, "");
  const [kind, index] = hash.split("/");
  const track = kind === "flow" ? "flow" : ["bridge", "lab"].includes(kind) ? "bridge" : "home";
  const i = track === "home" ? 0 : index === void 0 ? nextIndex(track) : M.clamp(Math.trunc(M.finite(index, 0)), 0, L[track].length - 1);
  return { track, index: track !== "home" && canOpen(track, i) ? i : 0 };
}
function navigate(track, index = nextIndex(track === "home" ? "bridge" : track)) {
  const hash = track === "home" ? "#home" : "#" + track + "/" + index;
  history.pushState(null, "", hash);
  view = route();
  render();
  document.getElementById("main").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}
function notify(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 3500);
}
function updateHeader() {
  const done = state.completed.bridge.length + state.completed.flow.length;
  document.getElementById("xp-total").textContent = n(state.xp, 0) + " XP";
  document.querySelector(".progress-button").setAttribute("aria-label", "Lihat progres belajar: " + done + " dari 8 latihan, " + state.xp + " XP");
  for (const [id, key] of [["nav-map", "home"], ["nav-lab", "bridge"], ["nav-flow", "flow"]]) {
    const el = document.getElementById(id);
    if (view.track === key) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  }
}
function mapRows(track) {
  return L[track].map((item, i) => {
    const completed = state.completed[track].includes(i);
    const locked = !canOpen(track, i);
    const symbols = track === "flow" ? ["flow", "flow", "flow"] : ["bridge", "bridge", "profile", "span", "profile"];
    return '<li><button class="mission-link" type="button" data-action="open-lesson" data-track="' + track + '" data-index="' + i + '" ' + (locked ? "disabled" : "") + ' aria-label="' + (locked ? "Terkunci: " : completed ? "Buka kembali: " : "Buka: ") + item.title + '"><span class="lesson-symbol">' + icon(completed ? "check" : locked ? "lock" : symbols[i]) + "</span><span><strong>" + item.title + "</strong><p>" + item.description + '</p></span><span class="lesson-state">' + (completed ? "Selesai" : locked ? "Terkunci" : "Mulai") + "</span></button></li>";
  }).join("");
}
function mountScene(host, mode, params, baseline) {
  if (!window.BeamLab3D) {
    host.innerHTML = '<div class="scene-fallback"><strong>Scene 3D belum termuat.</strong><p>Hitungan dan grafik tetap bisa digunakan. Muat ulang halaman untuk mencoba kembali.</p></div>';
    return;
  }
  window.BeamLab3D.mount(host, mode, params, { baseline, onPlayback: (value) => {
    playing = value;
    if (view.track !== "home" && document.getElementById("experiment-controls")) renderControls();
    document.querySelectorAll('[data-action="capture"],[data-action="submit"]').forEach((el) => el.disabled = value);
    const text = document.getElementById("playback-caption");
    if (text) text.textContent = value ? "Kendaraan menuju titik uji. Grafik mengikuti posisi beban." : "Beban di tengah bentang \xB7 model elastis";
  }, onSample: (position) => {
    if (view.track !== "bridge") return;
    const now = performance.now();
    if (position === null || now - sampleTime > 85) {
      drawBeam(attempt().params, lesson().start, position);
      sampleTime = now;
    }
  }, onError: (message) => {
    const el = document.getElementById("render-error");
    if (el) {
      el.textContent = message;
      el.hidden = !message;
    }
  } });
  window.BeamLab3D.pause(state.settings.paused);
  window.BeamLab3D.annotations(state.settings.annotations);
}
function renderHome() {
  screen.innerHTML = '<section class="home-hero"><div class="home-copy"><h1>Ubah beban.<br>Amati lentur.</h1><p>Eksperimen jembatan dan aliran air untuk memahami rumus teknik sipil lewat objek, grafik, dan keputusanmu.</p><button class="button" type="button" data-action="start">' + (state.completed.bridge.length ? "Lanjutkan eksperimen" : "Mulai eksperimen") + icon("arrow") + '</button><span class="home-progress">' + state.completed.bridge.length + ' dari 5 misi struktur selesai</span></div><div class="home-stage"><div id="home-scene" class="scene-host"></div><div class="home-preview"><label for="home-load">Muatan truk</label><output id="home-load-value">20 ton</output><input id="home-load" type="range" min="10" max="50" step="1" value="20" data-home-load aria-label="Muatan truk pratinjau, ton"><span class="preview-result">\u03B4 <strong id="home-delta">26,16 mm</strong></span><button class="button button-small button-subtle" type="button" data-action="play">' + icon("play") + '<span>Uji truk</span></button></div></div></section><section aria-labelledby="path-title"><div class="home-intro"><h2 id="path-title">Belajar lewat percobaan</h2><p>Buat prediksi, jalankan eksperimen, lalu gunakan hasilnya untuk menjelaskan hubungan antarvariabel.</p></div><div class="learning-paths"><div><div class="path-heading"><h3>Mekanika struktur</h3><span>5 misi</span></div><ol class="mission-list">' + mapRows("bridge") + '</ol></div><div class="flow-path"><h3>Hidraulika</h3><p>Amati ukuran saluran dan gerak air. Buktikan hubungan luas basah, kedalaman, kekasaran, dan debit Manning.</p><button class="button" type="button" data-action="go-flow">Buka lab debit air' + icon("arrow") + '</button><ol class="mission-list">' + mapRows("flow") + '</ol><p class="muted">' + state.completed.flow.length + ' dari 3 latihan selesai</p></div></div></section><aside class="study-note"><strong>Ruang untuk mencoba</strong><p>Prediksi boleh keliru. Gunakan catatan eksperimen dan petunjuk untuk memperbaiki penjelasanmu. Nilai material dan biaya adalah preset pembelajaran.</p></aside>';
  homeParams = { ...M.BRIDGE_DEFAULTS };
  mountScene(document.getElementById("home-scene"), "bridge", homeParams, homeParams);
}
function phaseSteps(phase) {
  const phases = ["predict", "experiment", "explain"];
  const titles = ["Prediksi", "Eksperimen", "Penjelasan"];
  const active = phase === "done" ? 3 : phases.indexOf(phase);
  return '<ol class="lesson-steps" aria-label="Tahap misi">' + titles.map((title, i) => '<li class="' + (i === active ? "is-active" : i < active ? "is-done" : "") + '"' + (i === active ? ' aria-current="step"' : "") + ">" + title + "</li>").join("") + "</ol>";
}
function optionsHtml(rows, kind, selected, seed) {
  return '<div class="answer-options">' + M.shuffled(rows, seed).map((row) => '<label class="answer-option"><input type="radio" name="' + kind + '" data-choice="' + kind + '" value="' + row.id + '" ' + (selected === row.id ? "checked" : "") + "><span>" + row.label + "</span></label>").join("") + "</div>";
}
function theoryHtml(item) {
  return '<details class="lesson-note"><summary>Bekal konsep</summary><p>' + item.theory + "</p></details>";
}
function feedbackHtml(a) {
  return a.feedback ? '<div class="feedback' + (a.feedbackError ? " is-error" : "") + '" role="status">' + esc(a.feedback) + "</div>" : "";
}
function hintHtml(item, a) {
  return (a.hints ? '<div class="feedback"><strong>Petunjuk</strong>' + item.hints[a.hints - 1] + "</div>" : "") + '<button class="hint-button" type="button" data-action="hint">' + (a.hints === 0 ? "Butuh petunjuk?" : a.hints < 3 ? "Buka petunjuk berikutnya" : "Lihat petunjuk terakhir") + "</button>";
}
function renderTask() {
  const a = attempt(), item = lesson();
  let html = phaseSteps(a.phase);
  if (a.phase === "predict") html += '<h2>Buat prediksi</h2><p class="lesson-context">' + item.context + '</p><fieldset><legend class="question-text">' + item.prediction + "</legend>" + optionsHtml(item.options, "prediction", a.prediction, a.seed) + '</fieldset><button class="button" type="button" data-action="lock-prediction" ' + (!a.prediction ? "disabled" : "") + ">Uji prediksi" + icon("arrow") + '</button><p class="proof-note">Prediksi ini akan dibandingkan dengan hasil percobaanmu.</p>' + theoryHtml(item);
  if (a.phase === "experiment") html += '<h2>Uji dan bandingkan</h2><p class="lesson-context">' + (a.predictionCorrect ? "Prediksimu sesuai model. Sekarang kumpulkan buktinya." : "Prediksi tersimpan. Amati hasil percobaan sebelum mengambil kesimpulan.") + '</p><p class="goal-copy">' + item.goal + '</p><p class="snapshot-count">' + a.experiments.length + " hasil sudah dicatat. Kondisi awal tersedia sebagai pembanding A.</p>" + feedbackHtml(a) + '<button class="button" type="button" data-action="capture" ' + (playing ? "disabled" : "") + ">Catat hasil" + icon("check") + '</button><button class="text-button" type="button" data-action="reset-values">Pulihkan kondisi awal</button>' + hintHtml(item, a) + theoryHtml(item);
  if (a.phase === "explain") html += '<h2>Jelaskan buktinya</h2><p class="lesson-context">Gunakan tabel dan grafik dari percobaanmu. Kamu dapat kembali ke eksperimen untuk memeriksa lagi.</p><div class="answer-field"><label for="numeric-answer">' + item.question + '</label><div class="answer-input-wrap"><input id="numeric-answer" type="text" inputmode="decimal" autocomplete="off" placeholder="Tulis angka" value="' + esc(a.numeric) + '" data-numeric aria-describedby="answer-unit"><span id="answer-unit">' + item.unit + '</span></div></div><fieldset><legend class="question-text">' + item.explain + "</legend>" + optionsHtml(item.explanations, "explanation", a.explanation, a.seed + 43) + '</fieldset><div id="answer-feedback" aria-live="polite">' + feedbackHtml(a) + '</div><button class="button" type="button" data-action="submit">Periksa pemahaman' + icon("check") + '</button><button class="text-button" type="button" data-action="back-experiment">Kembali ke eksperimen</button>' + hintHtml(item, a) + theoryHtml(item);
  if (a.phase === "done") {
    const more = view.index < L[view.track].length - 1;
    html += '<div class="completion-mark">' + icon("check") + '</div><h2>Latihan selesai</h2><p class="lesson-context">Kamu sudah mencatat hasil, menghitung perbandingan, dan menjelaskan hubungan yang sesuai.</p><div class="goal-copy">' + item.insight + '</div><p class="reward-text">' + (a.reward ? "+" + a.reward + " XP" : "Latihan ulang selesai") + '</p><p class="proof-note">' + (a.reward ? "Progresmu tersimpan di browser ini." : "XP untuk latihan ini sudah pernah diberikan.") + '</p><button class="button" type="button" data-action="' + (more ? "next" : "home") + '">' + (more ? "Misi berikutnya" : "Kembali ke peta") + icon("arrow") + '</button><button class="text-button" type="button" data-action="replay">Ulangi latihan</button>';
  }
  document.getElementById("lesson-panel").innerHTML = html;
  const workspace = document.querySelector(".lab-workspace");
  if (workspace) workspace.dataset.phase = a.phase;
}
function editable(key) {
  const a = attempt();
  if (a.phase === "done") return true;
  if (a.phase !== "experiment" || playing) return false;
  const f = lesson().focus;
  return f === "design" ? ["material", "profile"].includes(key) : f === key;
}
function range(key, label, unit, min, max, step, digits = 1) {
  const a = attempt();
  const disabled = !editable(key);
  const value = a.params[key];
  return '<div class="parameter' + (disabled ? " is-locked" : "") + '"><label class="parameter-label" for="slider-' + key + '">' + label + "<small>" + unit + '</small></label><div class="parameter-input"><input id="slider-' + key + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '" data-param="' + key + '" aria-label="' + label + ", " + unit + '" ' + (disabled ? "disabled" : "") + '><input type="number" id="number-' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '" data-param-number="' + key + '" aria-label="' + label + " dalam " + unit + '" ' + (disabled ? "disabled" : "") + "></div></div>";
}
function select(key, label, rows) {
  const value = attempt().params[key];
  return '<div class="parameter' + (!editable(key) ? " is-locked" : "") + '"><label class="parameter-label" for="select-' + key + '">' + label + '</label><select id="select-' + key + '" data-param-select="' + key + '" ' + (!editable(key) ? "disabled" : "") + ">" + rows.map(([id, text]) => '<option value="' + id + '" ' + (String(value) === String(id) ? "selected" : "") + ">" + text + "</option>").join("") + "</select></div>";
}
function renderControls() {
  let html;
  if (view.track === "bridge") html = range("P", "Muatan kendaraan", "ton", 10, 50, 1, 0) + range("L", "Panjang bentang", "m", 6, 12, 0.1) + select("material", "Material \xB7 E", Object.entries(M.materials).map(([id, v]) => [id, v.label + " \xB7 " + n(v.E, 0) + " GPa"])) + select("profile", "Penampang \xB7 I", Object.entries(M.profiles).map(([id, v]) => [id, v.label + " \xB7 " + n(v.I, 0) + " cm\u2074"]));
  else html = range("width", "Lebar dasar b", "m", 1, 6, 0.1) + range("depth", "Kedalaman air y", "m", 0.2, 2.5, 0.05, 2) + range("slope", "Kemiringan dasar S", "m/m", 5e-4, 0.01, 5e-4, 4) + select("roughness", "Kekasaran Manning n", [[0.01, "0,010 \xB7 sangat halus"], [0.015, "0,015 \xB7 beton umum"], [0.025, "0,025 \xB7 lebih kasar"], [0.03, "0,030 \xB7 dua kali awal"], [0.04, "0,040 \xB7 kasar"]]);
  if (attempt().phase === "experiment") html += '<button class="button quick-capture" type="button" data-action="capture">Simpan percobaan' + icon("check") + '</button><button class="button mobile-capture" type="button" data-action="capture">Catat percobaan' + icon("check") + "</button>";
  document.getElementById("experiment-controls").innerHTML = html;
  positionControls();
}
function positionControls() {
  const controls = document.getElementById("experiment-controls"), constraints = document.getElementById("constraints"), panel = document.getElementById("controls-panel");
  if (!controls || !panel) return;
  const mobile = window.matchMedia("(max-width:820px)").matches;
  const active = ["experiment", "done"].includes(attempt().phase);
  controls.hidden = !active;
  constraints.hidden = !active;
  if (mobile) {
    const result = document.querySelector(".results-panel");
    result.before(controls, constraints);
    panel.hidden = true;
  } else {
    panel.append(controls, constraints);
    panel.hidden = !active;
  }
}
function renderLab() {
  const item = lesson();
  screen.innerHTML = '<section class="lab"><header class="lab-heading"><div><h1>' + item.title + "</h1><p>" + item.description + '</p></div><select class="lesson-select" aria-label="Pilih misi ' + (view.track === "bridge" ? "struktur" : "hidraulika") + '" data-lesson-select>' + L[view.track].map((entry, i) => '<option value="' + i + '" ' + (i === view.index ? "selected" : "") + " " + (!canOpen(view.track, i) ? "disabled" : "") + ">" + entry.title + (state.completed[view.track].includes(i) ? " \xB7 selesai" : "") + "</option>").join("") + '</select></header><div class="lab-workspace"><div class="lesson-column"><aside id="lesson-panel" class="lesson-panel" aria-label="Instruksi dan jawaban misi"></aside><div id="controls-panel" class="controls-panel"></div></div><div class="visual-column"><section class="visual-panel" aria-label="Eksperimen ' + (view.track === "bridge" ? "jembatan" : "saluran air") + '"><div class="scene-toolbar"><div class="camera-controls" role="group" aria-label="Sudut pandang"><button type="button" data-action="camera" data-camera="perspective" aria-pressed="true">Perspektif</button><button type="button" data-action="camera" data-camera="side" aria-pressed="false">Samping</button><button type="button" data-action="camera" data-camera="section" aria-pressed="false">Penampang</button></div><div class="scene-actions">' + (view.track === "bridge" ? '<button type="button" data-action="play" title="Gerakkan truk menuju titik uji">' + icon("play") + "<span>Uji truk</span></button>" : "") + '<button type="button" data-action="pause" class="icon-button" aria-label="' + (state.settings.paused ? "Lanjutkan animasi" : "Jeda animasi") + '" aria-pressed="' + state.settings.paused + '">' + icon(state.settings.paused ? "play" : "pause") + '</button><button type="button" data-action="annotations" class="icon-button" aria-label="Tampilkan anotasi" aria-pressed="' + state.settings.annotations + '">' + icon("eye") + '</button><button type="button" data-action="reset-camera" class="icon-button" aria-label="Atur ulang kamera">' + icon("reset") + '</button></div></div><div id="scene-host" class="scene-host"></div><p id="render-error" class="render-error" hidden></p><div class="scene-footnote"><span id="playback-caption">' + (view.track === "bridge" ? "Beban di tengah bentang \xB7 model elastis" : "Tinggi dinding 3 m \xB7 dinding dekat dibuat transparan") + '</span><span class="motion-note">' + (view.track === "bridge" ? "Deformasi visual \xD78" : "Gerak aliran \xD70,6 \xB7 kemiringan visual \xD78") + '</span></div><div id="experiment-controls" class="experiment-controls"></div><div id="constraints"></div><section class="results-panel" aria-label="Hasil dan grafik"><div class="result-top"><div><h2>' + (view.track === "bridge" ? "Lendutan maksimum" : "Debit aliran") + '</h2><p id="result-change"></p></div><div class="metric-value" id="result-value"></div></div><div class="flow-readings" id="flow-readings" ' + (view.track === "bridge" ? "hidden" : "") + '></div><div class="chart-legend"><span><i class="legend-line baseline"></i>Kondisi awal A</span><span><i class="legend-line"></i>Kondisi saat ini</span></div><div class="chart-wrap"><svg id="experiment-chart" viewBox="0 0 720 210" role="img"></svg></div><div class="equation-row"><span class="equation">' + (view.track === "bridge" ? "\u03B4maks = P L\xB3 / (48 E I)" : "Q = (1/n) A R<sup>2/3</sup> S<sup>1/2</sup>") + '</span><button type="button" data-action="theory">Arti variabel</button></div></section></section><section id="notebook" class="notebook" aria-label="Catatan eksperimen"></section></div></div><details class="lab-assumptions"><summary>Asumsi model dan skala visual</summary><p>' + (view.track === "bridge" ? "Balok bertumpuan sederhana, material elastis linier, dan lentur kecil. Target soal menggunakan beban titik di tengah. Saat animasi kendaraan berjalan, model menghitung beban titik pada posisi kendaraan secara kuasistatik, tanpa efek inersia atau distribusi beban roda. Deformasi diperbesar 8 kali. Bentuk penampang dan biaya memakai preset latihan; keduanya bukan ukuran atau harga komponen struktur nyata." : "Aliran seragam dalam saluran persegi panjang. Q = A \xD7 V dan R = A/Pw, dengan Pw keliling basah. Kemiringan energi diasumsikan sama dengan kemiringan dasar. Tinggi dinding tetap 3 m. Kecepatan partikel divisualkan 0,6 kali dan kemiringan dibesarkan 8 kali. Dinding terdekat ditampilkan transparan sebagai potongan agar penampang basah terlihat. Gelombang permukaan hanya ilustrasi, bukan model turbulensi. Nilai n adalah preset pembelajaran.") + " Hasil ini bukan rekomendasi perencanaan atau keselamatan.</p></details></section>";
  cameraMode = "perspective";
  renderTask();
  renderControls();
  renderNotebook();
  updateResults();
  mountScene(document.getElementById("scene-host"), view.track, attempt().params, item.start);
}
function render() {
  const key = view.track + ":" + view.index;
  playing = false;
  updateHeader();
  if (key !== renderedKey) {
    renderedKey = key;
    if (view.track === "home") renderHome();
    else {
      state.active[view.track] = view.index;
      renderLab();
      save();
    }
  } else if (view.track !== "home") {
    renderTask();
    renderControls();
    renderNotebook();
    updateResults();
    window.BeamLab3D?.update(view.track, attempt().params, { baseline: lesson().start });
  }
}
function chartFrame(xMax, yMax, beam) {
  const compact = document.documentElement.clientWidth <= 600;
  const vw = compact ? 360 : 720, vh = compact ? 224 : 210, x = compact ? 48 : 55, y = 14, w = compact ? 294 : 640, h = 143, font = compact ? 14 : 12;
  let grid = "";
  for (let i = 0; i < 4; i++) {
    const yy = y + h * i / 3;
    const value = beam ? yMax * i / 3 : yMax * (1 - i / 3);
    grid += '<line x1="' + x + '" x2="' + (x + w) + '" y1="' + yy + '" y2="' + yy + '" stroke="#dce3d8"/><text x="' + (x - 10) + '" y="' + (yy + 4) + '" text-anchor="end" fill="#607064" font-size="' + font + '">' + n(value, 1) + "</text>";
  }
  for (let i = 0; i < 5; i++) grid += '<text x="' + (x + w * i / 4) + '" y="184" text-anchor="middle" fill="#607064" font-size="' + font + '">' + n(xMax * i / 4, 1) + "</text>";
  grid += '<text x="7" y="13" fill="#405447" font-size="' + font + '">' + (beam ? "mm" : "m\xB3/s") + '</text><text x="' + (vw - 18) + '" y="' + (compact ? 213 : 205) + '" text-anchor="end" fill="#405447" font-size="' + font + '">' + (beam ? "Posisi x (m)" : "Kedalaman y (m)") + "</text>";
  return { x, y, w, h, grid, vw, vh };
}
function drawBeam(p, b, loadPosition = null) {
  const a = loadPosition === null ? p.L / 2 : loadPosition;
  const current = M.beamResult(p, a), base = M.beamResult(b);
  const yMax = Math.max(1, current.maximum, base.maximum) * 1.18;
  const xMax = Math.max(p.L, b.L);
  const plot = chartFrame(xMax, yMax, true);
  const path = (params, pos) => Array.from({ length: 81 }, (_, i) => {
    const xx = params.L * i / 80;
    return (i ? "L" : "M") + (plot.x + xx / xMax * plot.w).toFixed(2) + "," + (plot.y + M.beamDeflectionAt(xx, params, pos) / yMax * plot.h).toFixed(2);
  }).join(" ");
  const dotX = plot.x + current.peakX / xMax * plot.w, dotY = plot.y + current.maximum / yMax * plot.h;
  const svg = document.getElementById("experiment-chart");
  if (!svg) return;
  svg.setAttribute("viewBox", "0 0 " + plot.vw + " " + plot.vh);
  svg.setAttribute("aria-label", "Grafik lendutan terhadap posisi. Awal " + n(base.maximum) + " mm, saat ini " + n(current.maximum) + " mm.");
  svg.innerHTML = plot.grid + '<path d="' + path(b, b.L / 2) + '" fill="none" stroke="#95a296" stroke-width="2" stroke-dasharray="6 5"/><path d="' + path(p, a) + '" fill="none" stroke="#285e43" stroke-width="3"/><circle cx="' + dotX + '" cy="' + dotY + '" r="4" fill="#285e43"/>';
  document.getElementById("result-value").innerHTML = n(current.maximum) + "<small>mm</small>";
  const change = (current.maximum / base.maximum - 1) * 100;
  document.getElementById("result-change").textContent = loadPosition !== null ? "Posisi beban x = " + n(M.clamp(a, 0, p.L)) + " m" : n(Math.abs(change), 1) + "% " + (change < -0.01 ? "lebih kecil" : change > 0.01 ? "lebih besar" : "perubahan") + " dari awal";
}
function drawFlow(p, b) {
  const values = M.flowResult(p), base = M.flowResult(b);
  const yMax = Math.max(M.flowResult(p, 2.5).discharge, M.flowResult(b, 2.5).discharge) * 1.12;
  const plot = chartFrame(2.5, yMax, false);
  const path = (params) => Array.from({ length: 81 }, (_, i) => {
    const depth = 2.5 * i / 80;
    return (i ? "L" : "M") + (plot.x + depth / 2.5 * plot.w).toFixed(2) + "," + (plot.y + plot.h - M.flowResult(params, depth).discharge / yMax * plot.h).toFixed(2);
  }).join(" ");
  const svg = document.getElementById("experiment-chart");
  svg.setAttribute("viewBox", "0 0 " + plot.vw + " " + plot.vh);
  svg.setAttribute("aria-label", "Grafik debit terhadap kedalaman. Debit awal " + n(base.discharge) + " dan saat ini " + n(values.discharge) + " meter kubik per detik.");
  svg.innerHTML = plot.grid + '<path d="' + path(b) + '" fill="none" stroke="#95a296" stroke-width="2" stroke-dasharray="6 5"/><path d="' + path(p) + '" fill="none" stroke="#285e43" stroke-width="3"/><circle cx="' + (plot.x + p.depth / 2.5 * plot.w) + '" cy="' + (plot.y + plot.h - values.discharge / yMax * plot.h) + '" r="4" fill="#285e43"/>';
  document.getElementById("result-value").innerHTML = n(values.discharge) + "<small>m\xB3/s</small>";
  const change = (values.discharge / base.discharge - 1) * 100;
  document.getElementById("result-change").textContent = n(Math.abs(change), 1) + "% " + (change < -0.01 ? "lebih kecil" : change > 0.01 ? "lebih besar" : "perubahan") + " dari awal";
  document.getElementById("flow-readings").innerHTML = "<span>A <strong>" + n(values.area) + " m\xB2</strong></span><span>R <strong>" + n(values.radius) + " m</strong></span><span>V <strong>" + n(values.velocity) + " m/s</strong></span>";
}
function updateResults() {
  const p = attempt().params, b = lesson().start;
  if (view.track === "bridge") drawBeam(p, b);
  else drawFlow(p, b);
  const constraints = document.getElementById("constraints");
  if (view.track === "bridge" && lesson().focus === "design") {
    const r = M.beamResult(p);
    constraints.innerHTML = '<div class="constraint-row"><span>Lendutan<strong class="' + (r.maximum <= 20 ? "is-pass" : "is-fail") + '">' + n(r.maximum) + ' / 20 mm</strong></span><span>Anggaran<strong class="' + (r.cost <= 110 ? "is-pass" : "is-fail") + '">' + r.cost + " / 110 kredit</strong></span></div>";
  } else constraints.replaceChildren();
}
function renderNotebook() {
  const a = attempt(), rows = [{ params: lesson().start }, ...a.experiments];
  const bridge = view.track === "bridge";
  const header = bridge ? ["Kondisi", "Muatan", "Bentang", "Material / profil", "\u03B4maks", "Kredit"] : ["Kondisi", "b / y", "n", "A", "R", "Q"];
  const body = rows.map((row, i) => {
    const p = row.params;
    const result = bridge ? M.beamResult(p) : M.flowResult(p);
    const cells = bridge ? [i === 0 ? "A \xB7 Awal" : String.fromCharCode(65 + i) + " \xB7 Catatan", n(p.P, 0) + " t", n(p.L) + " m", M.materials[p.material].label + " / " + M.profiles[p.profile].label, n(result.maximum) + " mm", result.cost] : [i === 0 ? "A \xB7 Awal" : String.fromCharCode(65 + i) + " \xB7 Catatan", n(p.width) + " / " + n(p.depth) + " m", n(p.roughness, 3), n(result.area) + " m\xB2", n(result.radius) + " m", n(result.discharge) + " m\xB3/s"];
    return "<tr>" + cells.map((cell) => "<td>" + cell + "</td>").join("") + "</tr>";
  }).join("");
  document.getElementById("notebook").innerHTML = "<h2>Catatan eksperimen</h2><p>" + (a.experiments.length ? "Bandingkan kondisi awal dengan hasil yang kamu simpan." : "Kondisi A sudah disiapkan. Ubah parameter lalu pilih Catat hasil untuk menyimpan kondisi berikutnya.") + '</p><div class="table-scroll" tabindex="0" aria-label="Tabel perbandingan hasil"><table><thead><tr>' + header.map((text) => '<th scope="col">' + text + "</th>").join("") + "</tr></thead><tbody>" + body + "</tbody></table></div>";
}
function syncParam(key, value) {
  if (!editable(key)) return;
  const a = attempt();
  const allowed = view.track === "bridge" ? ["P", "L", "material", "profile"] : ["width", "depth", "slope", "roughness"];
  if (!allowed.includes(key)) return;
  const numeric = !["material", "profile"].includes(key);
  if (numeric && !Number.isFinite(Number(value))) return;
  const combined = { ...a.params, [key]: numeric ? Number(value) : value };
  a.params = view.track === "bridge" ? M.bridgeParameters(combined) : M.flowParameters(combined);
  a.feedback = "";
  save();
  for (const prefix of ["slider-", "number-", "select-"]) {
    const input = document.getElementById(prefix + key);
    if (input && input !== document.activeElement) input.value = a.params[key];
  }
  updateResults();
  window.BeamLab3D?.update(view.track, a.params, { baseline: lesson().start });
}
function unchanged(p) {
  const start = lesson().start;
  const focus = lesson().focus;
  return Object.keys(start).filter((key) => focus === "design" ? !["material", "profile"].includes(key) : key !== focus).every((key) => typeof start[key] === "number" ? M.isClose(p[key], start[key], 0, 1e-6) : p[key] === start[key]);
}
function capture() {
  if (playing) return;
  const a = attempt(), item = lesson();
  if (a.phase !== "experiment") return;
  const record = { params: { ...a.params } };
  const duplicate = a.experiments.some((r) => JSON.stringify(r.params) === JSON.stringify(record.params));
  if (!duplicate) {
    a.experiments.push(record);
    a.experiments = a.experiments.slice(-6);
  }
  const unique = new Set(a.experiments.map((r) => JSON.stringify(r.params))).size;
  if (!unchanged(a.params)) {
    a.feedback = "Pertahankan variabel lain seperti kondisi awal agar perbandingannya adil.";
    a.feedbackError = true;
  } else if (!item.target(a.params)) {
    a.feedback = item.focus === "design" ? "Rancangan sudah dicatat. Periksa batas lendutan dan biaya, lalu coba pilihan lain." : "Hasil sudah dicatat. Lanjutkan perubahan yang diminta pada tujuan eksperimen.";
    a.feedbackError = true;
  } else if (item.focus === "design" && unique < 2) {
    a.feedback = "Satu rancangan sudah memenuhi batas. Catat satu rancangan berbeda, lalu kembali memilih solusi yang memenuhi kedua batas.";
    a.feedbackError = false;
  } else {
    a.record = record;
    a.phase = "explain";
    a.feedback = "";
    a.numeric = "";
    a.explanation = "";
    notify("Hasil tersimpan. Gunakan bukti A/B untuk menjawab.");
  }
  save();
  renderTask();
  renderControls();
  renderNotebook();
  if (a.phase === "explain" && window.matchMedia("(max-width:820px)").matches) document.getElementById("lesson-panel").scrollIntoView({ block: "start", behavior: "smooth" });
}
function submit() {
  if (playing) return;
  const a = attempt(), item = lesson();
  if (a.phase !== "explain" || !a.record) return;
  const expected = item.expected(a.record.params, item.start);
  const numeric = M.parseNumber(a.numeric);
  const numberCorrect = M.isClose(numeric, expected);
  const explanationCorrect = a.explanation === item.correctExplanation;
  if (!numberCorrect || !explanationCorrect) {
    a.feedback = !numberCorrect ? "Angka belum sesuai dengan hasil percobaan. Periksa satuan dan perbandingan pada catatan A/B." : "Penjelasan belum sesuai dengan bukti. Periksa kembali variabel yang berubah dan letaknya dalam rumus.";
    a.feedbackError = true;
    save();
    renderTask();
    document.getElementById("numeric-answer")?.setAttribute("aria-invalid", String(!numberCorrect));
    return;
  }
  const first = !state.completed[view.track].includes(view.index);
  a.reward = first ? view.track === "flow" ? 15 : 40 + (a.predictionCorrect ? 10 : 0) : 0;
  a.phase = "done";
  a.feedback = "";
  if (first) {
    state.completed[view.track].push(view.index);
    state.completed[view.track].sort((a2, b) => a2 - b);
    state.xp += a.reward;
  }
  save();
  updateHeader();
  updateLessonMenu();
  renderTask();
  renderControls();
  notify(first ? "Latihan selesai. " + a.reward + " XP tersimpan." : "Latihan ulang selesai. Penjelasanmu sesuai bukti.");
}
function updateLessonMenu() {
  const select2 = document.querySelector("[data-lesson-select]");
  if (!select2 || view.track === "home") return;
  select2.innerHTML = L[view.track].map((entry, i) => '<option value="' + i + '" ' + (i === view.index ? "selected" : "") + " " + (!canOpen(view.track, i) ? "disabled" : "") + ">" + entry.title + (state.completed[view.track].includes(i) ? " \xB7 selesai" : "") + "</option>").join("");
}
function showProgress() {
  const done = state.completed.bridge.length + state.completed.flow.length;
  document.getElementById("progress-content").innerHTML = '<h2>Perjalanan belajarmu</h2><p>Progres tersimpan pada browser ini.</p><div class="progress-totals"><div><strong>' + done + "/8</strong><span>latihan selesai</span></div><div><strong>" + n(state.xp, 0) + '</strong><span>XP terkumpul</span></div></div><ul class="progress-list"><li><span>Mekanika struktur</span><strong>' + state.completed.bridge.length + " / 5</strong></li><li><span>Hidraulika</span><strong>" + state.completed.flow.length + " / 3</strong></li></ul>";
  document.getElementById("progress-dialog").showModal();
}
document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (link?.classList.contains("skip-link")) {
    event.preventDefault();
    document.getElementById("main").focus();
    document.getElementById("main").scrollIntoView({ block: "start" });
    return;
  }
  if (link && ["#home", "#bridge", "#flow"].includes(link.getAttribute("href"))) {
    event.preventDefault();
    navigate(link.getAttribute("href") === "#home" ? "home" : link.getAttribute("href").slice(1));
    return;
  }
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  if (action === "home") {
    navigate("home");
    return;
  }
  if (action === "start") {
    navigate("bridge");
    return;
  }
  if (action === "go-flow") {
    navigate("flow");
    return;
  }
  if (action === "open-lesson") {
    const track = el.dataset.track, index = Number(el.dataset.index);
    if (canOpen(track, index)) navigate(track, index);
    return;
  }
  if (action === "progress") {
    showProgress();
    return;
  }
  if (action === "reset-dialog") {
    document.getElementById("reset-dialog").showModal();
    return;
  }
  if (action === "close-dialog") {
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    return;
  }
  if (action === "confirm-reset") {
    state = initialState();
    save();
    document.getElementById("reset-dialog").close();
    renderedKey = "";
    navigate("home");
    notify("Progres versi 3 dimulai ulang.");
    return;
  }
  if (action === "camera" || action === "reset-camera") {
    cameraMode = action === "reset-camera" ? "perspective" : el.dataset.camera;
    window.BeamLab3D?.preset(cameraMode);
    const caption = document.getElementById("playback-caption");
    if (caption && view.track === "bridge") caption.textContent = cameraMode === "section" ? "Penampang ekuivalen \xB7 geometri ilustratif, I preset" : "Beban di tengah bentang \xB7 model elastis";
    document.querySelectorAll("[data-camera]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.camera === cameraMode)));
    return;
  }
  if (action === "play") {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      notify("Animasi dinonaktifkan mengikuti preferensi gerak perangkat.");
      return;
    }
    state.settings.paused = false;
    if (cameraMode === "section" && view.track === "bridge") {
      cameraMode = "perspective";
      window.BeamLab3D?.preset("perspective");
      document.querySelectorAll("[data-camera]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.camera === "perspective")));
    }
    const pauseButton = document.querySelector('[data-action="pause"]');
    if (pauseButton) {
      pauseButton.setAttribute("aria-pressed", "false");
      pauseButton.setAttribute("aria-label", "Jeda animasi");
      pauseButton.innerHTML = icon("pause");
    }
    window.BeamLab3D?.pause(false);
    window.BeamLab3D?.play();
    return;
  }
  if (action === "pause") {
    state.settings.paused = !state.settings.paused;
    window.BeamLab3D?.pause(state.settings.paused);
    el.setAttribute("aria-pressed", String(state.settings.paused));
    el.setAttribute("aria-label", state.settings.paused ? "Lanjutkan animasi" : "Jeda animasi");
    el.innerHTML = icon(state.settings.paused ? "play" : "pause");
    save();
    return;
  }
  if (action === "annotations") {
    state.settings.annotations = !state.settings.annotations;
    el.setAttribute("aria-pressed", String(state.settings.annotations));
    window.BeamLab3D?.annotations(state.settings.annotations);
    save();
    return;
  }
  if (view.track === "home") return;
  const a = attempt();
  if (action === "lock-prediction") {
    if (!a.prediction) return;
    a.predictionCorrect = a.prediction === lesson().answer;
    a.phase = "experiment";
    save();
    renderTask();
    renderControls();
    if (window.matchMedia("(max-width:820px)").matches) document.getElementById("scene-host").scrollIntoView({ block: "start", behavior: "smooth" });
    return;
  }
  if (action === "capture") {
    capture();
    return;
  }
  if (action === "submit") {
    submit();
    return;
  }
  if (action === "hint") {
    a.hints = Math.min(3, a.hints + 1);
    save();
    renderTask();
    return;
  }
  if (action === "reset-values") {
    a.params = { ...lesson().start };
    a.feedback = "";
    save();
    renderControls();
    updateResults();
    window.BeamLab3D?.update(view.track, a.params, { baseline: lesson().start });
    notify("Kondisi awal dipulihkan. Catatan percobaan tetap tersimpan.");
    return;
  }
  if (action === "back-experiment") {
    a.phase = "experiment";
    a.feedback = "";
    save();
    renderTask();
    renderControls();
    return;
  }
  if (action === "replay") {
    state.attempts[view.track + ":" + view.index] = newAttempt(view.track, view.index);
    save();
    renderTask();
    renderControls();
    renderNotebook();
    updateResults();
    window.BeamLab3D?.update(view.track, attempt().params, { baseline: lesson().start });
    notify("Latihan baru dimulai. Riwayat dan XP tetap tersimpan.");
    return;
  }
  if (action === "next") {
    navigate(view.track, view.index + 1);
    return;
  }
  if (action === "theory") {
    const note = document.querySelector(".lesson-note");
    if (note) {
      note.open = true;
      note.scrollIntoView({ behavior: "smooth", block: "center" });
    } else notify(lesson().theory);
  }
});
document.addEventListener("input", (event) => {
  const input = event.target;
  if (input.matches("[data-home-load]")) {
    homeParams.P = Number(input.value);
    document.getElementById("home-load-value").textContent = n(homeParams.P, 0) + " ton";
    document.getElementById("home-delta").textContent = n(M.beamResult(homeParams).maximum) + " mm";
    window.BeamLab3D?.update("bridge", homeParams, { baseline: M.BRIDGE_DEFAULTS });
    return;
  }
  if (view.track === "home") return;
  if (input.matches("[data-param]")) syncParam(input.dataset.param, input.value);
  if (input.matches("[data-param-number]")) {
    const value = Number(input.value);
    if (input.value.trim() !== "" && Number.isFinite(value) && value >= Number(input.min) && value <= Number(input.max)) {
      input.removeAttribute("aria-invalid");
      syncParam(input.dataset.paramNumber, value);
    }
  }
  if (input.matches("[data-numeric]")) {
    attempt().numeric = input.value;
    save();
  }
});
document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches("[data-lesson-select]")) {
    navigate(view.track, Number(input.value));
    return;
  }
  if (view.track === "home") return;
  if (input.matches("[data-choice]")) {
    const a = attempt();
    a[input.dataset.choice === "prediction" ? "prediction" : "explanation"] = input.value;
    a.feedback = "";
    save();
    const button = document.querySelector('[data-action="lock-prediction"]');
    if (button) button.disabled = false;
    const feedback = document.getElementById("answer-feedback");
    if (feedback) feedback.replaceChildren();
  }
  if (input.matches("[data-param-number]")) {
    const value = Number(input.value);
    if (input.value.trim() === "" || !Number.isFinite(value) || value < Number(input.min) || value > Number(input.max)) {
      input.setAttribute("aria-invalid", "true");
      return;
    }
    input.removeAttribute("aria-invalid");
    syncParam(input.dataset.paramNumber, value);
  }
  if (input.matches("[data-param-select]")) syncParam(input.dataset.paramSelect, input.value);
});
window.matchMedia("(max-width:600px)").addEventListener("change", () => {
  if (view.track !== "home") updateResults();
});
window.matchMedia("(max-width:820px)").addEventListener("change", () => {
  if (view.track !== "home") positionControls();
});
window.addEventListener("popstate", () => {
  view = route();
  render();
});
window.addEventListener("hashchange", () => {
  view = route();
  render();
});
view = route();
render();
