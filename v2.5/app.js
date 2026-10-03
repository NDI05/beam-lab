const STORE_KEY = 'beamlab-progress-v2-5';
const GRAVITY = 9.81;
const BUDGET_LIMIT = 110;
const DEFLECTION_LIMIT = 20;

const materials = {
  steel: { label: 'Baja', E: 200, cost: 75, asset: 'material-steel.svg', note: 'E 200 GPa · biaya 75 kredit' },
  concrete: { label: 'Beton', E: 30, cost: 45, asset: 'material-concrete.svg', note: 'E 30 GPa · biaya 45 kredit' },
  timber: { label: 'Kayu', E: 12, cost: 30, asset: 'material-timber.svg', note: 'E 12 GPa · biaya 30 kredit' },
};

const profiles = {
  ibeam: { label: 'Profil I', I: 80000, cost: 40, asset: 'profile-ibeam.svg', note: 'I 80.000 cm⁴ · biaya 40 kredit' },
  box: { label: 'Profil box', I: 60000, cost: 30, asset: 'profile-box.svg', note: 'I 60.000 cm⁴ · biaya 30 kredit' },
  rectangle: { label: 'Persegi solid', I: 40000, cost: 15, asset: 'profile-rectangle.svg', note: 'I 40.000 cm⁴ · biaya 15 kredit' },
};

const commonStart = { P: 20, L: 8, material: 'steel', profile: 'rectangle' };

const flowQuestions = [
  {
    title: 'Luas penampang basah', topic: 'Geometri saluran',
    prompt: 'Saluran berbentuk persegi memiliki lebar 2,4 m dan kedalaman air 1,0 m. Berapa luas penampang basahnya?',
    options: [{ id: '2-4', label: '2,4 m²' }, { id: '3-4', label: '3,4 m²' }, { id: '4-8', label: '4,8 m²' }],
    answer: '2-4', explanation: 'Untuk saluran persegi, A = b × y. Jadi A = 2,4 × 1,0 = 2,4 m².',
  },
  {
    title: 'Kedalaman dan debit', topic: 'Pengaruh kedalaman',
    prompt: 'Saluran persegi selebar 3 m memiliki kemiringan dan kekasaran tetap. Jika kedalaman air naik dari 1,2 m menjadi 1,5 m, bagaimana debitnya?',
    options: [{ id: 'up-35', label: 'Naik sekitar 35%' }, { id: 'same', label: 'Tetap sama' }, { id: 'down-20', label: 'Turun sekitar 20%' }],
    answer: 'up-35', explanation: 'Kedalaman yang lebih besar menambah luas A dan jari-jari hidraulik R. Dalam kondisi ini debit Manning naik sekitar 35%.',
  },
  {
    title: 'Kekasaran saluran', topic: 'Koefisien Manning n',
    prompt: 'Bentuk dan kemiringan saluran tidak berubah. Jika koefisien kekasaran Manning n menjadi dua kali lebih besar, apa yang terjadi pada debit?',
    options: [{ id: 'half', label: 'Debit menjadi setengah' }, { id: 'double', label: 'Debit menjadi dua kali' }, { id: 'same', label: 'Debit tetap sama' }],
    answer: 'half', explanation: 'n berada di penyebut rumus Manning. Jika n dilipatgandakan sementara variabel lain tetap, Q menjadi setengah.',
  },
];

const FLOW_DEFAULTS = { width: 3, depth: 1, slope: 0.0015, roughness: 0.015 };

const missions = [
  {
    title: 'Kendaraan melintas', short: 'Beban kendaraan', concept: 'Pengaruh beban P', description: 'Naikkan beban kendaraan dan amati lenturan jembatan.',
    context: 'Sebuah truk berada di tengah bentang. Kita mengubah muatan kendaraan, sambil menjaga jembatan tetap sama.',
    predictionPrompt: 'Muatan naik dari 20 menjadi 30 ton. Seberapa besar perubahan lendutan maksimum?',
    options: [{ id: 'one-five', label: 'Menjadi sekitar 1,5 kali nilai awal' }, { id: 'same', label: 'Tidak berubah karena bentuk jembatan tetap' }, { id: 'double', label: 'Menjadi dua kali lipat' }],
    correctPrediction: 'one-five', focus: 'P', start: { ...commonStart }, targetText: 'Atur muatan truk dari 20 t menjadi 30 t.',
    experimentHint: 'Geser muatan. Truk dan bentuk jembatan akan merespons perubahan beban.', targetCheck: (p) => Math.abs(p.P - 30) < 0.51,
    explainPrompt: 'Apa hubungan beban kendaraan dengan lendutan?',
    explainOptions: [{ id: 'linear', label: 'Lendutan bertambah sebanding dengan beban P.' }, { id: 'inverse', label: 'Lendutan berkurang saat beban bertambah.' }, { id: 'none', label: 'Beban tidak mengubah lendutan.' }], correctExplanation: 'linear',
    insight: 'Untuk kondisi lain yang sama, lendutan berbanding lurus dengan beban titik P.',
  },
  {
    title: 'Material yang berbeda', short: 'Material', concept: 'Pengaruh modulus E', description: 'Bandingkan respons baja dan beton pada bentang yang sama.',
    context: 'Bentuk penampang dan beban kendaraan tetap. Pilih material yang lebih lentur, lalu amati perubahan jembatan.',
    predictionPrompt: 'Jika baja diganti beton, yang memiliki E lebih rendah, apa yang terjadi?',
    options: [{ id: 'more', label: 'Jembatan melendut lebih besar' }, { id: 'less', label: 'Jembatan melendut lebih kecil' }, { id: 'same', label: 'Tidak ada perubahan' }],
    correctPrediction: 'more', focus: 'material', start: { ...commonStart, profile: 'ibeam' }, targetText: 'Ganti material baja dengan beton.',
    experimentHint: 'Pilih beton. Beban, bentang, dan profil tetap.', targetCheck: (p) => p.material === 'concrete',
    explainPrompt: 'Mengapa jembatan dari beton melendut lebih besar pada simulasi ini?',
    explainOptions: [{ id: 'inverse-e', label: 'Modulus E beton lebih rendah, sehingga kekakuan lenturnya lebih kecil.' }, { id: 'load', label: 'Beton menambah beban kendaraan P.' }, { id: 'span', label: 'Material beton membuat bentang L bertambah.' }], correctExplanation: 'inverse-e',
    insight: 'E berada di penyebut rumus lendutan. Jika E berkurang, lendutan bertambah.',
  },
  {
    title: 'Bentuk penampang', short: 'Profil balok', concept: 'Pengaruh momen inersia I', description: 'Lihat bagaimana pilihan profil mengubah kekakuan lentur.',
    context: 'Gunakan material dan bentang yang sama. Bandingkan profil persegi solid dengan profil I.',
    predictionPrompt: 'Profil I memiliki momen inersia dua kali nilai profil persegi solid. Apa efeknya?',
    options: [{ id: 'half', label: 'Lendutan turun menjadi setengahnya' }, { id: 'double', label: 'Lendutan naik menjadi dua kali lipat' }, { id: 'same', label: 'Lendutan tetap sama' }],
    correctPrediction: 'half', focus: 'profile', start: { ...commonStart }, targetText: 'Ganti profil persegi solid dengan profil I.',
    experimentHint: 'Pilih profil I. Material, beban, dan bentang tetap.', targetCheck: (p) => p.profile === 'ibeam',
    explainPrompt: 'Apa peran momen inersia penampang I?',
    explainOptions: [{ id: 'inverse-i', label: 'I yang lebih besar meningkatkan kekakuan lentur dan mengurangi lendutan.' }, { id: 'load', label: 'I mengurangi berat kendaraan.' }, { id: 'area', label: 'Hanya luas total penampang yang memengaruhi lendutan.' }], correctExplanation: 'inverse-i',
    insight: 'Untuk nilai E, P, dan L yang tetap, menggandakan I membagi lendutan maksimum menjadi dua.',
  },
  {
    title: 'Bentang lebih panjang', short: 'Panjang bentang', concept: 'Pengaruh panjang L', description: 'Amati dampak bentang yang bertambah 20%.',
    context: 'Jembatan dibuat lebih panjang tanpa mengubah truk, material, maupun profil.',
    predictionPrompt: 'Bentang bertambah dari 8 m menjadi 9,6 m. Kira-kira berapa kali lendutannya?',
    options: [{ id: 'two', label: 'Sekitar 2,07 kali' }, { id: 'linear', label: 'Sekitar 1,2 kali' }, { id: 'same', label: 'Tetap sama' }],
    correctPrediction: 'two', focus: 'L', start: { ...commonStart, profile: 'ibeam' }, targetText: 'Panjangkan bentang dari 8,0 menjadi 9,6 m.',
    experimentHint: 'Atur panjang bentang ke 9,6 m. Parameter lain tidak berubah.', targetCheck: (p) => Math.abs(p.L - 9.6) < 0.051,
    explainPrompt: 'Mengapa tambahan 20% panjang bentang berdampak besar?',
    explainOptions: [{ id: 'fourth', label: 'L berpangkat tiga pada rumus lendutan maksimum.' }, { id: 'linear', label: 'L hanya berpengaruh secara linier.' }, { id: 'no-l', label: 'Panjang bentang tidak muncul pada rumus.' }], correctExplanation: 'fourth',
    insight: 'Untuk beban titik di tengah bentang, δmaks sebanding dengan L³. Bentang 1,2 kali menghasilkan lendutan 1,2³ = 1,73 kali.',
  },
  {
    title: 'Rancang dalam batas', short: 'Tantangan desain', concept: 'Terapkan konsep', description: 'Pilih material dan profil untuk memenuhi dua target simulasi.',
    context: 'Jembatan harus menahan truk 20 t. Pilihanmu harus memenuhi target lendutan dan batas kredit simulasi.',
    predictionPrompt: 'Apa yang perlu diseimbangkan untuk memenuhi target tantangan?',
    options: [{ id: 'both', label: 'Kekakuan yang cukup dan biaya simulasi yang tidak melewati batas' }, { id: 'cheap', label: 'Pilih material termurah saja' }, { id: 'stiff', label: 'Pilih profil paling kaku tanpa melihat biayanya' }],
    correctPrediction: 'both', focus: 'design', start: { ...commonStart }, targetText: 'Capai δmaks ≤ 20 mm dengan biaya ≤ 110 kredit.',
    experimentHint: 'Ubah material dan profil. Truk 20 t serta bentang 8 m tetap.',
    targetCheck: (p) => calculateCost(p) <= BUDGET_LIMIT && calculateMaximumDeflection(p) <= DEFLECTION_LIMIT,
    explainPrompt: 'Mengapa solusi yang lulus perlu mempertimbangkan kedua batas?',
    explainOptions: [{ id: 'tradeoff', label: 'Profil harus cukup kaku untuk membatasi lendutan, tetapi biaya simulasi juga dibatasi.' }, { id: 'cheap', label: 'Biaya rendah selalu berarti lendutan rendah.' }, { id: 'material-only', label: 'Hanya pilihan material yang berpengaruh.' }], correctExplanation: 'tradeoff',
    insight: 'Profil box dari baja memenuhi target simulasi: biaya 105 kredit dan lendutan sekitar 17,4 mm.',
  },
];

