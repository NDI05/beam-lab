const STORE_KEY = 'beamlab-progress-v1';

const parameterInfo = {
  q: { label: 'Beban merata', symbol: 'q', unit: 'kN/m', min: 4, max: 40, step: 0.5, precision: 1 },
  L: { label: 'Panjang bentang', symbol: 'L', unit: 'm', min: 3, max: 14, step: 0.1, precision: 1 },
  E: { label: 'Modulus elastisitas', symbol: 'E', unit: 'GPa', min: 70, max: 210, step: 5, precision: 0 },
  I: { label: 'Momen inersia', symbol: 'I', unit: 'cm⁴', min: 40000, max: 240000, step: 1000, precision: 0 },
};

const baseParameters = { q: 12, L: 8, E: 200, I: 80000 };

const missions = [
  {
    title: 'Beban dua kali lipat',
    short: 'Beban merata',
    concept: 'Pengaruh beban q',
    description: 'Amati bagaimana besar beban mengubah lendutan.',
    context: 'Sebuah balok menerima beban merata. Kita tahan semua kondisi lain tetap, lalu mengubah besar bebannya.',
    predictionPrompt: 'Jika beban merata menjadi dua kali lipat, bagaimana lendutan maksimum berubah?',
    options: [
      { id: 'double', label: 'Ikut menjadi dua kali lipat' },
      { id: 'same', label: 'Tetap sama karena bentangnya tidak berubah' },
      { id: 'half', label: 'Menjadi setengahnya' },
    ],
    correctPrediction: 'double',
    focus: 'q',
    targetValue: 24,
    targetText: 'Naikkan q dari 12 menjadi 24 kN/m.',
    experimentHint: 'Atur q ke 24 kN/m. Biarkan bentang, material, dan penampang pada nilai awal.',
    targetCheck: (params) => Math.abs(params.q - 24) <= 0.26,
    explainPrompt: 'Mengapa lendutan maksimum berubah seperti itu?',
    explainOptions: [
      { id: 'linear-q', label: 'Lendutan berbanding lurus dengan beban q.' },
      { id: 'inverse-q', label: 'Lendutan berbanding terbalik dengan beban q.' },
      { id: 'span-only', label: 'Beban tidak memengaruhi lendutan; hanya panjang bentang yang berpengaruh.' },
    ],
    correctExplanation: 'linear-q',
    insight: 'Pada kondisi lain yang sama, menggandakan q juga menggandakan δmaks.',
  },
  {
    title: 'Bentang 20% lebih panjang',
    short: 'Panjang bentang',
    concept: 'Pengaruh panjang L',
    description: 'Temukan mengapa perubahan bentang terasa besar.',
    context: 'Beban, material, dan penampang dipertahankan. Bentang bertambah 20% untuk memperlihatkan pengaruh L.',
    predictionPrompt: 'Jika L bertambah 20%, kira-kira berapa kali lendutan maksimumnya?',
    options: [
      { id: 'plus20', label: 'Naik sekitar 20%, menjadi 1,2 kali' },
      { id: 'two', label: 'Menjadi sekitar 2,07 kali' },
      { id: 'same', label: 'Tetap sama karena beban tidak berubah' },
    ],
    correctPrediction: 'two',
    focus: 'L',
    targetValue: 9.6,
    targetText: 'Naikkan L dari 8,0 menjadi 9,6 m.',
    experimentHint: 'Atur L ke 9,6 m. Nilai lain tetap pada kondisi awal.',
    targetCheck: (params) => Math.abs(params.L - 9.6) <= 0.051,
    explainPrompt: 'Apa yang membuat kenaikan 20% pada L memberi dampak lebih besar?',
    explainOptions: [
      { id: 'fourth', label: 'L muncul berpangkat empat pada hubungan lendutan maksimum.' },
      { id: 'linear', label: 'L hanya muncul secara linier pada rumus.' },
      { id: 'no-l', label: 'Panjang bentang tidak muncul pada rumus lendutan.' },
    ],
    correctExplanation: 'fourth',
    insight: 'Karena δmaks sebanding dengan L⁴, bentang 1,2 kali memberi lendutan sekitar 1,2⁴ = 2,07 kali.',
  },
  {
    title: 'Material lebih lentur',
    short: 'Material',
    concept: 'Pengaruh modulus E',
    description: 'Bandingkan kekakuan material melalui modulus elastisitas.',
    context: 'Modulus elastisitas diturunkan menjadi setengah. Kita ingin melihat apa yang terjadi saat material lebih mudah berubah bentuk.',
    predictionPrompt: 'Jika E turun dari 200 menjadi 100 GPa, bagaimana lendutan maksimum berubah?',
    options: [
      { id: 'double', label: 'Menjadi dua kali lipat' },
      { id: 'half', label: 'Menjadi setengahnya' },
      { id: 'same', label: 'Tetap sama' },
    ],
    correctPrediction: 'double',
    focus: 'E',
    targetValue: 100,
    targetText: 'Turunkan E dari 200 menjadi 100 GPa.',
    experimentHint: 'Atur E ke 100 GPa. Pertahankan q, L, dan I pada nilai awal.',
    targetCheck: (params) => Math.abs(params.E - 100) <= 2.6,
    explainPrompt: 'Bagaimana E terhubung dengan kekakuan dan lendutan?',
    explainOptions: [
      { id: 'inverse-e', label: 'Lendutan berbanding terbalik dengan E; material lebih kaku melendut lebih kecil.' },
      { id: 'linear-e', label: 'Lendutan bertambah saat E bertambah.' },
      { id: 'no-e', label: 'E tidak memengaruhi lendutan.' },
    ],
    correctExplanation: 'inverse-e',
    insight: 'E berada di penyebut rumus: jika E dibagi dua, δmaks menjadi dua kali lipat.',
  },
  {
    title: 'Penampang lebih kaku',
    short: 'Penampang',
    concept: 'Pengaruh momen inersia I',
    description: 'Lihat peran bentuk penampang terhadap kekakuan lentur.',
    context: 'Untuk balok dan material yang sama, momen inersia penampang dibuat dua kali lebih besar.',
    predictionPrompt: 'Jika I menjadi dua kali lipat, apa yang terjadi pada lendutan maksimum?',
    options: [
      { id: 'half', label: 'Turun menjadi setengahnya' },
      { id: 'double', label: 'Naik menjadi dua kali lipat' },
      { id: 'same', label: 'Tetap sama' },
    ],
    correctPrediction: 'half',
    focus: 'I',
    targetValue: 160000,
    targetText: 'Naikkan I dari 80.000 menjadi 160.000 cm⁴.',
    experimentHint: 'Atur I ke 160.000 cm⁴. Pertahankan parameter lainnya.',
    targetCheck: (params) => Math.abs(params.I - 160000) <= 1000,
    explainPrompt: 'Mengapa penampang dengan I lebih besar mengurangi lendutan?',
    explainOptions: [
      { id: 'inverse-i', label: 'I ada di penyebut; nilai I yang lebih besar memberi kekakuan lentur lebih tinggi.' },
      { id: 'linear-i', label: 'Lendutan naik sebanding dengan I.' },
      { id: 'area-only', label: 'Lendutan hanya bergantung pada luas penampang, bukan I.' },
    ],
    correctExplanation: 'inverse-i',
    insight: 'Momen inersia yang dua kali lebih besar membagi δmaks menjadi dua, jika kondisi lain sama.',
  },
  {
    title: 'Jaga lendutan',
    short: 'Misi gabungan',
    concept: 'Terapkan konsep',
    description: 'Pilih penampang yang memenuhi target misi.',
    context: 'Bentang dan beban lebih besar menghasilkan lendutan awal sekitar 16,6 mm. Kali ini hanya penampang yang boleh diubah.',
    predictionPrompt: 'Jika I dibuat dua kali lebih besar, apa yang kamu perkirakan terjadi?',
    options: [
      { id: 'half', label: 'Lendutan turun menjadi kira-kira setengahnya' },
      { id: 'double', label: 'Lendutan naik menjadi dua kali lipat' },
      { id: 'same', label: 'Lendutan tidak berubah' },
    ],
    correctPrediction: 'half',
    focus: 'I',
    targetText: 'Ubah I sampai lendutan maksimum 8,5 mm atau kurang.',
    experimentHint: 'Sesuaikan I saja. Target misi: δmaks ≤ 8,5 mm.',
    targetCheck: (params) => calculateMaximumDeflection(params) <= 8.5,
    explainPrompt: 'Apa alasan perubahan penampang dapat memenuhi target?',
    explainOptions: [
      { id: 'inverse-i', label: 'Menaikkan I menambah kekakuan lentur dan menurunkan lendutan.' },
      { id: 'load', label: 'I yang lebih besar mengurangi beban merata q.' },
      { id: 'span', label: 'I yang lebih besar memperpendek panjang bentang L.' },
    ],
    correctExplanation: 'inverse-i',
    insight: 'Pada kondisi misi ini, I sekitar dua kali nilai awal sudah membawa lendutan ke bawah target.',
    start: { q: 24, L: 9.6, E: 200, I: 80000 },
  },
];