function emptyState() { return { xp: 0, completed: [], activeMission: 0, records: {}, flow: { ...FLOW_DEFAULTS, activeQuestion: 0, completedQuestions: [], selectedAnswer: '', wrongAnswer: false } }; }
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && Array.isArray(saved.completed) && saved.records) return { ...emptyState(), ...saved, flow: { ...emptyState().flow, ...(saved.flow || {}) } };
  } catch (error) { /* Storage is optional; the lab still works without it. */ }
  return emptyState();
}

let state = loadState();
let currentView = 'map';
let toastTimer;
let animationFrame = 0;
let displayedSceneAmplitude = null;

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (error) { /* Keep the current session usable. */ }
}
function freshParameters(index) { return { ...(missions[index].start || commonStart) }; }
function getAttempt(index) {
  if (!state.records[index]) state.records[index] = { phase: 'predict', params: freshParameters(index), selectedPrediction: '', selectedExplanation: '', predictionCorrect: null, explanationCorrect: null, reward: 0 };
  return state.records[index];
}
function nextMission() { const index = missions.findIndex((_, i) => !state.completed.includes(i)); return index < 0 ? missions.length - 1 : index; }
function canOpen(index) { return index === 0 || state.completed.includes(index - 1); }
function nId(value, digits = 1) { return Number(value).toLocaleString('id-ID', { maximumFractionDigits: digits }); }
function materialFor(params) { return materials[params.material] || materials.steel; }
function profileFor(params) { return profiles[params.profile] || profiles.rectangle; }
function calculateCost(params) { return materialFor(params).cost + profileFor(params).cost; }

function calculateDeflectionAt(x, params) {
  const distance = Math.min(x, params.L - x);
  const P = params.P * 1000 * GRAVITY;
  const E = materialFor(params).E * 1e9;
  const I = profileFor(params).I * 1e-8;
  const deflectionM = (P * distance * (3 * params.L * params.L - 4 * distance * distance)) / (48 * E * I);
  return Math.max(0, deflectionM * 1000);
}
function calculateMaximumDeflection(params) {
  const P = params.P * 1000 * GRAVITY;
  const E = materialFor(params).E * 1e9;
  const I = profileFor(params).I * 1e-8;
  return (P * Math.pow(params.L, 3)) / (48 * E * I) * 1000;
}

function renderSidebar() {
  const done = state.completed.length + state.flow.completedQuestions.length;
  const total = missions.length + flowQuestions.length;
  const percent = Math.round((done / total) * 100);
  document.getElementById('journey-fill').style.width = `${percent}%`;
  document.getElementById('journey-count').textContent = `${done} dari ${total} konsep`;
  document.getElementById('journey-percent').textContent = `${percent}%`;
  document.getElementById('xp-total').textContent = nId(state.xp, 0);
  document.getElementById('level-name').textContent = done >= total ? 'Analis teknik sipil' : done >= 4 ? 'Perancang' : done >= 1 ? 'Eksperimenter' : 'Pengamat';
  const active = currentView === 'lab' ? state.activeMission : nextMission();
  document.getElementById('side-missions').innerHTML = missions.map((mission, index) => {
    const complete = state.completed.includes(index);
    const locked = !canOpen(index);
    const current = active === index && !complete;
    return `<button class="side-mission${current ? ' is-current' : ''}${complete ? ' is-complete' : ''}" type="button" data-action="open-mission" data-index="${index}" ${locked ? 'disabled aria-disabled="true"' : ''} aria-label="${complete ? 'Ulangi' : locked ? 'Terkunci' : 'Buka'} misi ${index + 1}: ${mission.title}"><span class="side-mission-index">${complete ? '✓' : String(index + 1).padStart(2, '0')}</span><span class="side-mission-text">${mission.short}</span></button>`;
  }).join('');
  document.getElementById('nav-map').classList.toggle('is-active', currentView === 'map');
  document.getElementById('nav-map').toggleAttribute('aria-current', currentView === 'map');
  document.getElementById('nav-lab').classList.toggle('is-active', currentView === 'lab');
  document.getElementById('nav-lab').toggleAttribute('aria-current', currentView === 'lab');
  document.getElementById('nav-flow').classList.toggle('is-active', currentView === 'flow');
  document.getElementById('nav-flow').toggleAttribute('aria-current', currentView === 'flow');
  document.getElementById('breadcrumb-current').textContent = currentView === 'map' ? 'Peta misi' : currentView === 'flow' ? 'Debit air' : 'Simulasi 2D';
}

function renderMap() {
  const index = nextMission();
  const allDone = state.completed.length === missions.length;
  const mission = missions[index];
  const rows = missions.map((item, i) => {
    const complete = state.completed.includes(i);
    const locked = !canOpen(i);
    const active = i === index && !complete;
    const status = complete ? 'Selesai' : active ? 'Tersedia' : 'Terkunci';
    return `<button class="v2-mission-row${active ? ' is-current' : ''}${complete ? ' is-complete' : ''}" data-action="open-mission" data-index="${i}" type="button" ${locked ? 'disabled aria-disabled="true"' : ''}><span class="v2-node">${complete ? '✓' : String(i + 1).padStart(2, '0')}</span><span><span class="v2-row-title">${item.title}</span><span class="v2-row-desc">${item.description}</span></span><span class="v2-row-status">${status}</span></button>`;
  }).join('');
  document.getElementById('screen-container').innerHTML = `
    <section class="v2-map" aria-labelledby="v2-map-title">
      <div class="v2-hero">
        <div class="v2-hero-copy"><div class="eyebrow"><span class="eyebrow-mark"></span>Studio teknik sipil · versi 2.5</div><h1 id="v2-map-title">Lihat jembatan merespons.</h1><p>Ubah muatan, material, dan profil. Bentuk jembatan bergerak di dunia 2D; grafik menunjukkan angka dan hubungan yang ada di balik perubahan itu.</p><div class="map-cta-row"><button class="primary-button" type="button" data-action="start-current">${allDone ? 'Jelajahi lagi' : state.completed.length ? 'Lanjutkan misi' : 'Masuk ke simulasi'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button><span class="map-cta-note">${allDone ? 'Semua misi jembatan sudah selesai.' : `Misi ${String(index + 1).padStart(2, '0')} · ${mission.short}`}</span></div></div>
        <div class="v2-hero-art" aria-label="Ilustrasi jembatan dengan kendaraan di atas sungai"><svg viewBox="0 0 900 360" role="img" aria-labelledby="hero-scene-title"><title id="hero-scene-title">Jembatan sederhana membawa truk di atas sungai</title><image href="assets/bridge-landscape.svg" width="900" height="360"/><path d="M82 185H818v18H82z" fill="#687f83" stroke="#344f58" stroke-width="3"/><path d="M88 204h724v13H88z" fill="#526970"/><path d="m82 203 18 21h-36l18-21Zm736 0 18 21h-36l18-21Z" fill="#e7efeb" stroke="#405a62" stroke-width="2"/><image href="assets/truck.svg" x="366" y="111" width="170" height="74" preserveAspectRatio="xMidYMid meet"/><path d="M450 80v24" stroke="#dd7445" stroke-width="2" stroke-dasharray="4 4"/><text x="450" y="69" fill="#a65e39" font-size="13" font-family="sans-serif" text-anchor="middle">BEBAN KENDARAAN</text></svg></div>
      </div>
      <div class="map-summary"><div class="summary-item"><span class="summary-value">${state.completed.length}/${missions.length}</span><span class="summary-label">misi selesai</span></div><div class="summary-item"><span class="summary-value">${nId(state.xp, 0)}</span><span class="summary-label">poin pengalaman</span></div><div class="summary-item"><span class="summary-value">2D</span><span class="summary-label">jembatan animasi</span></div></div>
      <section class="v2-path" aria-labelledby="v2-path-title"><div class="v2-path-intro"><div class="eyebrow"><span class="eyebrow-mark"></span>Urutan belajar</div><h2 id="v2-path-title">Jalur misi</h2><p>Mulai dari satu perubahan, lalu gabungkan konsep untuk menyelesaikan tantangan desain simulasi.</p></div><div class="v2-mission-list">${rows}</div></section>
      <section class="v2-topic-card" aria-labelledby="flow-card-title"><div class="v2-topic-art" aria-hidden="true"><svg viewBox="0 0 220 130"><path d="M0 48h52l26 48h64l26-48h52v82H0z" fill="#d4c39e"/><path d="M74 95h72v35H74z" fill="#72b7bd"/><path d="M74 94q18-7 36 0t36 0" fill="none" stroke="#d9f0ed" stroke-width="4"/><path d="M88 108h18m15 0h18" stroke="#f4fbf7" stroke-width="3" stroke-linecap="round"/><path d="M52 47h116" stroke="#657b75" stroke-width="3" stroke-dasharray="5 5"/><path d="M110 21v18m-6-6 6 6 6-6" fill="none" stroke="#dd7445" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="110" y="16" text-anchor="middle" fill="#49696e" font-size="10" font-family="monospace">Q · DEBIT AIR</text></svg></div><div class="v2-topic-copy"><div class="eyebrow"><span class="eyebrow-mark"></span>Materi baru · Hidraulika</div><h2 id="flow-card-title">Ke mana air mengalir?</h2><p>Ubah lebar, kedalaman, kemiringan, dan kekasaran saluran. Amati debit pada ilustrasi 2D dan grafik Manning, lalu jawab tiga soal tantangan.</p><button class="primary-button" type="button" data-action="go-flow">Buka lab debit air<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></div><div class="v2-topic-count"><strong>${state.flow.completedQuestions.length}/3</strong><span>soal tuntas</span></div></section>
    </section>`;
}

function stepper(phase) {
  const steps = [{ id: 'predict', title: 'Prediksi' }, { id: 'experiment', title: 'Ubah & amati' }, { id: 'explain', title: 'Jelaskan' }];
  const active = phase === 'done' ? 2 : steps.findIndex((step) => step.id === phase);
  return steps.map((step, index) => `<div class="v2-step${index === active ? ' is-active' : ''}${index < active || phase === 'done' ? ' is-done' : ''}"><span class="v2-step-number">${index < active || phase === 'done' ? '✓' : index + 1}</span><span>${step.title}</span></div>`).join('');
}

function renderOptions(options, group, selected) {
  return options.map((option) => `<label class="v2-option"><input type="radio" name="${group}" data-choice="${group}" value="${option.id}" ${selected === option.id ? 'checked' : ''}><span>${option.label}</span></label>`).join('');
}

function renderMaterials(selected) {
  return `<div class="v2-asset-group"><div class="v2-asset-heading">Material<small>E · modulus elastisitas</small></div><div class="v2-asset-options">${Object.entries(materials).map(([id, material]) => `<label class="v2-asset-option"><input type="radio" name="material" data-asset-param="material" value="${id}" ${selected === id ? 'checked' : ''}><img src="assets/${material.asset}" alt=""><span><strong>${material.label}</strong><small>E ${material.E} GPa</small></span></label>`).join('')}</div></div>`;
}

function renderProfiles(selected) {
  return `<div class="v2-asset-group"><div class="v2-asset-heading">Profil balok<small>I · momen inersia</small></div><div class="v2-asset-options">${Object.entries(profiles).map(([id, profile]) => `<label class="v2-asset-option"><input type="radio" name="profile" data-asset-param="profile" value="${id}" ${selected === id ? 'checked' : ''}><img src="assets/${profile.asset}" alt=""><span><strong>${profile.label}</strong><small>I ${nId(profile.I, 0)} cm⁴</small></span></label>`).join('')}</div></div>`;
}

function rangeControl(key, value) {
  const specs = key === 'P' ? { label: 'Muatan kendaraan', unit: 'ton', min: 10, max: 50, step: 1, target: 30 } : { label: 'Panjang bentang', unit: 'm', min: 6, max: 12, step: 0.1, target: 9.6 };
  return `<div class="v2-control"><label class="v2-control-label" for="slider-${key}">${specs.label}<small>${key} · ${specs.unit}</small><output class="v2-control-value" id="value-${key}">${nId(value, key === 'L' ? 1 : 0)} ${specs.unit}</output></label><input id="slider-${key}" class="v2-range" type="range" min="${specs.min}" max="${specs.max}" step="${specs.step}" value="${value}" data-param="${key}" aria-label="${specs.label}, ${specs.unit}"><div class="v2-range-ends"><span>${nId(specs.min, 1)} ${specs.unit}</span><span>${nId(specs.max, 1)} ${specs.unit}</span></div></div>`;
}

function renderPredictionPanel(mission, attempt, index) {
  return `<section class="v2-task-panel" aria-label="Prediksi misi"><div class="v2-panel-head"><span class="v2-concept">${mission.concept}</span><span class="v2-mission-number">${String(index + 1).padStart(2, '0')} / 05</span></div><p class="v2-context">${mission.context}</p><h2 class="v2-task-title">Buat prediksi</h2><p class="v2-task-prompt">${mission.predictionPrompt}</p><div class="v2-options">${renderOptions(mission.options, 'prediction', attempt.selectedPrediction)}</div><div class="v2-actions"><button class="primary-button" type="button" data-action="check-prediction" ${attempt.selectedPrediction ? '' : 'disabled'}>Kunci prediksi<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></button></div><p class="v2-hint">Prediksi salah tidak mengurangi poin. Coba, amati, lalu temukan alasannya.</p></section>`;
}

function renderExperimentPanel(mission, attempt, index) {
  const feedback = attempt.predictionCorrect
    ? '<div class="v2-feedback"><strong>Prediksimu tepat.</strong> Lihat respons jembatan saat parameter berubah.</div>'
    : '<div class="v2-feedback is-warm"><strong>Sekarang kita uji.</strong>Perhatikan animasi dan grafik untuk menemukan hubungan sebenarnya.</div>';
  let controls = '';
  if (mission.focus === 'P') controls = rangeControl('P', attempt.params.P);
  if (mission.focus === 'L') controls = rangeControl('L', attempt.params.L);
  if (mission.focus === 'material') controls = renderMaterials(attempt.params.material);
  if (mission.focus === 'profile') controls = renderProfiles(attempt.params.profile);
  if (mission.focus === 'design') controls = `${renderMaterials(attempt.params.material)}${renderProfiles(attempt.params.profile)}<div class="v2-constraints"><div class="v2-constraint"><span>Anggaran tantangan</span><strong id="budget-value">${nId(calculateCost(attempt.params), 0)} / ${BUDGET_LIMIT} kredit</strong></div><div class="v2-constraint"><span>Target lendutan simulasi</span><strong id="safety-value">${nId(calculateMaximumDeflection(attempt.params), 1)} / ${DEFLECTION_LIMIT} mm</strong></div></div>`;
  return `<section class="v2-task-panel" aria-label="Eksperimen misi"><div class="v2-panel-head"><span class="v2-concept">${mission.concept}</span><span class="v2-mission-number">${String(index + 1).padStart(2, '0')} / 05</span></div>${feedback}<h2 class="v2-task-title" style="margin-top:14px">Ubah dan amati</h2><p class="v2-control-intro">${mission.experimentHint}</p><div class="v2-context">${mission.targetText}</div><div class="v2-controls">${controls}</div><div class="v2-constraints live-constraints"><div class="v2-constraint"><span>Lendutan maksimum, δmaks</span><strong id="live-deflection">${nId(calculateMaximumDeflection(attempt.params), 1)} mm</strong></div><div class="v2-constraint"><span>Biaya material + profil</span><strong id="live-cost">${nId(calculateCost(attempt.params), 0)} kredit</strong></div></div><div class="v2-actions"><button class="primary-button" type="button" data-action="check-experiment">Periksa hasil<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button><button class="secondary-button v2-reset" type="button" data-action="reset-values">Pulihkan nilai awal</button></div><div id="v2-feedback-slot" aria-live="polite"></div><p class="v2-hint">Bentuk pada ilustrasi diperbesar agar perubahan terlihat. Grafik dan nilai menunjukkan hasil perhitungan.</p></section>`;
}