function initialState() {
  return { xp: 0, completed: [], activeMission: 0, records: {} };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY));
    if (stored && Array.isArray(stored.completed) && stored.records) {
      return { ...initialState(), ...stored };
    }
  } catch (error) {
    // Browser storage may be unavailable for a locally opened file.
  }
  return initialState();
}

let state = loadState();
let currentView = 'map';
let toastTimer;

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (error) {
    // The prototype remains usable when storage is disabled.
  }
}

function startingParameters(index) {
  return { ...(missions[index].start || baseParameters) };
}

function getAttempt(index) {
  if (!state.records[index]) {
    state.records[index] = {
      phase: 'predict',
      params: startingParameters(index),
      selectedPrediction: '',
      selectedExplanation: '',
      predictionCorrect: null,
      explanationCorrect: null,
      reward: 0,
    };
  }
  return state.records[index];
}

function nextIncompleteMission() {
  const next = missions.findIndex((_, index) => !state.completed.includes(index));
  return next === -1 ? missions.length - 1 : next;
}

function canOpenMission(index) {
  return index === 0 || state.completed.includes(index - 1);
}

function numberId(value, digits = 1) {
  return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

function formatParameter(key, value) {
  const meta = parameterInfo[key];
  return `${numberId(value, meta.precision)} ${meta.unit}`;
}

function calculateDeflectionAt(x, params) {
  const q = params.q * 1000;
  const L = params.L;
  const E = params.E * 1e9;
  const I = params.I * 1e-8;
  const deflectionM = (q * x / (24 * E * I)) * (Math.pow(L, 3) - 2 * L * Math.pow(x, 2) + Math.pow(x, 3));
  return Math.max(0, deflectionM * 1000);
}

function calculateMaximumDeflection(params) {
  return 5 * (params.q * 1000) * Math.pow(params.L, 4) / (384 * (params.E * 1e9) * (params.I * 1e-8)) * 1000;
}

function renderSidebar() {
  const completeCount = state.completed.length;
  const percent = Math.round((completeCount / missions.length) * 100);
  document.getElementById('journey-fill').style.width = `${percent}%`;
  document.getElementById('journey-count').textContent = `${completeCount} dari ${missions.length} misi`;
  document.getElementById('journey-percent').textContent = `${percent}%`;
  document.getElementById('xp-total').textContent = numberId(state.xp, 0);
  document.getElementById('level-name').textContent = completeCount >= missions.length ? 'Analis struktur' : completeCount >= 3 ? 'Penjelajah' : completeCount >= 1 ? 'Eksperimenter' : 'Pengamat';

  const active = currentView === 'lab' ? state.activeMission : nextIncompleteMission();
  document.getElementById('side-missions').innerHTML = missions.map((mission, index) => {
    const complete = state.completed.includes(index);
    const locked = !canOpenMission(index);
    const current = index === active && !complete;
    return `<button class="side-mission${current ? ' is-current' : ''}${complete ? ' is-complete' : ''}" type="button" data-action="open-mission" data-index="${index}" ${locked ? 'disabled aria-disabled="true"' : ''} aria-label="${complete ? 'Buka kembali' : locked ? 'Terkunci' : 'Buka'} misi ${index + 1}: ${mission.title}">
      <span class="side-mission-index">${complete ? '✓' : String(index + 1).padStart(2, '0')}</span><span class="side-mission-text">${mission.short}</span>
    </button>`;
  }).join('');

  document.getElementById('nav-map').classList.toggle('is-active', currentView === 'map');
  document.getElementById('nav-map').toggleAttribute('aria-current', currentView === 'map');
  document.getElementById('nav-lab').classList.toggle('is-active', currentView === 'lab');
  document.getElementById('nav-lab').toggleAttribute('aria-current', currentView === 'lab');
  document.getElementById('breadcrumb-current').textContent = currentView === 'map' ? 'Peta misi' : 'Meja eksperimen';
}

function renderMap() {
  const activeIndex = nextIncompleteMission();
  const allComplete = state.completed.length === missions.length;
  const activeMission = missions[activeIndex];
  const ctaText = allComplete ? 'Jelajahi lagi' : state.completed.length ? 'Lanjutkan belajar' : 'Mulai misi pertama';
  const mapRows = missions.map((mission, index) => {
    const complete = state.completed.includes(index);
    const locked = !canOpenMission(index);
    const current = index === activeIndex && !complete;
    const status = complete ? 'Selesai' : current ? 'Tersedia sekarang' : 'Terkunci';
    return `<button class="path-row${current ? ' is-current' : ''}${complete ? ' is-complete' : ''}" type="button" data-action="open-mission" data-index="${index}" ${locked ? 'disabled aria-disabled="true"' : ''}>
      <span class="path-node">${complete ? '✓' : String(index + 1).padStart(2, '0')}</span>
      <span><span class="path-title">${mission.title}</span><span class="path-desc">${mission.description}</span></span>
      <span class="path-status">${status}</span>
    </button>`;
  }).join('');

  document.getElementById('screen-container').innerHTML = `
    <section class="map-screen" aria-labelledby="map-title">
      <div class="map-hero">
        <div class="map-copy">
          <div class="eyebrow"><span class="eyebrow-mark"></span>Simulasi struktur · jalur belajar 01</div>
          <h1 id="map-title">Satu perubahan. Satu perilaku baru.</h1>
          <p>Uji bagaimana beban, bentang, material, dan penampang mengubah lendutan. Mulai dengan prediksi, lalu lihat apa yang benar-benar terjadi pada balok.</p>
          <div class="map-cta-row">
            <button class="primary-button" type="button" data-action="start-current">${ctaText}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>
            <span class="map-cta-note">${allComplete ? 'Semua konsep sudah kamu selesaikan.' : `Misi ${String(activeIndex + 1).padStart(2, '0')} · ${activeMission.short}`}</span>
          </div>
        </div>
        <div class="hero-drawing" aria-label="Ilustrasi balok dengan beban merata dan kurva lendutan">
          <svg viewBox="0 0 480 250" role="img" aria-labelledby="hero-drawing-title hero-drawing-desc">
            <title id="hero-drawing-title">Balok sederhana dengan beban merata</title>
            <desc id="hero-drawing-desc">Beban mengarah ke bawah dan garis teal menunjukkan bentuk lendutan yang membesar di tengah bentang.</desc>
            <defs><marker id="arrow-head" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" fill="#dd7445"/></marker></defs>
            <path d="M68 73H416" stroke="#71888d" stroke-width="1" stroke-dasharray="4 5"/>
            <path d="M80 77v32m55-32v32m55-32v32m55-32v32m55-32v32m55-32v32m55-32v32" stroke="#dd7445" stroke-width="1.5" marker-end="url(#arrow-head)"/>
            <path d="M57 112H427" stroke="#142b36" stroke-width="4"/>
            <path d="m67 116-12 18h24l-12-18Zm350 0-12 18h24l-12-18Z" fill="#dce6e5" stroke="#142b36" stroke-width="1.4"/>
            <path d="M67 119C130 119 166 190 242 190s112-71 175-71" fill="none" stroke="#177d85" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M68 211H417m-349-5v10m349-10v10" fill="none" stroke="#82979b" stroke-width="1"/>
            <path d="M75 208h335" stroke="#82979b" stroke-width="1" marker-start="url(#arrow-head)" marker-end="url(#arrow-head)" opacity=".65"/>
            <text x="242" y="229" fill="#71878c" font-size="10" text-anchor="middle">L · panjang bentang</text>
            <text x="244" y="179" fill="#177d85" font-size="10" text-anchor="middle">δmaks</text>
            <text x="241" y="54" fill="#b4643e" font-size="10" text-anchor="middle">q · beban merata</text>
          </svg>
          <div class="drawing-note"><span></span>SKEMA BALOK SEDERHANA</div>
        </div>
      </div>

      <div class="map-summary" aria-label="Ringkasan progres">
        <div class="summary-item"><span class="summary-value">${state.completed.length}/${missions.length}</span><span class="summary-label">misi selesai</span></div>
        <div class="summary-item"><span class="summary-value">${numberId(state.xp, 0)}</span><span class="summary-label">poin pengalaman</span></div>
        <div class="summary-item"><span class="summary-value">${state.completed.length}</span><span class="summary-label">konsep dikuasai</span></div>
      </div>

      <section class="path-section" aria-labelledby="path-title">
        <div class="section-intro"><div class="eyebrow"><span class="eyebrow-mark"></span>Urutan belajar</div><h2 id="path-title">Jalur misi</h2><p>Setiap misi menambahkan satu cara membaca perilaku balok. Selesaikan secara berurutan agar konsepnya saling terhubung.</p></div>
        <div class="mission-path">${mapRows}</div>
      </section>
    </section>`;
}

function renderStepper(phase) {
  const items = [
    { id: 'predict', label: 'Prediksi' },
    { id: 'experiment', label: 'Uji di lab' },
    { id: 'explain', label: 'Jelaskan' },
  ];
  const current = phase === 'done' ? 'explain' : phase;
  const currentIndex = items.findIndex((item) => item.id === current);
  return items.map((item, index) => `<div class="step-item${index === currentIndex ? ' is-active' : ''}${index < currentIndex || phase === 'done' ? ' is-done' : ''}"><span class="step-count">${index < currentIndex || phase === 'done' ? '✓' : index + 1}</span><span>${item.label}</span></div>`).join('');
}

function renderChoices(options, groupName, selectedId) {
  return options.map((option) => `<label class="choice-option"><input type="radio" name="${groupName}" value="${option.id}" data-choice="${groupName}" ${selectedId === option.id ? 'checked' : ''}><span>${option.label}</span></label>`).join('');
}

function renderControl(key, value, disabled = false) {
  const meta = parameterInfo[key];
  const labelId = `param-${key}`;
  return `<div class="control-field">
    <div class="control-head"><label class="control-label" for="${labelId}">${meta.label}<small>${meta.symbol} · ${meta.unit}</small></label><output class="control-value" id="value-${key}">${numberId(value, meta.precision)}</output></div>
    <input id="${labelId}" type="range" min="${meta.min}" max="${meta.max}" step="${meta.step}" value="${value}" data-param="${key}" aria-label="${meta.label}, ${meta.symbol}, ${meta.unit}" ${disabled ? 'disabled' : ''}>
    <div class="range-ends"><span>${numberId(meta.min, meta.precision)}</span><span>${numberId(meta.max, meta.precision)}</span></div>
  </div>`;
}

function renderPredictionPanel(mission, attempt, index) {
  return `<section class="mission-panel" aria-label="Prediksi misi">
    <div class="panel-topline"><span class="concept-tag">${mission.concept}</span><span class="mission-count">${String(index + 1).padStart(2, '0')} / ${String(missions.length).padStart(2, '0')}</span></div>
    <p class="mission-context">${mission.context}</p>
    <h2 class="task-title">Buat prediksi</h2>
    <p class="task-prompt">${mission.predictionPrompt}</p>
    <div class="choice-list">${renderChoices(mission.options, 'prediction', attempt.selectedPrediction)}</div>
    <div class="panel-actions"><button class="primary-button" type="button" data-action="check-prediction" ${attempt.selectedPrediction ? '' : 'disabled'}>Kunci prediksi<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></button></div>
    <p class="panel-hint">Tebakan tidak mengurangi poin. Yang penting, kamu menguji dan menjelaskan hasilnya.</p>
  </section>`;
}

function renderExperimentPanel(mission, attempt, index) {
  const focusMeta = parameterInfo[mission.focus];
  const otherKeys = Object.keys(parameterInfo).filter((key) => key !== mission.focus);
  const predictionFeedback = attempt.predictionCorrect
    ? `<div class="feedback-box"><strong>Prediksimu tepat.</strong>Uji perubahan di grafik untuk melihat besar pengaruhnya.</div>`
    : `<div class="feedback-box is-warm"><strong>Saatnya menguji.</strong>Prediksi ini belum tepat, tetapi eksperimen berikutnya akan memperlihatkan hubungan yang sebenarnya.</div>`;
  return `<section class="mission-panel" aria-label="Eksperimen misi">
    <div class="panel-topline"><span class="concept-tag">${mission.concept}</span><span class="mission-count">${String(index + 1).padStart(2, '0')} / ${String(missions.length).padStart(2, '0')}</span></div>
    ${predictionFeedback}
    <h2 class="task-title experiment-title">Uji di meja eksperimen</h2>
    <p class="task-prompt">${mission.experimentHint}</p>
    <div class="experiment-target"><span class="target-glyph" aria-hidden="true">↗</span><span>${mission.targetText}</span></div>
    ${renderControl(mission.focus, attempt.params[mission.focus])}
    <details class="other-controls"><summary>Lihat parameter lain</summary><p class="other-controls-note">Untuk eksperimen yang adil, kembalikan nilai lain ke kondisi awal sebelum memeriksa hasil.</p>${otherKeys.map((key) => renderControl(key, attempt.params[key])).join('')}</details>
    <div class="live-status"><span>Lendutan maksimum saat ini</span><strong id="live-deflection">${numberId(calculateMaximumDeflection(attempt.params), 2)} mm</strong></div>
    <div class="panel-actions"><button class="primary-button" type="button" data-action="check-experiment">Bandingkan eksperimen<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg></button></div>
    <div class="feedback-slot" id="experiment-feedback" aria-live="polite"></div>
    <p class="panel-hint">Kurva teal berubah langsung saat parameter diubah. Garis putus-putus menunjukkan kondisi awal.</p>
  </section>`;
}

function renderExplanationPanel(mission, attempt, index) {
  const answerFeedback = attempt.explanationCorrect === null ? '' : attempt.explanationCorrect
    ? `<div class="feedback-box"><strong>Penjelasanmu tepat.</strong>${mission.insight}</div>`
    : `<div class="feedback-box is-warm"><strong>Hasil eksperimen memberi petunjuk.</strong>${mission.insight}</div>`;
  return `<section class="mission-panel" aria-label="Refleksi misi">
    <div class="panel-topline"><span class="concept-tag">${mission.concept}</span><span class="mission-count">${String(index + 1).padStart(2, '0')} / ${String(missions.length).padStart(2, '0')}</span></div>
    <p class="mission-context">Eksperimen berhasil. Sekarang hubungkan perubahan pada parameter dengan bentuk kurva.</p>
    <h2 class="task-title">Jelaskan hasilnya</h2>
    <p class="task-prompt">${mission.explainPrompt}</p>
    <div class="choice-list">${renderChoices(mission.explainOptions, 'explanation', attempt.selectedExplanation)}</div>
    ${answerFeedback}
    <div class="panel-actions"><button class="primary-button" type="button" data-action="check-explanation" ${attempt.selectedExplanation ? '' : 'disabled'}>${attempt.explanationCorrect === null ? 'Periksa pemahaman' : 'Selesaikan misi'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></button></div>
    <p class="panel-hint">Pilih hubungan yang sesuai dengan grafik dan persamaan lendutan.</p>
  </section>`;
}

function renderCompletionPanel(mission, attempt, index) {
  const nextIndex = index + 1;
  const hasNext = nextIndex < missions.length;
  return `<section class="mission-panel completion-panel" aria-label="Misi selesai">
    <div class="completion-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></div>
    <div class="panel-topline"><span class="concept-tag">Konsep dikuasai</span><span class="mission-count">${String(index + 1).padStart(2, '0')} / ${String(missions.length).padStart(2, '0')}</span></div>
    <h2>Misi selesai.</h2>
    <p>Kamu sudah membuat prediksi, menguji parameter, dan membaca respons balok.</p>
    <div class="reward-line"><span aria-hidden="true">✳</span><strong>+${attempt.reward} XP</strong><span>ditambahkan ke progresmu</span></div>
    <div class="insight-card"><strong>Simpan insight ini</strong>${mission.insight}</div>
    <div class="panel-actions"><button class="primary-button" type="button" data-action="${hasNext ? 'next-mission' : 'go-map'}">${hasNext ? 'Buka misi berikutnya' : 'Kembali ke peta'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></div>
  </section>`;
}

function renderMissionPanel(mission, attempt, index) {
  if (attempt.phase === 'predict') return renderPredictionPanel(mission, attempt, index);
  if (attempt.phase === 'experiment') return renderExperimentPanel(mission, attempt, index);
  if (attempt.phase === 'explain') return renderExplanationPanel(mission, attempt, index);
  return renderCompletionPanel(mission, attempt, index);
}

function renderLab() {
  const index = state.activeMission;
  const mission = missions[index];
  const attempt = getAttempt(index);
  document.getElementById('screen-container').innerHTML = `
    <section class="lab-screen" aria-labelledby="lab-title">
      <div class="lab-heading">
        <div class="lab-title-group"><div class="eyebrow"><span class="eyebrow-mark"></span>Misi ${String(index + 1).padStart(2, '0')} · ${mission.concept}</div><h1 id="lab-title">${mission.title}</h1><p class="lab-subtitle">${mission.description} Amati kurvanya, bukan hanya angkanya.</p></div>
        <div class="lab-heading-tools"><button class="secondary-button" type="button" data-action="go-map"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>Peta misi</button></div>
      </div>
      <div class="lab-stepper" aria-label="Tahapan misi">${renderStepper(attempt.phase)}</div>
      <div class="lab-layout">
        ${renderMissionPanel(mission, attempt, index)}
        <section class="simulation-panel" aria-labelledby="simulation-title">
          <div class="simulation-head"><div><h2 id="simulation-title">Respons balok</h2><p>Posisi sepanjang bentang dan lendutan vertikal</p></div><div class="simulation-head-actions"><div class="plot-annotation">SKALA OTOMATIS<br>δ POSITIF KE BAWAH</div>${attempt.phase !== 'done' ? '<button class="chart-reset" type="button" data-action="reset-values">Pulihkan nilai awal</button>' : ''}</div></div>
          <div class="chart-wrap"><svg id="deflection-chart" viewBox="0 0 720 360" role="img" aria-labelledby="chart-title chart-description"></svg></div>
          <div class="chart-legend"><span class="legend-item"><span class="legend-stroke before"></span>Kondisi awal</span><span class="legend-item"><span class="legend-stroke"></span>Eksperimen</span></div>
          <div class="result-strip"><div><div class="result-label">Lendutan maksimum, δmaks</div><div class="result-value" id="result-maximum">—<small>mm</small></div></div><div class="result-location" id="result-location">Terjadi di tengah bentang</div></div>
          <div class="formula-row"><code>δ(x) = qx( L³ − 2Lx² + x³ ) / 24EI</code><span>balok sederhana · beban merata</span></div>
        </section>
      </div>
      <p class="lab-footer-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v4m0 4h.01M10 3.8 2.9 17a2 2 0 0 0 1.8 3h14.6a2 2 0 0 0 1.8-3L14 3.8a2.3 2.3 0 0 0-4 0Z"/></svg>Model pembelajaran: balok sederhana, beban merata, material elastis linier, dan lendutan kecil. Nilai ini bukan rekomendasi desain struktur.</p>
    </section>`;
  drawChart(attempt.params, startingParameters(index));
}

function makeCurve(params, xScaleMax, chart) {
  const steps = 80;
  const points = [];
  for (let step = 0; step <= steps; step += 1) {
    const fraction = step / steps;
    const x = params.L * fraction;
    const deflection = calculateDeflectionAt(x, params);
    const px = chart.x0 + (x / xScaleMax) * chart.width;
    const py = chart.y0 + (deflection / chart.range) * chart.height;
    points.push(`${step === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(' ');
}

function drawChart(current, baseline) {
  const svg = document.getElementById('deflection-chart');
  if (!svg) return;
  const chart = { x0: 82, y0: 34, width: 600, height: 252 };
  const xScaleMax = Math.max(current.L, baseline.L);
  const currentMax = calculateMaximumDeflection(current);
  const baselineMax = calculateMaximumDeflection(baseline);
  chart.range = Math.max(0.2, Math.max(currentMax, baselineMax) * 1.23);
  const xAxisY = chart.y0 + chart.height;
  const horizontalLines = Array.from({ length: 6 }, (_, index) => {
    const y = chart.y0 + (chart.height * index) / 5;
    const value = (chart.range * index) / 5;
    return `<line x1="${chart.x0}" y1="${y}" x2="${chart.x0 + chart.width}" y2="${y}" stroke="#d4dfdf" stroke-width="1"/><text x="${chart.x0 - 12}" y="${y + 3}" fill="#768b90" font-size="9" text-anchor="end">${numberId(value, value < 1 ? 2 : 1)}</text>`;
  }).join('');
  const xTicks = Array.from({ length: 5 }, (_, index) => {
    const fraction = index / 4;
    const x = chart.x0 + chart.width * fraction;
    const label = xScaleMax * fraction;
    return `<line x1="${x}" y1="${chart.y0}" x2="${x}" y2="${xAxisY}" stroke="#d4dfdf" stroke-width="1"/><text x="${x}" y="${xAxisY + 20}" fill="#768b90" font-size="9" text-anchor="middle">${numberId(label, 1)}</text>`;
  }).join('');
  const currentPath = makeCurve(current, xScaleMax, chart);
  const baselinePath = makeCurve(baseline, xScaleMax, chart);
  const peakX = chart.x0 + ((current.L / 2) / xScaleMax) * chart.width;
  const peakY = chart.y0 + (currentMax / chart.range) * chart.height;
  const peakLabelX = Math.min(chart.x0 + chart.width - 8, peakX + 12);
  const peakLabelAnchor = peakLabelX > chart.x0 + chart.width - 85 ? 'end' : 'start';
  const peakLabelXFinal = peakLabelAnchor === 'end' ? peakX - 12 : peakX + 12;

  svg.innerHTML = `<title id="chart-title">Grafik lendutan balok</title><desc id="chart-description">Kurva eksperimen berwarna teal dengan nilai maksimum ${numberId(currentMax, 2)} milimeter, dibandingkan kondisi awal ${numberId(baselineMax, 2)} milimeter. Sumbu horizontal menunjukkan posisi dalam meter. Lendutan positif digambar ke bawah.</desc>
    <text x="18" y="24" fill="#647b81" font-size="9">δ (mm)</text>
    ${horizontalLines}${xTicks}
    <line x1="${chart.x0}" y1="${chart.y0}" x2="${chart.x0}" y2="${xAxisY}" stroke="#8fa1a4" stroke-width="1.2"/><line x1="${chart.x0}" y1="${xAxisY}" x2="${chart.x0 + chart.width}" y2="${xAxisY}" stroke="#8fa1a4" stroke-width="1.2"/>
    <text x="${chart.x0 + chart.width}" y="${xAxisY + 38}" fill="#647b81" font-size="9" text-anchor="end">x (m)</text>
    <path d="${baselinePath}" fill="none" stroke="#89999c" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${currentPath}" fill="none" stroke="#177d85" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="${peakX}" y1="${chart.y0}" x2="${peakX}" y2="${peakY}" stroke="#dd7445" stroke-width="1" stroke-dasharray="3 4" opacity=".85"/>
    <circle cx="${peakX}" cy="${peakY}" r="5" fill="#dd7445" stroke="#f7f9f7" stroke-width="2"/>
    <text x="${peakLabelXFinal}" y="${Math.max(chart.y0 + 13, peakY - 9)}" fill="#a65e39" font-size="9" text-anchor="${peakLabelAnchor}">δmaks</text>`;

  const result = document.getElementById('result-maximum');
  if (result) result.innerHTML = `${numberId(currentMax, 2)}<small>mm</small>`;
  const location = document.getElementById('result-location');
  if (location) location.textContent = `x = ${numberId(current.L / 2, 2)} m · tengah bentang`;
  const live = document.getElementById('live-deflection');
  if (live) live.textContent = `${numberId(currentMax, 2)} mm`;
}

function updateParameter(key, value) {
  const index = state.activeMission;
  const attempt = getAttempt(index);
  attempt.params[key] = Number(value);
  saveState();
  const output = document.getElementById(`value-${key}`);
  if (output) output.textContent = numberId(value, parameterInfo[key].precision);
  const feedback = document.getElementById('experiment-feedback');
  if (feedback) feedback.innerHTML = '';
  drawChart(attempt.params, startingParameters(index));
}

function showExperimentFeedback(message, warm = false) {
  const slot = document.getElementById('experiment-feedback');
  if (!slot) return;
  slot.innerHTML = `<div class="feedback-box${warm ? ' is-warm' : ''}"><strong>${warm ? 'Periksa kondisi eksperimen.' : 'Eksperimen terkonfirmasi.'}</strong>${message}</div>`;
}

function parametersHeld(index, params, focusKey) {
  const initial = startingParameters(index);
  return Object.keys(parameterInfo).every((key) => {
    if (key === focusKey) return true;
    const tolerance = parameterInfo[key].step / 2 + 0.0001;
    return Math.abs(params[key] - initial[key]) <= tolerance;
  });
}

function completeMission(index) {
  const attempt = getAttempt(index);
  if (attempt.phase === 'done') return;
  const predictionBonus = attempt.predictionCorrect ? 10 : 0;
  const explanationBonus = attempt.explanationCorrect ? 20 : 0;
  attempt.reward = 20 + predictionBonus + explanationBonus;
  attempt.phase = 'done';
  if (!state.completed.includes(index)) state.completed.push(index);
  state.completed.sort((a, b) => a - b);
  state.xp += attempt.reward;
  saveState();
}

function openMission(index) {
  if (!canOpenMission(index)) return;
  state.activeMission = index;
  currentView = 'lab';
  saveState();
  render();
  document.getElementById('screen-container').focus({ preventScroll: true });
}

function openNextMission() {
  const nextIndex = nextIncompleteMission();
  if (nextIndex === state.activeMission && state.completed.includes(nextIndex)) {
    currentView = 'map';
  } else {
    state.activeMission = nextIndex;
    currentView = 'lab';
  }
  saveState();
  render();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
}

function render() {
  renderSidebar();
  if (currentView === 'map') renderMap();
  else renderLab();
}

document.addEventListener('click', (event) => {
  const actionElement = event.target.closest('[data-action]');
  if (!actionElement) return;
  const action = actionElement.dataset.action;
  if (action === 'go-map') {
    currentView = 'map';
    render();
    return;
  }
  if (action === 'go-lab' || action === 'start-current') {
    state.activeMission = nextIncompleteMission();
    currentView = 'lab';
    saveState();
    render();
    return;
  }
  if (action === 'open-mission') {
    openMission(Number(actionElement.dataset.index));
    return;
  }
  if (action === 'reset-values') {
    const attempt = getAttempt(state.activeMission);
    attempt.params = startingParameters(state.activeMission);
    saveState();
    render();
    showToast('Parameter kembali ke kondisi awal misi.');
    return;
  }
  if (action === 'check-prediction') {
    const mission = missions[state.activeMission];
    const attempt = getAttempt(state.activeMission);
    if (!attempt.selectedPrediction) return;
    attempt.predictionCorrect = attempt.selectedPrediction === mission.correctPrediction;
    attempt.phase = 'experiment';
    saveState();
    render();
    return;
  }
  if (action === 'check-experiment') {
    const mission = missions[state.activeMission];
    const attempt = getAttempt(state.activeMission);
    const parameterReached = mission.targetCheck(attempt.params);
    const constantsHeld = parametersHeld(state.activeMission, attempt.params, mission.focus);
    if (!parameterReached) {
      showExperimentFeedback(mission.focus === 'I' && state.activeMission === 4 ? 'Terus naikkan I sampai δmaks menyentuh 8,5 mm atau kurang.' : `Atur ${parameterInfo[mission.focus].symbol} ke nilai sasaran yang tertulis di atas.`, true);
      return;
    }
    if (!constantsHeld) {
      showExperimentFeedback('Kembalikan parameter lain ke nilai awal agar perubahan ini menguji satu variabel saja.', true);
      return;
    }
    const attemptState = getAttempt(state.activeMission);
    attemptState.phase = 'explain';
    saveState();
    render();
    return;
  }
  if (action === 'check-explanation') {
    const mission = missions[state.activeMission];
    const attempt = getAttempt(state.activeMission);
    if (!attempt.selectedExplanation) return;
    if (attempt.explanationCorrect === null) {
      attempt.explanationCorrect = attempt.selectedExplanation === mission.correctExplanation;
      saveState();
      render();
      return;
    }
    completeMission(state.activeMission);
    showToast(`Misi selesai · ${getAttempt(state.activeMission).reward} XP ditambahkan.`);
    render();
    return;
  }
  if (action === 'next-mission') {
    openNextMission();
    return;
  }
  if (action === 'reset-progress') {
    state = initialState();
    currentView = 'map';
    saveState();
    render();
    showToast('Progres lokal sudah dimulai ulang.');
  }
});

document.addEventListener('change', (event) => {
  const input = event.target;
  if (input.matches('[data-choice="prediction"]')) {
    const attempt = getAttempt(state.activeMission);
    attempt.selectedPrediction = input.value;
    saveState();
    const button = document.querySelector('[data-action="check-prediction"]');
    if (button) button.disabled = false;
  }
  if (input.matches('[data-choice="explanation"]')) {
    const attempt = getAttempt(state.activeMission);
    attempt.selectedExplanation = input.value;
    attempt.explanationCorrect = null;
    saveState();
    const button = document.querySelector('[data-action="check-explanation"]');
    if (button) {
      button.disabled = false;
      button.textContent = 'Periksa pemahaman';
      button.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>');
    }
    const feedback = document.querySelector('.mission-panel .feedback-box');
    if (feedback) feedback.remove();
  }
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (input.matches('[data-param]')) updateParameter(input.dataset.param, input.value);
});

render();