function renderExplanationPanel(mission, attempt, index) {
  const result = attempt.explanationCorrect === null ? '' : `<div class="v2-feedback${attempt.explanationCorrect ? '' : ' is-warm'}"><strong>${attempt.explanationCorrect ? 'Tepat.' : 'Simpan hubungan ini.'}</strong>${mission.insight}</div>`;
  return `<section class="v2-task-panel" aria-label="Refleksi misi"><div class="v2-panel-head"><span class="v2-concept">${mission.concept}</span><span class="v2-mission-number">${String(index + 1).padStart(2, '0')} / 05</span></div><p class="v2-context">Eksperimen berhasil. Sekarang hubungkan perubahan pada benda dengan kurva lendutannya.</p><h2 class="v2-task-title">Jelaskan hasilnya</h2><p class="v2-task-prompt">${mission.explainPrompt}</p><div class="v2-options">${renderOptions(mission.explainOptions, 'explanation', attempt.selectedExplanation)}</div>${result}<div class="v2-actions"><button class="primary-button" type="button" data-action="check-explanation" ${attempt.selectedExplanation ? '' : 'disabled'}>${attempt.explanationCorrect === null ? 'Periksa pemahaman' : 'Selesaikan misi'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></button></div><p class="v2-hint">Jawaban membantu kamu menghubungkan simulasi dengan rumus.</p></section>`;
}

function renderDonePanel(mission, attempt, index) {
  const more = index < missions.length - 1;
  return `<section class="v2-task-panel v2-complete" aria-label="Misi selesai"><div class="v2-complete-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></div><div class="v2-panel-head"><span class="v2-concept">Konsep dikuasai</span><span class="v2-mission-number">${String(index + 1).padStart(2, '0')} / 05</span></div><h2>Misi selesai.</h2><p>Kamu sudah membuat prediksi, mengamati jembatan, dan membaca grafik.</p><p class="v2-reward">✳ <strong>+${attempt.reward} XP</strong> ditambahkan ke progresmu.</p><div class="v2-context"><strong>Ingat:</strong> ${mission.insight}</div><div class="v2-actions"><button class="primary-button" type="button" data-action="${more ? 'next-mission' : 'go-map'}">${more ? 'Buka misi berikutnya' : 'Kembali ke peta'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></div></section>`;
}

function panelFor(mission, attempt, index) {
  if (attempt.phase === 'predict') return renderPredictionPanel(mission, attempt, index);
  if (attempt.phase === 'experiment') return renderExperimentPanel(mission, attempt, index);
  if (attempt.phase === 'explain') return renderExplanationPanel(mission, attempt, index);
  return renderDonePanel(mission, attempt, index);
}

function sceneMarkup(params) {
  return `<svg class="v2-scene-svg" id="bridge-scene" viewBox="0 0 900 360" role="img" aria-labelledby="scene-title scene-description">
    <title id="scene-title">Animasi jembatan dan truk</title><desc id="scene-description">Jembatan sederhana di atas sungai melendut mengikuti beban kendaraan. Bentuk deformasi diperbesar supaya terlihat.</desc>
    <defs><linearGradient id="deckFill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#798e91"/><stop offset="1" stop-color="#536a70"/></linearGradient><linearGradient id="girderFill" x1="0" y1="0" x2="0" y2="1"><stop id="girder-stop-top" stop-color="#78949a"/><stop id="girder-stop-bottom" offset="1" stop-color="#3e6872"/></linearGradient></defs>
    <image href="assets/bridge-landscape.svg" width="900" height="360"/>
    <path d="M0 183h89v26H0zM811 183h89v26h-89z" fill="#91a78c"/>
    <path d="m80 201 20 23H60l20-23Zm740 0 20 23h-40l20-23Z" fill="#e8efea" stroke="#405a62" stroke-width="2"/>
    <path id="scene-baseline" d="" fill="none" stroke="#f7f9f7" stroke-width="2" stroke-dasharray="6 6" opacity=".86"/>
    <path id="scene-deck" d="" fill="url(#deckFill)" stroke="#344f58" stroke-width="2" stroke-linejoin="round"/>
    <path id="scene-girder" d="" fill="url(#girderFill)" stroke="#254b55" stroke-width="2" stroke-linejoin="round"/>
    <path id="scene-rail" d="" fill="none" stroke="#223c46" stroke-width="4" stroke-linecap="round"/>
    <g id="scene-posts" fill="#526a70" stroke="#273f49" stroke-width="1.2"></g>
    <image id="scene-truck" href="assets/truck.svg" x="375" y="120" width="150" height="66" preserveAspectRatio="xMidYMid meet"/>
    <path id="scene-load-line" d="" stroke="#dd7445" stroke-width="2" stroke-dasharray="4 4"/>
    <g id="profile-callout"><rect x="732" y="16" width="151" height="82" rx="5" fill="#f7faf7" fill-opacity=".9" stroke="#d3dfdc"/><text x="743" y="32" fill="#657d82" font-family="sans-serif" font-size="8" font-weight="700">POTONGAN PROFIL</text><image id="scene-profile-image" href="assets/profile-rectangle.svg" x="743" y="39" width="46" height="46"/><text id="scene-material-text" x="797" y="57" fill="#47656b" font-family="sans-serif" font-size="9">Baja</text><text id="scene-profile-text" x="797" y="72" fill="#71858a" font-family="sans-serif" font-size="8">Persegi solid</text></g>
    <rect x="18" y="326" width="194" height="20" rx="3" fill="#f7faf7" fill-opacity=".78"/>
    <text x="28" y="340" fill="#45666d" font-family="sans-serif" font-size="9">BENTUK LENDUTAN DIPERBESAR</text>
    <text id="scene-load-text" x="450" y="91" text-anchor="middle" fill="#a65e39" font-family="monospace" font-size="11" font-weight="700">20 t</text>
  </svg>`;
}

function renderLab() {
  const index = state.activeMission;
  const mission = missions[index];
  const attempt = getAttempt(index);
  document.getElementById('screen-container').innerHTML = `<section class="v2-lab" aria-labelledby="v2-lab-title">
    <div class="v2-lab-heading"><div class="v2-lab-title"><div class="eyebrow"><span class="eyebrow-mark"></span>Misi ${String(index + 1).padStart(2, '0')} · ${mission.concept}</div><h1 id="v2-lab-title">${mission.title}</h1><p>${mission.description} Perhatikan bentuk jembatan, lalu gunakan grafik untuk membaca besar lendutannya.</p></div><button class="secondary-button" type="button" data-action="go-map"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>Peta misi</button></div>
    <div class="v2-stepper" aria-label="Tahapan misi">${stepper(attempt.phase)}</div>
    <div class="v2-layout">${panelFor(mission, attempt, index)}
      <section class="v2-visual-panel" aria-labelledby="scene-heading"><div class="v2-visual-heading"><div><h2 id="scene-heading">Jembatan dalam simulasi</h2><p>Truk, bentang, dan kurva berubah bersama parameter.</p></div><span class="v2-scene-badge">Animasi 2D aktif</span></div>
        <div class="v2-scene-wrap">${sceneMarkup(attempt.params)}<div class="v2-scene-hud"><span>Beban kendaraan</span><strong id="hud-load">${nId(attempt.params.P, 0)} t</strong></div><div class="v2-scene-caption"><span id="hud-material">${materialFor(attempt.params).label} · E ${materialFor(attempt.params).E} GPa</span><strong id="hud-profile">${profileFor(attempt.params).label} · I ${nId(profileFor(attempt.params).I, 0)} cm⁴</strong></div></div>
        <div class="v2-graph-head"><h3>Grafik lendutan · posisi vs perubahan bentuk</h3><span>Garis putus-putus = kondisi awal</span></div><div class="v2-chart-wrap"><svg id="deflection-chart" viewBox="0 0 720 300" role="img" aria-labelledby="chart-title chart-description"></svg></div>
        <div class="v2-result-row"><div><div class="v2-result-label">Lendutan maksimum, δmaks</div><div class="v2-result-value" id="result-maximum">—<small>mm</small></div></div><div class="v2-result-meta" id="result-location">Di tengah bentang</div></div>
        <div class="v2-equation"><code>δmaks = P L³ / 48 E I</code><span>beban titik di tengah bentang · elastis linier</span></div>
      </section>
    </div>
    <p class="v2-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v4m0 4h.01M10 3.8 2.9 17a2 2 0 0 0 1.8 3h14.6a2 2 0 0 0 1.8-3L14 3.8a2.3 2.3 0 0 0-4 0Z"/></svg>Model pembelajaran: balok sederhana dengan beban titik kendaraan di tengah bentang. Bentuk deformasi pada ilustrasi diperbesar; target biaya dan lendutan adalah aturan tantangan simulasi, bukan standar atau rekomendasi desain nyata.</p>
  </section>`;
  updateVisuals(attempt.params, freshParameters(index), false);
}

function flowDischarge(params, depth = params.depth) {
  const area = params.width * depth;
  const wettedPerimeter = params.width + (2 * depth);
  const hydraulicRadius = area / wettedPerimeter;
  const discharge = (1 / params.roughness) * area * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(params.slope);
  return { area, wettedPerimeter, hydraulicRadius, discharge };
}

function flowRangeControl(key, value, label, unit, min, max, step, digits = 1) {
  return `<div class="v2-control"><label class="v2-control-label" for="flow-${key}">${label}<small>${unit}</small><output class="v2-control-value" id="flow-value-${key}">${nId(value, digits)} ${unit}</output></label><input id="flow-${key}" class="v2-range" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-flow-param="${key}" aria-label="${label}, ${unit}"><div class="v2-range-ends"><span>${nId(min, digits)} ${unit}</span><span>${nId(max, digits)} ${unit}</span></div></div>`;
}

function flowQuestionMarkup() {
  const flow = state.flow;
  const index = flow.activeQuestion;
  if (index >= flowQuestions.length) {
    return `<div class="flow-quiz flow-quiz-complete"><div class="v2-panel-head"><span class="v2-concept">Jalur soal selesai</span><span class="v2-mission-number">3 / 3</span></div><div class="v2-complete-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></div><h2>Debit air sudah kamu kuasai.</h2><p>Kamu sudah berlatih menghitung luas, membaca pengaruh kedalaman, dan memahami kekasaran Manning.</p><p class="v2-reward">✳ <strong>${flow.completedQuestions.length}/3 soal tuntas</strong></p><button class="secondary-button" type="button" data-action="restart-flow-questions">Ulangi soal</button></div>`;
  }
  const question = flowQuestions[index];
  const solved = flow.completedQuestions.includes(index);
  const feedback = solved
    ? `<div class="v2-feedback"><strong>Jawaban tepat · +15 XP</strong>${question.explanation}</div>`
    : flow.wrongAnswer
      ? `<div class="v2-feedback is-warm"><strong>Belum tepat. Coba lagi.</strong>Gunakan petunjuk: ${question.explanation}</div>`
      : '';
  const options = question.options.map((option) => `<label class="v2-option"><input type="radio" name="flow-answer" data-flow-choice value="${option.id}" ${flow.selectedAnswer === option.id ? 'checked' : ''}><span>${option.label}</span></label>`).join('');
  return `<div class="flow-quiz"><div class="v2-panel-head"><span class="v2-concept">${question.topic}</span><span class="v2-mission-number">SOAL ${String(index + 1).padStart(2, '0')} / 03</span></div><div class="flow-progress" aria-label="Progres soal ${index + 1} dari 3">${flowQuestions.map((_, itemIndex) => `<span class="${flow.completedQuestions.includes(itemIndex) ? 'is-done' : itemIndex === index ? 'is-current' : ''}"></span>`).join('')}</div><h2 class="v2-task-title">${question.title}</h2><p class="v2-task-prompt">${question.prompt}</p><div class="v2-options">${options}</div>${feedback}<div class="v2-actions">${solved ? '<button class="primary-button" type="button" data-action="next-flow-question">Lanjut soal berikutnya<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>' : `<button class="primary-button" type="button" data-action="check-flow-answer" ${flow.selectedAnswer ? '' : 'disabled'}>Periksa jawaban<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></button>`}</div><p class="v2-hint">Tiap soal memberi 15 XP satu kali. Kamu bisa mencoba lagi tanpa kehilangan poin.</p></div>`;
}

function renderFlow() {
  const flow = state.flow;
  document.getElementById('screen-container').innerHTML = `<section class="v2-lab v2-flow" aria-labelledby="flow-title">
    <div class="v2-lab-heading"><div class="v2-lab-title"><div class="eyebrow"><span class="eyebrow-mark"></span>Hidraulika · saluran terbuka</div><h1 id="flow-title">Ukur aliran air.</h1><p>Atur bentuk dan kondisi saluran. Kedalaman air, visualisasi 2D, debit hasil hitung, serta kurva Manning bergerak bersama.</p></div><button class="secondary-button" type="button" data-action="go-map"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>Peta belajar</button></div>
    <div class="v2-layout"><section class="v2-task-panel flow-task-panel" aria-label="Kontrol debit dan soal tantangan"><div class="v2-panel-head"><span class="v2-concept">Lab debit air</span><span class="v2-mission-number">Manning</span></div><p class="v2-context">Model awal memakai saluran persegi panjang dengan aliran seragam. Geser variabel, lalu selesaikan tiga soal di bawah.</p><div class="v2-controls flow-controls">${flowRangeControl('width', flow.width, 'Lebar dasar saluran', 'b · m', 1, 6, 0.1, 1)}${flowRangeControl('depth', flow.depth, 'Kedalaman air', 'y · m', 0.2, 2.5, 0.05, 2)}${flowRangeControl('slope', flow.slope, 'Kemiringan dasar', 'S · m/m', 0.0005, 0.01, 0.0005, 4)}<label class="v2-control-label flow-roughness-label" for="flow-roughness">Kekasaran permukaan<small>n · Manning</small></label><select class="flow-select" id="flow-roughness" data-flow-roughness aria-label="Koefisien kekasaran Manning"><option value="0.01" ${flow.roughness === 0.01 ? 'selected' : ''}>Beton sangat halus · n 0,010</option><option value="0.015" ${flow.roughness === 0.015 ? 'selected' : ''}>Beton umum · n 0,015</option><option value="0.025" ${flow.roughness === 0.025 ? 'selected' : ''}>Saluran tanah · n 0,025</option></select></div><div class="flow-quiz-heading"><span>Bank soal</span><span>3 tantangan · 45 XP</span></div>${flowQuestionMarkup()}</section>
      <section class="v2-visual-panel" aria-labelledby="flow-scene-heading"><div class="v2-visual-heading"><div><h2 id="flow-scene-heading">Penampang saluran</h2><p>Air memenuhi saluran; panah bergerak menunjukkan arah aliran.</p></div><span class="v2-scene-badge">Aliran 2D aktif</span></div><div class="v2-scene-wrap flow-scene-wrap"><svg id="flow-scene" class="flow-scene-svg" viewBox="0 0 800 320" role="img" aria-labelledby="flow-scene-title flow-scene-description"></svg></div><div class="flow-scene-caption"><span id="flow-scene-caption">Saluran persegi · beton umum</span><strong id="flow-slope-caption">Kemiringan 0,0015 m/m</strong></div><div class="v2-graph-head"><h3>Grafik debit terhadap kedalaman · Q vs y</h3><span>Lebar, S, dan n mengikuti pilihan saat ini</span></div><div class="v2-chart-wrap flow-chart-wrap"><svg id="flow-chart" viewBox="0 0 720 270" role="img" aria-label="Grafik hubungan debit dan kedalaman"></svg></div><div class="flow-metrics"><div class="v2-result-row"><div><div class="v2-result-label">Debit aliran, Q</div><div class="v2-result-value" id="flow-result">—<small>m³/s</small></div></div><div class="v2-result-meta" id="flow-result-meta">A — m² · R — m</div></div><div class="flow-mini-metric"><span>Luas basah A</span><strong id="flow-area">— m²</strong></div><div class="flow-mini-metric"><span>Jari-jari hidraulik R</span><strong id="flow-radius">— m</strong></div></div><div class="v2-equation"><code>Q = (1/n) A R<sup>2/3</sup> S<sup>1/2</sup></code><span>R = A/P · saluran persegi: A = b y, P = b + 2y</span></div></section>
    </div><p class="v2-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v4m0 4h.01M10 3.8 2.9 17a2 2 0 0 0 1.8 3h14.6a2 2 0 0 0 1.8-3L14 3.8a2.3 2.3 0 0 0-4 0Z"/></svg>Asumsi materi: saluran terbuka berbentuk persegi, aliran seragam, dan kemiringan energi dianggap sama dengan kemiringan dasar. Nilai n adalah preset latihan; hasil ini untuk belajar konsep dan bukan perencanaan banjir atau desain drainase.</p>
  </section>`;
  updateFlowVisuals(flow);
}

function renderFlowScene(params) {
  const { area, hydraulicRadius, discharge } = flowDischarge(params);
  const bedY = 258;
  const waterHeight = Math.max(10, Math.min(100, params.depth * 40));
  const surfaceY = bedY - waterHeight;
  const channelWidth = 110 + (params.width * 60);
  const left = 400 - channelWidth / 2;
  const right = 400 + channelWidth / 2;
  const waterLeft = left + 5;
  const waterRight = right - 5;
  const roughnessLabel = params.roughness === 0.01 ? 'beton sangat halus' : params.roughness === 0.025 ? 'saluran tanah' : 'beton umum';
  return `<title id="flow-scene-title">Penampang saluran terbuka dengan debit ${nId(discharge, 2)} meter kubik per detik</title><desc id="flow-scene-description">Saluran persegi memiliki lebar ${nId(params.width, 1)} meter dan kedalaman air ${nId(params.depth, 2)} meter. Luas basah ${nId(area, 2)} meter persegi dan jari-jari hidraulik ${nId(hydraulicRadius, 2)} meter.</desc><defs><linearGradient id="flow-water-gradient" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#91d4d1"/><stop offset="1" stop-color="#348c9b"/></linearGradient><clipPath id="flow-water-clip"><rect x="${waterLeft}" y="${surfaceY}" width="${waterRight - waterLeft}" height="${waterHeight}" rx="2"/></clipPath></defs><rect width="800" height="320" fill="#dcebea"/><path d="M0 0h800v147H0z" fill="#dcebea"/><circle cx="683" cy="56" r="23" fill="#f2dbab" opacity=".82"/><path d="M0 156H${left - 52}L${left} 258H0Z M800 156H${right + 52}L${right} 258H800Z" fill="#bda77d"/><path d="M0 156H${left}V${bedY}H0Z M800 156H${right}V${bedY}H800Z" fill="#b8a176"/><path d="M${left} 155V${bedY}H${right}V155" fill="none" stroke="#887759" stroke-width="9" stroke-linejoin="round"/><rect x="${waterLeft}" y="${surfaceY}" width="${waterRight - waterLeft}" height="${waterHeight}" fill="url(#flow-water-gradient)"/><path d="M${waterLeft} ${surfaceY + 2}h${waterRight - waterLeft}" fill="none" stroke="#e3f5ee" stroke-width="3" opacity=".92"/><g clip-path="url(#flow-water-clip)" class="flow-current"><path d="M${waterLeft - 80} ${surfaceY + waterHeight * .42}h40m-9-6 9 6-9 6M${waterLeft + 60} ${surfaceY + waterHeight * .68}h40m-9-6 9 6-9 6M${waterLeft + 210} ${surfaceY + waterHeight * .43}h40m-9-6 9 6-9 6" fill="none" stroke="#e9fbf5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g><line x1="${left}" y1="${surfaceY - 29}" x2="${right}" y2="${surfaceY - 29}" stroke="#506d70" stroke-width="1.4"/><path d="m${left + 5} ${surfaceY - 33} -5 4 5 4m${right - 5} ${surfaceY - 33} 5 4-5 4" fill="none" stroke="#506d70" stroke-width="1.4"/><text x="400" y="${surfaceY - 37}" text-anchor="middle" fill="#375e65" font-size="13" font-family="monospace" font-weight="700">b = ${nId(params.width, 1)} m</text><line x1="${right + 23}" y1="${surfaceY}" x2="${right + 23}" y2="${bedY}" stroke="#dd7445" stroke-width="2"/><path d="m${right + 19} ${surfaceY + 5} 4-5 4 5m-8 ${waterHeight - 5} 4 5 4-5" fill="none" stroke="#dd7445" stroke-width="2"/><text x="${right + 33}" y="${surfaceY + waterHeight / 2}" fill="#9c5939" font-size="11" font-family="monospace">y ${nId(params.depth, 2)} m</text><rect x="18" y="20" width="192" height="49" rx="4" fill="#f8faf7" fill-opacity=".9" stroke="#cfddda"/><text x="30" y="39" fill="#72868a" font-size="9" font-family="sans-serif">DEBIT HITUNGAN</text><text x="30" y="57" fill="#177d85" font-size="15" font-family="monospace" font-weight="700">${nId(discharge, 2)} m³/s</text><rect x="18" y="282" width="225" height="22" rx="3" fill="#f8faf7" fill-opacity=".85"/><text x="29" y="297" fill="#587178" font-size="9" font-family="sans-serif">PENAMPANG PERSEGI · ${roughnessLabel.toUpperCase()}</text><path d="M310 125h64m-12-7 12 7-12 7M426 125h64m-12-7 12 7-12 7" fill="none" stroke="#177d85" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="flow-direction-mark"/>`;
}

function drawFlowChart(params) {
  const svg = document.getElementById('flow-chart');
  if (!svg) return;
  const plot = { x: 76, y: 22, width: 610, height: 177 };
  const depthMax = 2.5;
  const maxDischarge = flowDischarge(params, depthMax).discharge;
  const yMax = Math.max(1, maxDischarge * 1.12);
  const bottom = plot.y + plot.height;
  const hGrid = Array.from({ length: 5 }, (_, index) => {
    const y = plot.y + plot.height * index / 4;
    const value = yMax * (1 - index / 4);
    return `<line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" stroke="#d4dfdf"/><text x="${plot.x - 10}" y="${y + 3}" fill="#768b90" font-size="8" text-anchor="end">${nId(value, 1)}</text>`;
  }).join('');
  const vGrid = Array.from({ length: 6 }, (_, index) => {
    const depth = depthMax * index / 5;
    const x = plot.x + plot.width * index / 5;
    return `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${bottom}" stroke="#d4dfdf"/><text x="${x}" y="${bottom + 16}" fill="#768b90" font-size="8" text-anchor="middle">${nId(depth, 1)}</text>`;
  }).join('');
  const points = Array.from({ length: 81 }, (_, index) => {
    const depth = depthMax * index / 80;
    const x = plot.x + plot.width * depth / depthMax;
    const y = bottom - plot.height * flowDischarge(params, depth).discharge / yMax;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const pointX = plot.x + plot.width * params.depth / depthMax;
  const pointY = bottom - plot.height * flowDischarge(params).discharge / yMax;
  svg.innerHTML = `<title>Debit Manning meningkat terhadap kedalaman</title><desc>Grafik Q terhadap y untuk lebar, kemiringan, dan kekasaran yang dipilih. Titik aktif menunjukkan Q ${nId(flowDischarge(params).discharge, 2)} meter kubik per detik pada kedalaman ${nId(params.depth, 2)} meter.</desc><text x="15" y="18" fill="#647b81" font-size="8">Q (m³/s)</text>${hGrid}${vGrid}<line x1="${plot.x}" y1="${plot.y}" x2="${plot.x}" y2="${bottom}" stroke="#8fa1a4"/><line x1="${plot.x}" y1="${bottom}" x2="${plot.x + plot.width}" y2="${bottom}" stroke="#8fa1a4"/><text x="${plot.x + plot.width}" y="${bottom + 34}" fill="#647b81" font-size="8" text-anchor="end">kedalaman y (m)</text><path d="${points}" fill="none" stroke="#177d85" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><line x1="${pointX}" y1="${pointY}" x2="${pointX}" y2="${bottom}" stroke="#dd7445" stroke-dasharray="4 4"/><circle cx="${pointX}" cy="${pointY}" r="5" fill="#dd7445" stroke="#f7f9f7" stroke-width="2"/>`;
}

function updateFlowVisuals(params) {
  const outputs = { width: 'm', depth: 'm', slope: 'm/m' };
  for (const key of Object.keys(outputs)) {
    const output = document.getElementById(`flow-value-${key}`);
    if (output) output.textContent = `${nId(params[key], key === 'slope' ? 4 : key === 'depth' ? 2 : 1)} ${outputs[key]}`;
  }
  const values = flowDischarge(params);
  const scene = document.getElementById('flow-scene');
  if (scene) {
    scene.innerHTML = renderFlowScene(params);
    const velocity = values.discharge / values.area;
    const flowCurrent = scene.querySelector('.flow-current');
    if (flowCurrent) flowCurrent.style.animationDuration = `${Math.max(0.75, Math.min(4, 2.8 / velocity))}s`;
  }
  drawFlowChart(params);
  const discharge = document.getElementById('flow-result');
  if (discharge) discharge.innerHTML = `${nId(values.discharge, 2)}<small>m³/s</small>`;
  const meta = document.getElementById('flow-result-meta');
  if (meta) meta.textContent = `A ${nId(values.area, 2)} m² · R ${nId(values.hydraulicRadius, 2)} m`;
  const area = document.getElementById('flow-area');
  if (area) area.textContent = `${nId(values.area, 2)} m²`;
  const radius = document.getElementById('flow-radius');
  if (radius) radius.textContent = `${nId(values.hydraulicRadius, 2)} m`;
  const caption = document.getElementById('flow-scene-caption');
  if (caption) caption.textContent = `Saluran persegi · ${params.roughness === 0.01 ? 'beton sangat halus' : params.roughness === 0.025 ? 'saluran tanah' : 'beton umum'}`;
  const slopeCaption = document.getElementById('flow-slope-caption');
  if (slopeCaption) slopeCaption.textContent = `Kemiringan ${nId(params.slope, 4)} m/m`;
}

function curvePath(params, xMax, plot, mmToY) {
  const points = [];
  const steps = 90;
  for (let index = 0; index <= steps; index += 1) {
    const f = index / steps;
    const xValue = params.L * f;
    const x = plot.x + (xValue / xMax) * plot.width;
    const y = plot.y + calculateDeflectionAt(xValue, params) * mmToY;
    points.push(`${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

function drawChart(current, baseline) {
  const svg = document.getElementById('deflection-chart');
  if (!svg) return;
  const plot = { x: 76, y: 24, width: 610, height: 205 };
  const maxCurrent = calculateMaximumDeflection(current);
  const maxBase = calculateMaximumDeflection(baseline);
  const range = Math.max(.2, Math.max(maxCurrent, maxBase) * 1.24);
  const xMax = Math.max(current.L, baseline.L);
  const y = plot.y + plot.height;
  const hGrid = Array.from({ length: 6 }, (_, i) => {
    const lineY = plot.y + (plot.height * i / 5);
    const val = range * i / 5;
    return `<line x1="${plot.x}" y1="${lineY}" x2="${plot.x + plot.width}" y2="${lineY}" stroke="#d4dfdf"/><text x="${plot.x - 11}" y="${lineY + 3}" fill="#768b90" font-size="8" text-anchor="end">${nId(val, val < 1 ? 2 : 1)}</text>`;
  }).join('');
  const vGrid = Array.from({ length: 5 }, (_, i) => {
    const fraction = i / 4;
    const x = plot.x + plot.width * fraction;
    return `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${y}" stroke="#d4dfdf"/><text x="${x}" y="${y + 17}" fill="#768b90" font-size="8" text-anchor="middle">${nId(xMax * fraction, 1)}</text>`;
  }).join('');
  const currentCurve = curvePath(current, xMax, plot, plot.height / range);
  const baseCurve = curvePath(baseline, xMax, plot, plot.height / range);
  const centerX = plot.x + (current.L / 2 / xMax) * plot.width;
  const centerY = plot.y + maxCurrent * plot.height / range;
  const labelRight = centerX < plot.x + plot.width - 84;
  const result = document.getElementById('result-maximum');
  svg.innerHTML = `<title id="chart-title">Kurva lendutan balok</title><desc id="chart-description">Kondisi eksperimen menunjukkan lendutan maksimum ${nId(maxCurrent, 2)} mm. Beban kendaraan titik berada di tengah bentang.</desc><text x="16" y="18" fill="#647b81" font-size="8">δ (mm)</text>${hGrid}${vGrid}<line x1="${plot.x}" y1="${plot.y}" x2="${plot.x}" y2="${y}" stroke="#8fa1a4"/><line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" stroke="#8fa1a4"/><text x="${plot.x + plot.width}" y="${y + 34}" fill="#647b81" font-size="8" text-anchor="end">x (m)</text><path d="${baseCurve}" fill="none" stroke="#89999c" stroke-width="1.7" stroke-dasharray="5 5"/><path d="${currentCurve}" fill="none" stroke="#177d85" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><line x1="${centerX}" y1="${plot.y}" x2="${centerX}" y2="${centerY}" stroke="#dd7445" stroke-width="1" stroke-dasharray="3 4"/><circle cx="${centerX}" cy="${centerY}" r="4.5" fill="#dd7445" stroke="#f7f9f7" stroke-width="2"/><text x="${centerX + (labelRight ? 9 : -9)}" y="${Math.max(plot.y + 12, centerY - 8)}" fill="#a65e39" font-size="8" text-anchor="${labelRight ? 'start' : 'end'}">δmaks</text>`;
  if (result) result.innerHTML = `${nId(maxCurrent, 2)}<small>mm</small>`;
  const location = document.getElementById('result-location');
  if (location) location.textContent = `P di tengah · x = ${nId(current.L / 2, 1)} m`;
}

function normalizedShape(fraction) {
  const normalizedX = Math.min(fraction, 1 - fraction);
  return normalizedX * (3 - 4 * normalizedX * normalizedX);
}

function sceneAmplitude(params) {
  return Math.max(2, Math.min(74, calculateMaximumDeflection(params) * .78));
}

function makeBridgePaths(amplitude, params) {
  const start = 80;
  const end = 820;
  const baseY = 191;
  const girderDepth = params.profile === 'ibeam' ? 30 : params.profile === 'box' ? 25 : 17;
  const count = 50;
  const tops = [];
  const girderTops = [];
  const girderBottoms = [];
  const rails = [];
  const posts = [];
  for (let i = 0; i <= count; i += 1) {
    const f = i / count;
    const x = start + (end - start) * f;
    const def = normalizedShape(f) * amplitude;
    const top = baseY + def;
    tops.push([x, top]);
    rails.push([x, top - 17]);
    girderTops.push([x, top + 17]);
    girderBottoms.push([x, top + 16 + girderDepth]);
    if (i > 0 && i < count && i % 5 === 0) posts.push(`<path d="M${x - 2} ${top - 17}v17h4v-17Z"/>`);
  }
  const line = (points) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const reverseLine = (points) => [...points].reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const deckBottom = tops.map(([x, y]) => [x, y + 15]);
  const girderBottom = girderBottoms;
  const deckPath = `${line(tops)} ${reverseLine(deckBottom)} Z`;
  const girderPath = `${line(girderTops)} ${reverseLine(girderBottom)} Z`;
  const railPath = line(rails);
  const centerY = baseY + amplitude - 62;
  return { deckPath, girderPath, railPath, posts: posts.join(''), truckY: centerY, loadLine: `M450 ${centerY + 56}v${Math.max(8, amplitude * .42)}` };
}

function drawScene(params, baseline) {
  const scene = document.getElementById('bridge-scene');
  if (!scene) return;
  const amp = sceneAmplitude(params);
  const baseAmp = sceneAmplitude(baseline);
  const currentPath = makeBridgePaths(amp, params);
  const baselinePath = makeBridgePaths(baseAmp, baseline);
  const deck = scene.querySelector('#scene-deck');
  const girder = scene.querySelector('#scene-girder');
  const rail = scene.querySelector('#scene-rail');
  const base = scene.querySelector('#scene-baseline');
  const posts = scene.querySelector('#scene-posts');
  const truck = scene.querySelector('#scene-truck');
  const loadLine = scene.querySelector('#scene-load-line');
  if (deck) deck.setAttribute('d', currentPath.deckPath);
  if (girder) girder.setAttribute('d', currentPath.girderPath);
  if (rail) rail.setAttribute('d', currentPath.railPath);
  if (base) base.setAttribute('d', baselinePath.railPath);
  if (posts) posts.innerHTML = currentPath.posts;
  if (truck) truck.setAttribute('y', currentPath.truckY.toFixed(1));
  if (loadLine) loadLine.setAttribute('d', currentPath.loadLine);
  updateSceneAssets(scene, params);
  const loadText = scene.querySelector('#scene-load-text');
  if (loadText) loadText.textContent = `${nId(params.P, 0)} t`;
}

function updateConstraintIndicators(params) {
  const budget = document.getElementById('budget-value');
  if (budget) {
    const cost = calculateCost(params);
    budget.textContent = `${nId(cost, 0)} / ${BUDGET_LIMIT} kredit`;
    budget.classList.toggle('is-pass', cost <= BUDGET_LIMIT);
    budget.classList.toggle('is-fail', cost > BUDGET_LIMIT);
  }
  const safety = document.getElementById('safety-value');
  if (safety) {
    const dmax = calculateMaximumDeflection(params);
    safety.textContent = `${nId(dmax, 1)} / ${DEFLECTION_LIMIT} mm`;
    safety.classList.toggle('is-pass', dmax <= DEFLECTION_LIMIT);
    safety.classList.toggle('is-fail', dmax > DEFLECTION_LIMIT);
  }
  const liveDeflection = document.getElementById('live-deflection');
  if (liveDeflection) liveDeflection.textContent = `${nId(calculateMaximumDeflection(params), 1)} mm`;
  const liveCost = document.getElementById('live-cost');
  if (liveCost) liveCost.textContent = `${nId(calculateCost(params), 0)} kredit`;
  const load = document.getElementById('hud-load');
  if (load) load.textContent = `${nId(params.P, 0)} t`;
  const material = document.getElementById('hud-material');
  if (material) material.textContent = `${materialFor(params).label} · E ${materialFor(params).E} GPa`;
  const profile = document.getElementById('hud-profile');
  if (profile) profile.textContent = `${profileFor(params).label} · I ${nId(profileFor(params).I, 0)} cm⁴`;
}

function updateVisuals(params, baseline, animate = true) {
  window.cancelAnimationFrame(animationFrame);
  const target = sceneAmplitude(params);
  const start = displayedSceneAmplitude === null ? target : displayedSceneAmplitude;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate || reducedMotion || Math.abs(target - start) < .1) {
    displayedSceneAmplitude = target;
    drawScene(params, baseline);
  } else {
    const begin = performance.now();
    const duration = 460;
    const frame = (now) => {
      const t = Math.min(1, (now - begin) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const amp = start + (target - start) * eased;
      displayedSceneAmplitude = amp;
      drawSceneAtAmplitude(params, baseline, amp);
      if (t < 1) animationFrame = window.requestAnimationFrame(frame);
    };
    animationFrame = window.requestAnimationFrame(frame);
  }
  drawChart(params, baseline);
  updateConstraintIndicators(params);
}

function drawSceneAtAmplitude(params, baseline, amplitude) {
  const scene = document.getElementById('bridge-scene');
  if (!scene) return;
  const path = makeBridgePaths(amplitude, params);
  const basePath = makeBridgePaths(sceneAmplitude(baseline), baseline);
  scene.querySelector('#scene-deck')?.setAttribute('d', path.deckPath);
  scene.querySelector('#scene-girder')?.setAttribute('d', path.girderPath);
  scene.querySelector('#scene-rail')?.setAttribute('d', path.railPath);
  scene.querySelector('#scene-baseline')?.setAttribute('d', basePath.railPath);
  scene.querySelector('#scene-posts').innerHTML = path.posts;
  scene.querySelector('#scene-truck').setAttribute('y', path.truckY.toFixed(1));
  scene.querySelector('#scene-load-line').setAttribute('d', path.loadLine);
  scene.querySelector('#scene-load-text').textContent = `${nId(params.P, 0)} t`;
  updateSceneAssets(scene, params);
}

function updateSceneAssets(scene, params) {
  const palette = {
    steel: ['#9eb5bb', '#506c78'],
    concrete: ['#b6bfbc', '#747f7d'],
    timber: ['#c99c6c', '#8c613e'],
  }[params.material] || ['#9eb5bb', '#506c78'];
  scene.querySelector('#girder-stop-top')?.setAttribute('stop-color', palette[0]);
  scene.querySelector('#girder-stop-bottom')?.setAttribute('stop-color', palette[1]);
  const materialLabel = scene.querySelector('#scene-material-text');
  if (materialLabel) materialLabel.textContent = materialFor(params).label;
  const profileLabel = scene.querySelector('#scene-profile-text');
  if (profileLabel) profileLabel.textContent = profileFor(params).label;
  const profileImage = scene.querySelector('#scene-profile-image');
  if (profileImage) profileImage.setAttribute('href', `assets/${profileFor(params).asset}`);
}

function syncParameter(key, value) {
  const attempt = getAttempt(state.activeMission);
  attempt.params[key] = Number(value);
  saveState();
  const output = document.getElementById(`value-${key}`);
  if (output) output.textContent = `${nId(value, key === 'L' ? 1 : 0)} ${key === 'L' ? 'm' : 'ton'}`;
  const baseline = freshParameters(state.activeMission);
  updateVisuals(attempt.params, baseline, true);
  const slot = document.getElementById('v2-feedback-slot');
  if (slot) slot.innerHTML = '';
}

function syncAsset(key, value) {
  const attempt = getAttempt(state.activeMission);
  attempt.params[key] = value;
  saveState();
  updateVisuals(attempt.params, freshParameters(state.activeMission), true);
  const slot = document.getElementById('v2-feedback-slot');
  if (slot) slot.innerHTML = '';
}

function showExperimentFeedback(message, warm = false) {
  const slot = document.getElementById('v2-feedback-slot');
  if (slot) slot.innerHTML = `<div class="v2-feedback${warm ? ' is-warm' : ''}"><strong>${warm ? 'Periksa target dan kondisi.' : 'Hasil sesuai target.'}</strong>${message}</div>`;
}

function controlsMatchBaseline(index, params, focus) {
  const base = freshParameters(index);
  const editable = focus === 'design' ? ['material', 'profile'] : [focus];
  return ['P', 'L', 'material', 'profile'].filter((key) => !editable.includes(key)).every((key) => params[key] === base[key]);
}

function completeMission(index) {
  const attempt = getAttempt(index);
  if (attempt.phase === 'done') return;
  attempt.reward = 20 + (attempt.predictionCorrect ? 10 : 0) + (attempt.explanationCorrect ? 20 : 0);
  attempt.phase = 'done';
  if (!state.completed.includes(index)) state.completed.push(index);
  state.completed.sort((a, b) => a - b);
  state.xp += attempt.reward;
  saveState();
}

function render() {
  renderSidebar();
  if (currentView === 'map') renderMap();
  else if (currentView === 'flow') renderFlow();
  else renderLab();
}

function openMission(index) {
  if (!canOpen(index)) return;
  state.activeMission = index;
  currentView = 'lab';
  saveState();
  render();
  document.getElementById('screen-container').focus({ preventScroll: true });
}

function openNextMission() {
  const index = nextMission();
  if (index === state.activeMission && state.completed.includes(index)) currentView = 'map';
  else { state.activeMission = index; currentView = 'lab'; }
  saveState();
  render();
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el.hidden = true; }, 2600);
}

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'go-map') { currentView = 'map'; render(); return; }
  if (action === 'go-lab' || action === 'start-current') { state.activeMission = nextMission(); currentView = 'lab'; saveState(); render(); return; }
  if (action === 'go-flow') { currentView = 'flow'; render(); return; }
  if (action === 'open-mission') { openMission(Number(el.dataset.index)); return; }
  if (action === 'reset-values') {
    const attempt = getAttempt(state.activeMission);
    attempt.params = freshParameters(state.activeMission);
    saveState();
    render();
    toast('Pilihan kembali ke kondisi awal misi.');
    return;
  }
  if (action === 'check-prediction') {
    const mission = missions[state.activeMission];
    const attempt = getAttempt(state.activeMission);
    if (!attempt.selectedPrediction) return;
    attempt.predictionCorrect = attempt.selectedPrediction === mission.correctPrediction;
    attempt.phase = 'experiment'; saveState(); render(); return;
  }
  if (action === 'check-experiment') {
    const mission = missions[state.activeMission];
    const attempt = getAttempt(state.activeMission);
    if (!mission.targetCheck(attempt.params)) {
      showExperimentFeedback(state.activeMission === 4 ? 'Pilih kombinasi yang memenuhi anggaran ≤ 110 kredit dan lendutan ≤ 20 mm.' : mission.targetText, true);
      return;
    }
    if (!controlsMatchBaseline(state.activeMission, attempt.params, mission.focus)) {
      showExperimentFeedback('Kembalikan variabel lain ke kondisi awal agar eksperimen ini menguji perubahan yang diminta.', true);
      return;
    }
    attempt.phase = 'explain'; saveState(); render(); return;
  }
  if (action === 'check-explanation') {
    const mission = missions[state.activeMission];
    const attempt = getAttempt(state.activeMission);
    if (!attempt.selectedExplanation) return;
    if (attempt.explanationCorrect === null) {
      attempt.explanationCorrect = attempt.selectedExplanation === mission.correctExplanation;
      saveState(); render(); return;
    }
    completeMission(state.activeMission);
    toast(`Misi selesai · ${getAttempt(state.activeMission).reward} XP ditambahkan.`);
    render(); return;
  }
  if (action === 'next-mission') { openNextMission(); return; }
  if (action === 'check-flow-answer') {
    const flow = state.flow;
    const question = flowQuestions[flow.activeQuestion];
    if (!question || !flow.selectedAnswer) return;
    if (flow.selectedAnswer === question.answer) {
      const firstCompletion = !flow.completedQuestions.includes(flow.activeQuestion);
      if (firstCompletion) {
        flow.completedQuestions.push(flow.activeQuestion);
        flow.completedQuestions.sort((a, b) => a - b);
        state.xp += 15;
      }
      flow.wrongAnswer = false;
      saveState(); render();
      if (firstCompletion) toast('Jawaban tepat · 15 XP ditambahkan.');
    } else {
      flow.wrongAnswer = true;
      saveState(); render();
    }
    return;
  }
  if (action === 'next-flow-question') {
    if (!state.flow.completedQuestions.includes(state.flow.activeQuestion)) return;
    state.flow.activeQuestion += 1;
    state.flow.selectedAnswer = '';
    state.flow.wrongAnswer = false;
    saveState(); render();
    return;
  }
  if (action === 'restart-flow-questions') {
    state.flow.activeQuestion = 0;
    state.flow.selectedAnswer = '';
    state.flow.wrongAnswer = false;
    saveState(); render();
    return;
  }
  if (action === 'reset-progress') {
    state = emptyState(); currentView = 'map'; saveState(); render(); toast('Progres versi 2.5 sudah dimulai ulang.');
  }
});

document.addEventListener('change', (event) => {
  const input = event.target;
  if (input.matches('[data-choice="prediction"]')) {
    const attempt = getAttempt(state.activeMission); attempt.selectedPrediction = input.value; saveState();
    const button = document.querySelector('[data-action="check-prediction"]'); if (button) button.disabled = false;
  }
  if (input.matches('[data-choice="explanation"]')) {
    const attempt = getAttempt(state.activeMission); attempt.selectedExplanation = input.value; attempt.explanationCorrect = null; saveState(); render();
  }
  if (input.matches('[data-asset-param]')) syncAsset(input.dataset.assetParam, input.value);
  if (input.matches('[data-flow-choice]')) {
    state.flow.selectedAnswer = input.value;
    state.flow.wrongAnswer = false;
    saveState();
    const button = document.querySelector('[data-action="check-flow-answer"]');
    if (button) button.disabled = false;
  }
  if (input.matches('[data-flow-roughness]')) {
    state.flow.roughness = Number(input.value);
    saveState();
    updateFlowVisuals(state.flow);
  }
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (input.matches('[data-param]')) syncParameter(input.dataset.param, input.value);
  if (input.matches('[data-flow-param]')) {
    state.flow[input.dataset.flowParam] = Number(input.value);
    saveState();
    updateFlowVisuals(state.flow);
  }
});

render();
