/* ============================================================
   MISIÓN KSL-01 · Edición Galáctica — script v10
   ------------------------------------------------------------
   Mejora integral sobre la versión de producción:
   - Recorrido ampliado de 14.000px a 24.000px (10 sectores).
   - Meta de premio: 120 monedas (configurable en CONFIG).
   - Gráficos renovados: parallax de 3 capas, estrellas con
     titileo, estrellas fugaces, planetas con anillos y cráteres,
     monedas giratorias, nave con inclinación y estela, enemigos
     animados, portal orbital, viñeta de daño y banner de sector.
   - Nuevo contenido: plataformas móviles, anillos de impulso,
     gemas KSL (+5), imán de monedas, minas espaciales, lluvias
     de meteoritos en 2 sectores y 7 checkpoints.
   - Sonido sintetizado (WebAudio) con botón de silencio (M).
   - La lógica de negocio se mantiene: premio solo con la meta
     de monedas, enlaces de WhatsApp y productos intactos.
   ============================================================ */

"use strict";

/* ----------------------- CONFIGURACIÓN ---------------------- */
const CONFIG = {
  levelWidth: 24000,
  coinGoal: 120,          // Monedas necesarias para reclamar el premio
  startLives: 5,
  maxLives: 5,
  maxShield: 3,
  checkpointReward: 5,
  gravity: 0.36,
  thrust: -0.66
};

/* ----------------------- REFERENCIAS DOM -------------------- */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const deathScreen = document.getElementById("deathScreen");
const winScreen = document.getElementById("winScreen");

const coinsEl = document.getElementById("coins");
const livesEl = document.getElementById("lives");
const shieldEl = document.getElementById("shield");
const sectorEl = document.getElementById("sector");
const statusEl = document.getElementById("status");
const deathCoinsEl = document.getElementById("deathCoins");
const deathSectorEl = document.getElementById("deathSector");
const deathProgressEl = document.getElementById("deathProgress");
const winCoinsEl = document.getElementById("winCoins");
const winTimeEl = document.getElementById("winTime");
const menuBestEl = document.getElementById("menuBest");
const loginLink = document.getElementById("loginLink");
const pauseBadge = document.getElementById("pauseBadge");
const soundBtn = document.getElementById("soundBtn");

// Cambia esta URL cuando tengas la página real de loggeo.
const paginaDeLoggeo = "https://wa.me/573142347047?text=Hola,%20soy%20ganador%20de%20la%20Misi%C3%B3n%20KSL-01.%20Quiero%20reclamar%20mi%20premio%20de%20KSL%20Arte%20y%20Dise%C3%B1o%20Gr%C3%A1fico%20S.A.S.";
loginLink.href = paginaDeLoggeo;

const logo = new Image();
logo.src = "assets/logo-ksl.png";

/* ----------------------- AUDIO (WebAudio) ------------------- */
let audioCtx = null;
let muted = localStorage.getItem("ksl_muted") === "1";

function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function tone(freqA, freqB, dur, type = "square", vol = 0.16, delay = 0) {
  if (!audioCtx || muted) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqA, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqB), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function sfx(name) {
  if (!audioCtx || muted) return;
  switch (name) {
    case "coin":       tone(880, 1420, 0.09, "square", 0.12); break;
    case "gem":        tone(660, 990, 0.1, "triangle", 0.16); tone(990, 1480, 0.12, "triangle", 0.14, 0.07); break;
    case "box":        tone(523, 523, 0.09, "square", 0.13); tone(659, 659, 0.09, "square", 0.13, 0.08); tone(784, 1046, 0.14, "square", 0.14, 0.16); break;
    case "power":      tone(300, 1200, 0.28, "sawtooth", 0.13); break;
    case "magnet":     tone(200, 900, 0.2, "sine", 0.15); tone(900, 1600, 0.18, "sine", 0.12, 0.12); break;
    case "ring":       tone(240, 1500, 0.3, "sawtooth", 0.11); break;
    case "shieldup":   tone(420, 840, 0.2, "sine", 0.16); break;
    case "shieldhit":  tone(340, 140, 0.22, "triangle", 0.18); break;
    case "hit":        tone(220, 70, 0.3, "sawtooth", 0.2); break;
    case "life":       tone(523, 784, 0.14, "sine", 0.16); tone(784, 1046, 0.18, "sine", 0.15, 0.1); break;
    case "checkpoint": tone(392, 392, 0.1, "sine", 0.15); tone(523, 523, 0.1, "sine", 0.15, 0.09); tone(659, 784, 0.2, "sine", 0.16, 0.18); break;
    case "warn":       tone(500, 380, 0.16, "square", 0.12); break;
    case "win":        [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.22, "square", 0.15, i * 0.14)); break;
    case "lose":       [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.9, 0.26, "sawtooth", 0.14, i * 0.16)); break;
  }
}

function updateSoundBtn() {
  soundBtn.textContent = muted ? "🔇" : "🔊";
  soundBtn.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar");
}

function toggleMute() {
  muted = !muted;
  localStorage.setItem("ksl_muted", muted ? "1" : "0");
  updateSoundBtn();
  if (!muted) { ensureAudio(); sfx("coin"); }
}

soundBtn.addEventListener("click", toggleMute);
updateSoundBtn();

/* ----------------------- ESTADO GLOBAL ---------------------- */
const keys = { left: false, right: false, up: false };

let running = false;
let paused = false;
let won = false;
let cameraX = 0;
let animationId = null;
let coins = 0;
let lives = CONFIG.startLives;
let shield = 0;
let checkpoint = { x: 100, y: 280 };
let lastHit = 0;
let lastPortalWarning = 0;
let missionTime = 0;
let hitFlash = 0;
let magnetTime = 0;
let boostTime = 0;
let bannerText = "";
let bannerTime = 0;
let currentSectorName = "";
let bestCoins = Number(localStorage.getItem("ksl_best_coins") || 0);
menuBestEl.textContent = bestCoins > 0 ? `${bestCoins} 🪙` : "—";

const levelWidth = CONFIG.levelWidth;
const gravity = CONFIG.gravity;
const thrust = CONFIG.thrust;
const maxCoins = CONFIG.coinGoal;
const checkpointReward = CONFIG.checkpointReward;

const ship = {
  x: 100, y: 280, w: 96, h: 54,
  vx: 0, vy: 0,
  maxSpeed: 7.35
};

const portal = { x: 23620, y: 290, w: 150, h: 270 };

let platforms = [];
let boxes = [];
let enemies = [];
let coinsMap = [];
let gems = [];
let powerUps = [];
let boostRings = [];
let checkpoints = [];
let obstacles = [];
let meteors = [];
let particles = [];
let stars = [];
let shootingStars = [];
let popups = [];
let trail = [];
let meteorTimer = 0;

/* --------- SECTORES (10) — cada uno con tinte propio -------- */
const sectors = [
  { name: "Base KSL",           at: 0,     tint: "rgba(13,46,139,.28)" },
  { name: "Nebulosa Azul",      at: 2200,  tint: "rgba(37,99,235,.26)" },
  { name: "Campo de Asteroides",at: 4600,  tint: "rgba(148,163,184,.16)" },
  { name: "Anillos Verdes",     at: 7000,  tint: "rgba(10,143,67,.24)" },
  { name: "Estación Fantasma",  at: 9400,  tint: "rgba(125,211,252,.14)" },
  { name: "Zona Roja",          at: 11800, tint: "rgba(224,24,24,.2)" },
  { name: "Corredor Magnético", at: 14200, tint: "rgba(168,85,247,.18)" },
  { name: "Ruta Dorada",        at: 16600, tint: "rgba(242,193,10,.18)" },
  { name: "Tormenta Iónica",    at: 19000, tint: "rgba(96,165,250,.2)" },
  { name: "Portal Premio",      at: 21400, tint: "rgba(242,193,10,.24)" }
];

// Zonas con lluvia de meteoritos (telegrafiadas por el nombre del sector).
const meteorZones = [
  { min: 11800, max: 14100 }, // Zona Roja
  { min: 19000, max: 21300 }  // Tormenta Iónica
];

/* ----------------------- CONSTRUCCIÓN DE NIVEL -------------- */
function buildLevel() {
  platforms = [];

  // Suelo: segmentos con brechas para mantener el riesgo de caída.
  const ground = [
    [0, 900], [1050, 800], [2000, 900], [3050, 850], [4050, 900], [5100, 800],
    [6050, 900], [7100, 850], [8100, 900], [9150, 800], [10100, 900], [11150, 850],
    [12150, 900], [13200, 800], [14150, 900], [15200, 850], [16200, 900], [17250, 800],
    [18200, 900], [19250, 850], [20250, 900], [21300, 800], [22250, 900], [23200, 800]
  ];
  for (const [x, w] of ground) platforms.push({ x, y: 610, w, h: 90, kind: "ground" });

  // Plataformas medias.
  const mid = [
    [520, 470, 240], [1190, 420, 230], [2050, 468, 260], [3000, 408, 230], [3900, 455, 260],
    [5000, 420, 280], [6040, 460, 260], [6900, 395, 240], [7900, 455, 300], [9100, 420, 250],
    [10280, 465, 270], [11380, 405, 250], [12360, 455, 300], [13340, 420, 270], [14400, 460, 260],
    [15350, 410, 250], [16380, 455, 280], [17400, 400, 250], [18400, 460, 270], [19450, 410, 250],
    [20450, 455, 280], [21500, 405, 250], [22450, 458, 280], [23180, 430, 240]
  ];
  for (const [x, y, w] of mid) platforms.push({ x, y, w, h: 32, kind: "mid" });

  // Plataformas altas (ruta de riesgo/recompensa).
  const high = [
    [1500, 330, 190], [3350, 315, 190], [5400, 330, 200], [7350, 300, 200],
    [9300, 330, 200], [11250, 305, 205], [13100, 325, 210], [15050, 310, 200],
    [17000, 328, 205], [18950, 300, 200], [20900, 322, 205], [22800, 308, 200]
  ];
  for (const [x, y, w] of high) platforms.push({ x, y, w, h: 28, kind: "high" });

  // Plataformas móviles (novedad v10): patrullan en vertical u horizontal.
  const movers = [
    [4650, 500, 170, "y", 55, 0.021, 0],
    [8720, 480, 170, "y", 60, 0.019, 1.4],
    [12920, 500, 170, "x", 80, 0.017, 0.6],
    [15920, 480, 170, "y", 58, 0.02, 2.2],
    [19960, 500, 170, "x", 85, 0.018, 3.1],
    [22150, 470, 170, "y", 55, 0.022, 1.0]
  ];
  for (const [x, y, w, axis, range, speed, phase] of movers) {
    platforms.push({ x, y, w, h: 26, kind: "mover", baseX: x, baseY: y, axis, range, speed, phase, dx: 0, dy: 0 });
  }

  /* ------------------- CAJAS / CONTENEDORES ------------------ */
  boxes = [
    { x: 620,   y: 392, w: 72, h: 72, type: "normal",  hit: false },
    { x: 1248,  y: 342, w: 72, h: 72, type: "special", hit: false },
    { x: 2110,  y: 388, w: 72, h: 72, type: "normal",  hit: false },
    { x: 3048,  y: 332, w: 72, h: 72, type: "special", hit: false },
    { x: 3948,  y: 377, w: 72, h: 72, type: "normal",  hit: false },
    { x: 5050,  y: 342, w: 72, h: 72, type: "special", hit: false },
    { x: 6120,  y: 392, w: 72, h: 72, type: "normal",  hit: false },
    { x: 6960,  y: 325, w: 72, h: 72, type: "shield",  hit: false },
    { x: 8000,  y: 385, w: 72, h: 72, type: "normal",  hit: false },
    { x: 9180,  y: 342, w: 72, h: 72, type: "special", hit: false },
    { x: 10340, y: 397, w: 72, h: 72, type: "normal",  hit: false },
    { x: 11440, y: 335, w: 72, h: 72, type: "shield",  hit: false },
    { x: 12470, y: 385, w: 72, h: 72, type: "normal",  hit: false },
    { x: 13420, y: 352, w: 72, h: 72, type: "special", hit: false },
    { x: 14470, y: 390, w: 72, h: 72, type: "normal",  hit: false },
    { x: 15420, y: 342, w: 72, h: 72, type: "special", hit: false },
    { x: 16450, y: 385, w: 72, h: 72, type: "normal",  hit: false },
    { x: 17470, y: 330, w: 72, h: 72, type: "shield",  hit: false },
    { x: 18470, y: 390, w: 72, h: 72, type: "normal",  hit: false },
    { x: 19520, y: 340, w: 72, h: 72, type: "special", hit: false },
    { x: 20520, y: 385, w: 72, h: 72, type: "normal",  hit: false },
    { x: 21570, y: 335, w: 72, h: 72, type: "special", hit: false },
    { x: 23250, y: 360, w: 72, h: 72, type: "final",   hit: false }
  ];

  /* ------------------------- ENEMIGOS ------------------------ */
  enemies = [];

  // Drones terrestres que patrullan.
  const droneData = [
    [980, 1540, 2.0], [1850, 2460, 2.1], [3700, 4320, 2.2], [4750, 5360, 2.3],
    [5780, 6340, 2.4], [7950, 8500, 2.55], [10020, 10600, 2.65], [12100, 12640, 2.75],
    [13250, 13820, 2.8], [14550, 15080, 2.85], [16600, 17150, 2.9], [18550, 19100, 2.95],
    [20600, 21150, 3.0], [22400, 22950, 3.05]
  ];
  for (const [min, max, vx] of droneData) enemies.push({ x: min + 80, y: 548, w: 58, h: 46, min, max, vx, type: "drone" });

  // Centinelas aéreos con oscilación.
  const sentryData = [
    [2300, 2750, 205, 1.65], [5200, 5750, 190, 1.75], [8050, 8650, 220, 1.85],
    [10750, 11380, 175, 1.95], [13950, 14550, 210, 2.0], [17550, 18150, 185, 2.05],
    [21550, 22150, 200, 2.1]
  ];
  for (const [min, max, y, vx] of sentryData) enemies.push({ x: min + 40, y, w: 54, h: 44, min, max, vx, type: "sentry" });

  // Minas espaciales estáticas (novedad v10): pulsan y castigan rutas descuidadas.
  const mineData = [
    [2620, 505], [4880, 360], [7620, 505], [9880, 350],
    [12680, 500], [15680, 355], [18720, 500], [20780, 355]
  ];
  for (const [x, y] of mineData) enemies.push({ x, y, w: 44, h: 44, min: x, max: x, vx: 0, type: "mine" });

  /* ---------------- OBSTÁCULOS SUPERIORES --------------------- */
  obstacles = [];
  const asteroidData = [
    [2850, 115, 38], [6100, 145, 42], [9300, 110, 40], [12150, 150, 44],
    [15300, 118, 40], [18350, 148, 42], [21100, 112, 40]
  ];
  for (const [x, y, r] of asteroidData) obstacles.push({ x, y, r, type: "asteroid", rot: Math.random() * Math.PI * 2, spin: (Math.random() * 0.02 + 0.006) * (Math.random() > 0.5 ? 1 : -1) });

  /* ----------------------- CHECKPOINTS (7) -------------------- */
  checkpoints = [
    { x: 3200,  y: 506, w: 116, h: 104, active: false, label: "CP-1" },
    { x: 6400,  y: 506, w: 116, h: 104, active: false, label: "CP-2" },
    { x: 9600,  y: 506, w: 116, h: 104, active: false, label: "CP-3" },
    { x: 12800, y: 506, w: 116, h: 104, active: false, label: "CP-4" },
    { x: 16000, y: 506, w: 116, h: 104, active: false, label: "CP-5" },
    { x: 19200, y: 506, w: 116, h: 104, active: false, label: "CP-6" },
    { x: 22000, y: 506, w: 116, h: 104, active: false, label: "CP-7" }
  ];

  /* ------------------------ POWER-UPS ------------------------- */
  powerUps = [
    { x: 1640,  y: 288, r: 22, type: "boost",  taken: false },
    { x: 3490,  y: 274, r: 22, type: "shield", taken: false },
    { x: 4300,  y: 315, r: 22, type: "life",   taken: false },
    { x: 5535,  y: 288, r: 22, type: "boost",  taken: false },
    { x: 7380,  y: 258, r: 22, type: "shield", taken: false },
    { x: 8700,  y: 300, r: 22, type: "life",   taken: false },
    { x: 9460,  y: 288, r: 22, type: "boost",  taken: false },
    { x: 11320, y: 268, r: 22, type: "shield", taken: false },
    { x: 13160, y: 288, r: 22, type: "boost",  taken: false },
    { x: 14650, y: 300, r: 22, type: "magnet", taken: false },
    { x: 15950, y: 325, r: 22, type: "life",   taken: false },
    { x: 17100, y: 290, r: 22, type: "magnet", taken: false },
    { x: 18700, y: 265, r: 22, type: "shield", taken: false },
    { x: 19850, y: 300, r: 22, type: "boost",  taken: false },
    { x: 21050, y: 285, r: 22, type: "magnet", taken: false },
    { x: 21900, y: 320, r: 22, type: "life",   taken: false },
    { x: 22900, y: 270, r: 22, type: "shield", taken: false },
    { x: 23350, y: 290, r: 22, type: "boost",  taken: false }
  ];

  /* -------------------- ANILLOS DE IMPULSO -------------------- */
  boostRings = [
    { x: 1000,  y: 420, cool: 0 },
    { x: 4980,  y: 400, cool: 0 },
    { x: 9020,  y: 410, cool: 0 },
    { x: 13070, y: 400, cool: 0 },
    { x: 17140, y: 410, cool: 0 },
    { x: 21180, y: 400, cool: 0 }
  ];

  /* ------------------------ GEMAS KSL (+5) --------------------- */
  gems = [
    { x: 1580,  y: 190, taken: false },
    { x: 4420,  y: 175, taken: false },
    { x: 7440,  y: 185, taken: false },
    { x: 10480, y: 170, taken: false },
    { x: 13540, y: 185, taken: false },
    { x: 16560, y: 172, taken: false },
    { x: 19620, y: 185, taken: false },
    { x: 22650, y: 175, taken: false }
  ];

  /* ------------------------- MONEDAS --------------------------- */
  coinsMap = [];
  const lines = [
    [360, 505, 5, 85, 18],   [1160, 350, 5, 78, 22],  [1960, 520, 6, 82, -20],
    [2920, 350, 5, 82, 22],  [3820, 505, 6, 84, -18], [4920, 350, 6, 80, 20],
    [5900, 500, 5, 86, -20], [6840, 325, 5, 82, 18],  [7840, 500, 6, 86, -18],
    [9040, 350, 6, 82, 20],  [10180, 505, 5, 86, -20],[11300, 330, 5, 82, 18],
    [12250, 505, 6, 86, -18],[13200, 350, 5, 82, 20], [14250, 505, 6, 84, -18],
    [15250, 345, 5, 82, 20], [16250, 505, 6, 86, -20],[17250, 335, 5, 82, 18],
    [18280, 505, 6, 84, -18],[19320, 345, 5, 82, 20], [20330, 505, 6, 86, -20],
    [21380, 340, 5, 82, 18], [22330, 505, 6, 84, -18],[23100, 350, 5, 80, 20]
  ];
  for (const [x, y, n, sp, amp] of lines) addCoinLine(x, y, n, sp, amp);

  // Rutas superiores de recompensa (más monedas, más riesgo).
  [2500, 5700, 8900, 11850, 14900, 17900, 20800, 23000].forEach((base, idx) => {
    addCoinLine(base, idx % 2 ? 150 : 195, 3, 96, 16);
  });

  meteors = [];
  meteorTimer = 0;
}

function addCoinLine(startX, baseY, count, spacing, amp = 0) {
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing;
    const y = baseY + Math.sin(i / Math.max(1, count - 1) * Math.PI) * amp;
    if (!coinsMap.some(c => Math.abs(c.x - x) < 48 && Math.abs(c.y - y) < 48)) {
      coinsMap.push({ x, y, taken: false, spin: Math.random() * Math.PI * 2 });
    }
  }
}

/* ------------------- ESTRELLAS (3 profundidades) ------------- */
function initStars() {
  stars = [];
  for (let i = 0; i < 240; i++) {
    const depth = Math.random();
    stars.push({
      x: Math.random() * levelWidth,
      y: Math.random() * canvas.height,
      r: 0.4 + depth * 1.7,
      depth: 0.12 + depth * 0.45,        // qué tan rápido se mueve con la cámara
      tw: Math.random() * Math.PI * 2,   // fase de titileo
      twSpeed: 0.02 + Math.random() * 0.05,
      alpha: 0.3 + Math.random() * 0.6
    });
  }
  shootingStars = [];
}

/* ----------------------- REINICIO ---------------------------- */
function resetGame() {
  ensureAudio();

  running = true;
  paused = false;
  won = false;
  coins = 0;
  lives = CONFIG.startLives;
  shield = 0;
  cameraX = 0;
  missionTime = 0;
  hitFlash = 0;
  magnetTime = 0;
  boostTime = 0;
  bannerText = "";
  bannerTime = 0;
  currentSectorName = "";
  checkpoint = { x: 100, y: 280 };
  lastHit = 0;
  lastPortalWarning = 0;
  particles = [];
  popups = [];
  trail = [];

  ship.x = 100;
  ship.y = 280;
  ship.vx = 0;
  ship.vy = 0;

  buildLevel();
  initStars();
  updateHud("Misión activa");

  startScreen.classList.remove("active");
  deathScreen.classList.remove("active");
  winScreen.classList.remove("active");
  pauseBadge.classList.remove("active");

  cancelAnimationFrame(animationId);
  loop();
}

function loop() {
  update();
  draw();
  if (running) animationId = requestAnimationFrame(loop);
}

/* ======================= ACTUALIZACIÓN ======================= */
function update() {
  if (paused) return;
  missionTime++;

  /* --- Entrada y física de la nave --- */
  if (keys.left) ship.vx -= 0.42;
  if (keys.right) ship.vx += 0.42;
  if (keys.up) {
    ship.vy += thrust;
    makeFire(ship.x, ship.y + ship.h / 2);
  }

  ship.vy += gravity;
  ship.vx *= 0.965;
  ship.vy *= 0.985;

  const speedCap = boostTime > 0 ? 12.5 : ship.maxSpeed;
  if (boostTime > 0) boostTime--;
  ship.vx = clamp(ship.vx, -speedCap, speedCap);
  ship.vy = clamp(ship.vy, -10.2, 10.2);

  ship.x += ship.vx;
  ship.y += ship.vy;
  ship.x = clamp(ship.x, 0, levelWidth - ship.w);

  if (ship.y < 18) { ship.y = 18; ship.vy = 0; }
  if (ship.y > canvas.height + 80) takeDamage("Caíste al vacío espacial", true);

  // Estela de la nave.
  if (missionTime % 2 === 0 && (Math.abs(ship.vx) > 1 || Math.abs(ship.vy) > 1)) {
    trail.push({ x: ship.x + 14, y: ship.y + ship.h / 2, life: 22, maxLife: 22 });
  }
  for (const t of trail) t.life--;
  trail = trail.filter(t => t.life > 0);

  /* --- Plataformas móviles: actualizar posición y delta --- */
  for (const p of platforms) {
    if (p.kind !== "mover") continue;
    const prevX = p.x, prevY = p.y;
    const off = Math.sin(missionTime * p.speed + p.phase) * p.range;
    if (p.axis === "y") { p.y = p.baseY + off; p.x = p.baseX; }
    else { p.x = p.baseX + off; p.y = p.baseY; }
    p.dx = p.x - prevX;
    p.dy = p.y - prevY;
  }

  /* --- Colisiones con plataformas --- */
  for (const p of platforms) {
    if (overlap(ship, p)) {
      const topCollision = ship.y + ship.h - ship.vy <= p.y + 12;
      if (topCollision && ship.vy >= 0) {
        ship.y = p.y - ship.h;
        ship.vy = -0.8;
        // Si es móvil, la nave viaja con ella.
        if (p.kind === "mover") {
          ship.x += p.dx;
          ship.y += p.dy;
        }
      } else {
        takeDamage("Choque con plataforma orbital");
      }
    }
  }

  /* --- Asteroides superiores --- */
  for (const ob of obstacles) {
    ob.rot += ob.spin;
    if (ob.type === "asteroid" && circleRect(ob.x, ob.y, ob.r, ship)) takeDamage("Impacto con asteroide superior");
  }

  /* --- Lluvia de meteoritos en zonas designadas --- */
  const inMeteorZone = meteorZones.some(z => ship.x >= z.min && ship.x <= z.max);
  if (inMeteorZone) {
    meteorTimer--;
    if (meteorTimer <= 0) {
      meteorTimer = 70 + Math.random() * 60;
      const mx = cameraX + 260 + Math.random() * (canvas.width - 200);
      meteors.push({
        x: mx, y: -40,
        vx: -(0.8 + Math.random() * 1.2),
        vy: 3.0 + Math.random() * 1.6,
        r: 13 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        spin: 0.05 + Math.random() * 0.06
      });
    }
  }
  for (const m of meteors) {
    m.x += m.vx;
    m.y += m.vy;
    m.rot += m.spin;
    if (circleRect(m.x, m.y, m.r, ship)) {
      m.y = 9999; // se consume al impactar
      takeDamage("Impacto de meteorito");
    }
  }
  meteors = meteors.filter(m => m.y < canvas.height + 80);

  /* --- Checkpoints --- */
  for (const cp of checkpoints) {
    if (!cp.active && overlap(ship, cp)) {
      cp.active = true;
      checkpoint = { x: cp.x + 24, y: 470 };
      coins += checkpointReward;
      addPopup(`Checkpoint ${cp.label} +${checkpointReward}`, cp.x, cp.y - 20, "#86efac");
      burst(cp.x + cp.w / 2, cp.y + cp.h / 2, "#0A8F43", 34);
      sfx("checkpoint");
      updateHud(`Checkpoint ${cp.label} activado`);
    }
  }

  /* --- Cajas KSL --- */
  for (const box of boxes) {
    if (!box.hit && overlap(ship, box)) {
      box.hit = true;
      const amount = box.type === "special" ? 8 : box.type === "final" ? 12 : box.type === "shield" ? 5 : 3;
      coins += amount;
      if (box.type === "shield") shield = Math.min(CONFIG.maxShield, shield + 1);
      const label = box.type === "special" ? "Contenedor premium KSL +8"
        : box.type === "final" ? "Mega caja KSL +12"
        : box.type === "shield" ? "Caja escudo +5"
        : "Caja KSL +3";
      spawnBoxCoins(box.x + box.w / 2, box.y, amount);
      burst(box.x + box.w / 2, box.y + box.h / 2, box.type === "normal" ? "#0D2E8B" : "#F2C10A", 22);
      addPopup(label, box.x, box.y - 12, box.type === "shield" ? "#60a5fa" : "#F2C10A");
      sfx("box");
      updateHud(label);
    }
  }

  /* --- Power-ups --- */
  for (const pu of powerUps) {
    if (!pu.taken && circleRect(pu.x, pu.y, pu.r, ship)) {
      pu.taken = true;
      if (pu.type === "shield") {
        shield = Math.min(CONFIG.maxShield, shield + 1);
        updateHud("Escudo KSL activado");
        addPopup("ESCUDO", pu.x, pu.y - 20, "#60a5fa");
        burst(pu.x, pu.y, "#60a5fa", 28);
        sfx("shieldup");
      } else if (pu.type === "life") {
        lives = Math.min(CONFIG.maxLives, lives + 1);
        updateHud("Vida KSL recuperada");
        addPopup("+1 VIDA", pu.x, pu.y - 20, "#86efac");
        burst(pu.x, pu.y, "#86efac", 30);
        sfx("life");
      } else if (pu.type === "magnet") {
        magnetTime = 540; // ~9 segundos
        updateHud("Imán KSL: atrae monedas cercanas");
        addPopup("IMÁN 9s", pu.x, pu.y - 20, "#c084fc");
        burst(pu.x, pu.y, "#c084fc", 30);
        sfx("magnet");
      } else {
        ship.vx += ship.vx >= 0 ? 5.5 : -5.5;
        ship.vy = -7.2;
        boostTime = 45;
        updateHud("Impulso turbo KSL");
        addPopup("TURBO", pu.x, pu.y - 20, "#F2C10A");
        burst(pu.x, pu.y, "#F2C10A", 28);
        sfx("power");
      }
    }
  }

  /* --- Anillos de impulso --- */
  const scx = ship.x + ship.w / 2;
  const scy = ship.y + ship.h / 2;
  for (const ring of boostRings) {
    if (ring.cool > 0) ring.cool--;
    const dx = scx - ring.x, dy = scy - ring.y;
    if (ring.cool <= 0 && dx * dx + dy * dy < 52 * 52) {
      ring.cool = 90;
      ship.vx = Math.max(ship.vx, 0) + 8.5;
      ship.vy = Math.min(ship.vy, 0) - 3.2;
      boostTime = 45;
      addPopup("¡IMPULSO!", ring.x, ring.y - 60, "#7dd3fc");
      burst(ring.x, ring.y, "#7dd3fc", 32);
      sfx("ring");
      updateHud("Anillo de impulso atravesado");
    }
  }

  /* --- Efecto imán: atraer monedas cercanas --- */
  if (magnetTime > 0) {
    magnetTime--;
    for (const c of coinsMap) {
      if (c.taken) continue;
      const dx = scx - c.x, dy = scy - c.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 240 * 240 && d2 > 1) {
        c.x += dx * 0.085;
        c.y += dy * 0.085;
      }
    }
    if (magnetTime === 0) updateHud("Imán KSL agotado");
  }

  /* --- Monedas --- */
  for (const c of coinsMap) {
    c.spin += 0.09;
    if (!c.taken && circleRect(c.x, c.y, 18, ship)) {
      c.taken = true;
      coins += 1;
      addPopup("+1", c.x, c.y - 14, "#F2C10A");
      burst(c.x, c.y, "#F2C10A", 10);
      sfx("coin");
      updateHud("+1 moneda KSL");
    }
  }

  /* --- Gemas KSL (+5) --- */
  for (const g of gems) {
    if (!g.taken && circleRect(g.x, g.y, 22, ship)) {
      g.taken = true;
      coins += 5;
      addPopup("GEMA +5", g.x, g.y - 20, "#5eead4");
      burst(g.x, g.y, "#5eead4", 26);
      sfx("gem");
      updateHud("Gema KSL +5 monedas");
    }
  }

  /* --- Enemigos --- */
  for (const e of enemies) {
    if (e.type !== "mine") {
      e.x += e.vx;
      if (e.x < e.min || e.x > e.max) e.vx *= -1;
    }
    if (e.type === "sentry") e.y += Math.sin((missionTime + e.x) / 38) * 0.55;
    if (overlap(ship, e)) {
      takeDamage(
        e.type === "sentry" ? "Impacto con centinela aéreo" :
        e.type === "mine" ? "Detonación de mina espacial" :
        "Impacto con dron enemigo"
      );
    }
  }

  /* --- Portal / meta --- */
  if (overlap(ship, portal)) {
    if (coins >= maxCoins) win(); else needMoreCoins();
  }

  /* --- Cámara --- */
  const targetCameraX = clamp(ship.x - canvas.width * 0.30, 0, levelWidth - canvas.width);
  cameraX += (targetCameraX - cameraX) * 0.12;

  /* --- Partículas y popups --- */
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g || 0;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  for (const pop of popups) { pop.y -= 0.7; pop.life--; }
  popups = popups.filter(p => p.life > 0);

  /* --- Estrellas fugaces ocasionales --- */
  if (Math.random() < 0.006) {
    shootingStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4,
      vx: -(6 + Math.random() * 5),
      vy: 2 + Math.random() * 2,
      life: 40, maxLife: 40
    });
  }
  for (const s of shootingStars) { s.x += s.vx; s.y += s.vy; s.life--; }
  shootingStars = shootingStars.filter(s => s.life > 0);

  if (hitFlash > 0) hitFlash--;
  if (bannerTime > 0) bannerTime--;

  /* --- Cambio de sector: banner --- */
  const name = getSectorName();
  if (name !== currentSectorName) {
    currentSectorName = name;
    if (missionTime > 30) {
      bannerText = name;
      bannerTime = 150;
    }
    sectorEl.textContent = name;
  }
}

/* ======================= HUD Y ESTADO ======================== */
function updateHud(message) {
  coinsEl.textContent = `${coins}/${maxCoins}`;
  livesEl.textContent = lives;
  shieldEl.textContent = shield;
  statusEl.textContent = message;
  sectorEl.textContent = getSectorName();
}

function getSectorName() {
  let name = sectors[0].name;
  for (const s of sectors) if (ship.x >= s.at) name = s.name;
  return name;
}

function getSectorTint() {
  let tint = sectors[0].tint;
  for (const s of sectors) if (ship.x >= s.at) tint = s.tint;
  return tint;
}

function takeDamage(reason, fall = false) {
  if (!running) return;
  const now = Date.now();
  if (now - lastHit < 1050) return;
  lastHit = now;

  if (shield > 0 && !fall) {
    shield--;
    ship.vx *= 0.35;
    ship.vy *= 0.35;
    burst(ship.x + ship.w / 2, ship.y + ship.h / 2, "#60a5fa", 34);
    addPopup("Escudo absorbió daño", ship.x, ship.y - 20, "#60a5fa");
    sfx("shieldhit");
    updateHud("Escudo KSL usado");
    return;
  }

  lives--;
  hitFlash = 26;
  updateHud(reason);
  burst(ship.x + ship.w / 2, ship.y + ship.h / 2, "#E01818", 28);
  addPopup("-1 vida", ship.x, ship.y - 20, "#fb7185");
  sfx("hit");

  ship.vx *= 0.28;
  ship.vy *= 0.28;

  if (fall) {
    ship.x = checkpoint.x;
    ship.y = checkpoint.y;
    ship.vx = 0;
    ship.vy = 0;
  }

  if (lives <= 0) die();
}

function die() {
  running = false;
  cancelAnimationFrame(animationId);
  sfx("lose");
  deathCoinsEl.textContent = coins;
  deathSectorEl.textContent = getSectorName();
  deathProgressEl.textContent = `${Math.floor(clamp(ship.x / (levelWidth - ship.w), 0, 1) * 100)}%`;
  deathScreen.classList.add("active");
}

function needMoreCoins() {
  const now = Date.now();
  if (now - lastPortalWarning < 1300) return;
  lastPortalWarning = now;

  const missing = Math.max(0, maxCoins - coins);
  updateHud(`Faltan ${missing} monedas para reclamar el premio`);
  addPopup(`Faltan ${missing}`, ship.x, ship.y - 26, "#F2C10A");
  burst(ship.x + ship.w / 2, ship.y + ship.h / 2, "#F2C10A", 18);
  sfx("warn");

  ship.x = Math.max(0, ship.x - 160);
  ship.vx = -5;
  ship.vy = -4;
}

function win() {
  if (won) return;
  won = true;
  running = false;
  cancelAnimationFrame(animationId);
  sfx("win");
  if (coins > bestCoins) {
    bestCoins = coins;
    localStorage.setItem("ksl_best_coins", String(bestCoins));
  }
  menuBestEl.textContent = `${bestCoins} 🪙`;
  winCoinsEl.textContent = `${coins} — récord: ${bestCoins}`;
  winTimeEl.textContent = formatTime(missionTime);
  updateHud("Premio desbloqueado");
  winScreen.classList.add("active");
}

function formatTime(frames) {
  const total = Math.floor(frames / 60);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ========================== DIBUJO =========================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpace();

  ctx.save();
  ctx.translate(-cameraX * 0.3, 0);
  drawPlanets();
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX * 0.55, 0);
  drawNebulas();
  drawComets();
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX, 0);
  drawPlatforms();
  drawBoostRings();
  drawObstacles();
  drawMeteors();
  drawCheckpoints();
  drawBoxes();
  drawPowerUps();
  drawGems();
  drawCoins();
  drawEnemies();
  drawPortal();
  drawTrail();
  drawParticles();
  drawPopups();
  drawShip();
  ctx.restore();

  drawSectorTint();
  drawDistanceBar();
  drawSectorBanner();
  drawMiniTips();
  drawDamageOverlay();
}

/* ------------------ Fondo profundo y estrellas ---------------- */
let _bgGrad = null;
function drawSpace() {
  // El gradiente de fondo es estático: se crea una sola vez y se reutiliza.
  if (!_bgGrad) {
    _bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    _bgGrad.addColorStop(0, "#00020a");
    _bgGrad.addColorStop(0.42, "#06112b");
    _bgGrad.addColorStop(0.75, "#070b18");
    _bgGrad.addColorStop(1, "#020617");
  }
  ctx.fillStyle = _bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Estrellas con parallax por profundidad y titileo.
  for (const s of stars) {
    s.tw += s.twSpeed;
    const sx = mod(s.x - cameraX * s.depth, canvas.width + 10) - 5;
    const twinkle = 0.65 + Math.sin(s.tw) * 0.35;
    ctx.globalAlpha = s.alpha * twinkle;
    ctx.fillStyle = s.depth > 0.4 ? "#ffffff" : "#bcd3ff";
    ctx.beginPath();
    ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Estrellas fugaces.
  for (const s of shootingStars) {
    const a = s.life / s.maxLife;
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * a})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 5, s.y - s.vy * 5);
    ctx.stroke();
  }
}

function drawNebulas() {
  const nebulas = [
    { x: 520,   y: 150, r: 280, c: "rgba(13,46,139,.32)" },
    { x: 1900,  y: 230, r: 300, c: "rgba(10,143,67,.22)" },
    { x: 3300,  y: 130, r: 280, c: "rgba(242,193,10,.17)" },
    { x: 4800,  y: 190, r: 320, c: "rgba(224,24,24,.18)" },
    { x: 6300,  y: 150, r: 340, c: "rgba(13,46,139,.28)" },
    { x: 7800,  y: 220, r: 300, c: "rgba(10,143,67,.2)" },
    { x: 9400,  y: 170, r: 340, c: "rgba(125,211,252,.16)" },
    { x: 11000, y: 210, r: 320, c: "rgba(224,24,24,.2)" },
    { x: 12600, y: 150, r: 350, c: "rgba(168,85,247,.18)" },
    { x: 14100, y: 205, r: 320, c: "rgba(13,46,139,.26)" }
  ];
  const pulse = Math.sin(missionTime / 90) * 0.06 + 1;
  for (const n of nebulas) {
    // Culling: la capa está trasladada -cameraX*0.55, así que la posición
    // en pantalla es n.x - cameraX*0.55. Si no es visible, no la dibujamos.
    const sx = n.x - cameraX * 0.55;
    if (sx + n.r < -40 || sx - n.r > canvas.width + 40) continue;
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * pulse);
    g.addColorStop(0, n.c);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlanets() {
  drawPlanet(700,  150, 74, "#0D2E8B", "#60a5fa", true);
  drawPlanet(1900, 120, 52, "#0A8F43", "#86efac", false);
  drawPlanet(3200, 155, 84, "#E01818", "#fb7185", true);
  drawPlanet(4400, 110, 56, "#F2C10A", "#fde68a", false);
  drawPlanet(5600, 145, 68, "#312e81", "#a5b4fc", true);
  drawPlanet(6800, 125, 50, "#0f766e", "#5eead4", false);
  drawPlanet(8000, 155, 80, "#7c2d12", "#fdba74", true);
}

function drawPlanet(x, y, r, color, ring, craters) {
  // Culling: la capa está trasladada -cameraX*0.3. Descartamos si no se ve.
  const sx = x - cameraX * 0.3;
  const halo = r * 1.6;
  if (sx + halo < -40 || sx - halo > canvas.width + 40) return;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, 5, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,.55)");
  g.addColorStop(0.18, color);
  g.addColorStop(1, "#020617");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Cráteres sutiles.
  if (craters) {
    ctx.fillStyle = "rgba(2,6,23,.28)";
    ctx.beginPath(); ctx.arc(x + r * 0.3,  y - r * 0.15, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.25, y + r * 0.3,  r * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.05, y + r * 0.42, r * 0.08, 0, Math.PI * 2); ctx.fill();
  }

  // Anillo trasero + delantero para dar volumen.
  ctx.strokeStyle = ring;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.45, r * 0.35, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.6, r * 0.42, -0.35, 0, Math.PI * 2);
  ctx.stroke();
}

function drawComets() {
  for (let x = 1000; x < levelWidth * 0.6; x += 2400) {
    const y = 80 + ((x / 100) % 140);
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 120, y + 45);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ------------------------ Plataformas ------------------------ */
function drawPlatforms() {
  for (const p of platforms) {
    if (p.x + p.w < cameraX - 60 || p.x > cameraX + canvas.width + 60) continue;

    const isMover = p.kind === "mover";
    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    grad.addColorStop(0, p.kind === "ground" ? "#3b4a63" : isMover ? "#3a2a5e" : "#1f3b5a");
    grad.addColorStop(1, "#0c1424");
    ctx.fillStyle = grad;
    roundRect(p.x, p.y, p.w, p.h, isMover ? 13 : 18);

    // Borde luminoso superior.
    ctx.fillStyle = p.kind === "high" ? "#F2C10A" : isMover ? "#c084fc" : "#D9D9D9";
    ctx.fillRect(p.x + 6, p.y, p.w - 12, isMover ? 8 : 10);

    // Paneles metálicos.
    ctx.fillStyle = "rgba(255,255,255,.13)";
    for (let x = p.x + 24; x < p.x + p.w - 24; x += 62) ctx.fillRect(x, p.y + (isMover ? 14 : 28), 36, isMover ? 7 : 10);

    // Balizas parpadeantes en los extremos del suelo.
    if (p.kind === "ground") {
      const blink = (Math.sin(missionTime / 14 + p.x) + 1) / 2;
      ctx.fillStyle = `rgba(242,193,10,${0.35 + blink * 0.55})`;
      ctx.beginPath(); ctx.arc(p.x + 12, p.y + 5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + p.w - 12, p.y + 5, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Propulsores inferiores en plataformas móviles.
    if (isMover) {
      const flick = Math.random() * 4;
      ctx.fillStyle = "rgba(192,132,252,.55)";
      ctx.beginPath();
      ctx.moveTo(p.x + 26, p.y + p.h);
      ctx.lineTo(p.x + 34, p.y + p.h + 12 + flick);
      ctx.lineTo(p.x + 42, p.y + p.h);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(p.x + p.w - 42, p.y + p.h);
      ctx.lineTo(p.x + p.w - 34, p.y + p.h + 12 + flick);
      ctx.lineTo(p.x + p.w - 26, p.y + p.h);
      ctx.closePath(); ctx.fill();
    }
  }
}

/* --------------------- Anillos de impulso --------------------- */
function drawBoostRings() {
  for (const ring of boostRings) {
    if (ring.x < cameraX - 120 || ring.x > cameraX + canvas.width + 120) continue;
    const active = ring.cool <= 0;
    const pulse = Math.sin(missionTime / 10 + ring.x) * 4;
    ctx.save();
    ctx.shadowColor = active ? "#7dd3fc" : "#334155";
    ctx.shadowBlur = active ? 10 : 3;
    ctx.strokeStyle = active ? "rgba(125,211,252,.95)" : "rgba(100,116,139,.5)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(ring.x, ring.y, 22, 52 + pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = active ? "rgba(255,255,255,.6)" : "rgba(148,163,184,.3)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(ring.x, ring.y, 14, 40 + pulse * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    if (active) {
      ctx.fillStyle = "rgba(125,211,252,.85)";
      ctx.font = "700 12px Orbitron, Arial";
      ctx.textAlign = "center";
      ctx.fillText("IMPULSO", ring.x, ring.y - 66);
      ctx.textAlign = "left";
    }
  }
}

/* ------------------ Asteroides y meteoritos ------------------- */
function drawObstacles() {
  for (const ob of obstacles) {
    if (ob.type !== "asteroid") continue;
    if (ob.x < cameraX - 100 || ob.x > cameraX + canvas.width + 100) continue;
    ctx.save();
    ctx.translate(ob.x, ob.y);
    ctx.rotate(ob.rot);
    const g = ctx.createRadialGradient(-ob.r * 0.3, -ob.r * 0.35, 4, 0, 0, ob.r);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(0.25, "#64748b");
    g.addColorStop(1, "#1e293b");
    ctx.fillStyle = g;
    // Silueta irregular.
    ctx.beginPath();
    for (let i = 0; i <= 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const rr = ob.r * (0.86 + Math.sin(i * 2.7) * 0.14);
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(15,23,42,.55)";
    ctx.beginPath(); ctx.arc(ob.r * 0.25, -ob.r * 0.1, ob.r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-ob.r * 0.2, ob.r * 0.22, ob.r * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawMeteors() {
  for (const m of meteors) {
    // Cola ardiente.
    const tg = ctx.createLinearGradient(m.x - m.vx * 10, m.y - m.vy * 10, m.x, m.y);
    tg.addColorStop(0, "rgba(242,193,10,0)");
    tg.addColorStop(0.6, "rgba(242,193,10,.5)");
    tg.addColorStop(1, "rgba(255,120,50,.9)");
    ctx.strokeStyle = tg;
    ctx.lineWidth = m.r * 0.9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(m.x - m.vx * 10, m.y - m.vy * 10);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();

    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rot);
    const g = ctx.createRadialGradient(-m.r * 0.3, -m.r * 0.3, 2, 0, 0, m.r);
    g.addColorStop(0, "#fed7aa");
    g.addColorStop(0.4, "#9a3412");
    g.addColorStop(1, "#431407");
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rr = m.r * (0.85 + Math.sin(i * 3.1) * 0.15);
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/* ------------------------- Checkpoints ------------------------ */
function drawCheckpoints() {
  for (const cp of checkpoints) {
    if (cp.x + cp.w < cameraX - 60 || cp.x > cameraX + canvas.width + 60) continue;
    const cx = cp.x + cp.w / 2;
    const baseY = cp.y + cp.h - 8;
    const pulse = Math.sin(missionTime / 16 + cp.x) * 0.5 + 0.5;
    ctx.save();

    ctx.shadowColor = cp.active ? "#22c55e" : "#F2C10A";
    ctx.shadowBlur = cp.active ? 9 : 6 + pulse * 4;

    const baseGrad = ctx.createLinearGradient(cp.x, cp.y, cp.x, cp.y + cp.h);
    baseGrad.addColorStop(0, cp.active ? "#86efac" : "#fde68a");
    baseGrad.addColorStop(0.45, cp.active ? "#0A8F43" : "#0D2E8B");
    baseGrad.addColorStop(1, "#020617");
    ctx.fillStyle = baseGrad;
    roundRect(cp.x + 28, cp.y + 28, cp.w - 56, cp.h - 24, 14);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(cx - 12, cp.y + 36, 24, cp.h - 44);
    ctx.fillStyle = cp.active ? "#bbf7d0" : "#fff7cc";
    ctx.beginPath();
    ctx.arc(cx, cp.y + 26, 22 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = cp.active ? "#22c55e" : "#F2C10A";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cp.y + 26, 34 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();

    // Haz vertical de la baliza.
    const beam = ctx.createLinearGradient(cx, cp.y - 220, cx, cp.y + 20);
    beam.addColorStop(0, "rgba(255,255,255,0)");
    beam.addColorStop(1, cp.active ? "rgba(34,197,94,.28)" : "rgba(242,193,10,.2)");
    ctx.fillStyle = beam;
    ctx.fillRect(cx - 8, cp.y - 220, 16, 240);

    ctx.fillStyle = "rgba(2,6,23,.86)";
    roundRect(cp.x + 8, baseY - 30, cp.w - 16, 36, 12);
    ctx.fillStyle = cp.active ? "#86efac" : "#F2C10A";
    ctx.font = "900 14px Orbitron, Arial";
    ctx.textAlign = "center";
    ctx.fillText(cp.active ? "GUARDADO" : cp.label, cx, baseY - 8);

    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.fillRect(cp.x + 18, baseY + 4, cp.w - 36, 6);
    ctx.textAlign = "left";
    ctx.restore();
  }
}

/* --------------------------- Cajas ---------------------------- */
function drawBoxes() {
  for (const b of boxes) {
    if (b.x + b.w < cameraX - 60 || b.x > cameraX + canvas.width + 60) continue;
    ctx.save();
    if (b.hit) ctx.globalAlpha = 0.25;
    const primary = b.type === "normal" ? "#0D2E8B" : b.type === "shield" ? "#38bdf8" : b.type === "special" ? "#F2C10A" : "#0A8F43";
    const secondary = b.type === "special" || b.type === "final" ? "#111827" : "#ffffff";
    const hover = b.hit ? 0 : Math.sin(missionTime / 22 + b.x) * 3;
    ctx.translate(0, hover);
    ctx.shadowColor = primary;
    ctx.shadowBlur = b.hit ? 0 : 9;
    const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(0.18, primary);
    g.addColorStop(1, "#020617");
    ctx.fillStyle = g;
    roundRect(b.x, b.y, b.w, b.h, 18);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.beginPath();
    ctx.moveTo(b.x + 12, b.y + 10);
    ctx.lineTo(b.x + b.w - 12, b.y + 10);
    ctx.lineTo(b.x + b.w - 24, b.y + 28);
    ctx.lineTo(b.x + 24, b.y + 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.78)";
    ctx.lineWidth = 3;
    roundStroke(b.x + 7, b.y + 7, b.w - 14, b.h - 14, 14);
    ctx.fillStyle = secondary;
    ctx.font = "900 19px Orbitron, Arial";
    ctx.textAlign = "center";
    ctx.fillText("KSL", b.x + b.w / 2, b.y + 42);
    ctx.font = "700 10px Orbitron, Arial";
    ctx.fillText(b.type === "shield" ? "ESCUDO" : b.type === "final" ? "MEGA" : b.type === "special" ? "PLUS" : "BOX", b.x + b.w / 2, b.y + 57);
    ctx.textAlign = "left";
    ctx.restore();
  }
}

/* ------------------------- Power-ups -------------------------- */
function drawPowerUps() {
  for (const pu of powerUps) {
    if (pu.taken) continue;
    if (pu.x < cameraX - 80 || pu.x > cameraX + canvas.width + 80) continue;
    const pulse = Math.sin(missionTime / 12 + pu.x) * 3;
    const glowColor = pu.type === "shield" ? "#60a5fa" : pu.type === "life" ? "#86efac" : pu.type === "magnet" ? "#c084fc" : "#F2C10A";
    const fill = pu.type === "shield" ? "rgba(96,165,250,.9)" : pu.type === "life" ? "rgba(134,239,172,.92)" : pu.type === "magnet" ? "rgba(192,132,252,.9)" : "rgba(242,193,10,.92)";
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, pu.r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();
    // Anillo orbital decorativo.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255,255,255,.35)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(pu.x, pu.y, pu.r + 10 + pulse, (pu.r + 10 + pulse) * 0.4, missionTime / 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#020617";
    ctx.font = "900 17px Orbitron, Arial";
    ctx.textAlign = "center";
    ctx.fillText(pu.type === "shield" ? "S" : pu.type === "life" ? "+" : pu.type === "magnet" ? "M" : "T", pu.x, pu.y + 6);
    ctx.textAlign = "left";
    ctx.restore();
  }
}

/* --------------------------- Gemas ----------------------------- */
function drawGems() {
  for (const g of gems) {
    if (g.taken) continue;
    if (g.x < cameraX - 80 || g.x > cameraX + canvas.width + 80) continue;
    const hover = Math.sin(missionTime / 18 + g.x) * 5;
    const y = g.y + hover;
    ctx.save();
    ctx.shadowColor = "#5eead4";
    ctx.shadowBlur = 10;
    const grad = ctx.createLinearGradient(g.x - 16, y - 20, g.x + 16, y + 20);
    grad.addColorStop(0, "#ccfbf1");
    grad.addColorStop(0.5, "#2dd4bf");
    grad.addColorStop(1, "#0A8F43");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(g.x, y - 20);
    ctx.lineTo(g.x + 15, y - 4);
    ctx.lineTo(g.x, y + 20);
    ctx.lineTo(g.x - 15, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Faceta interna.
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(g.x - 8, y - 5); ctx.lineTo(g.x, y - 20); ctx.lineTo(g.x + 8, y - 5);
    ctx.stroke();
    ctx.fillStyle = "rgba(2,6,23,.75)";
    ctx.font = "900 11px Orbitron, Arial";
    ctx.textAlign = "center";
    ctx.fillText("+5", g.x, y + 3);
    ctx.textAlign = "left";
    ctx.restore();
  }
}

/* --------------------- Monedas giratorias --------------------- */
function drawCoins() {
  for (const c of coinsMap) {
    if (c.taken) continue;
    if (c.x < cameraX - 60 || c.x > cameraX + canvas.width + 60) continue;
    const flip = Math.abs(Math.cos(c.spin));      // efecto de giro 3D
    const rx = Math.max(3, 16 * flip);
    const g = ctx.createRadialGradient(c.x - 5, c.y - 8, 2, c.x, c.y, 23);
    g.addColorStop(0, "#fff7ad");
    g.addColorStop(0.45, "#F2C10A");
    g.addColorStop(1, "#92400e");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rx, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff3b0";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (flip > 0.55) {
      ctx.fillStyle = "#0A8F43";
      ctx.font = "900 13px Orbitron, Arial";
      ctx.textAlign = "center";
      ctx.fillText("K", c.x, c.y + 5);
      ctx.textAlign = "left";
    }
    // Destello ocasional.
    if ((missionTime + Math.floor(c.x)) % 120 < 8) {
      ctx.strokeStyle = "rgba(255,255,255,.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x - 7, c.y - 24); ctx.lineTo(c.x - 3, c.y - 18);
      ctx.moveTo(c.x - 9, c.y - 20); ctx.lineTo(c.x - 1, c.y - 22);
      ctx.stroke();
    }
  }
}

/* -------------------------- Enemigos --------------------------- */
function drawEnemies() {
  for (const e of enemies) {
    if (e.x + e.w < cameraX - 80 || e.x > cameraX + canvas.width + 80) continue;
    ctx.save();

    if (e.type === "mine") {
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2 + Math.sin(missionTime / 26 + e.x) * 4;
      const pulse = (Math.sin(missionTime / 9 + e.x) + 1) / 2;
      ctx.shadowColor = "#E01818";
      ctx.shadowBlur = 7 + pulse * 6;
      const g = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 22);
      g.addColorStop(0, "#94a3b8");
      g.addColorStop(0.5, "#334155");
      g.addColorStop(1, "#0f172a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Púas.
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + missionTime / 60;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18);
        ctx.lineTo(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28);
        ctx.stroke();
      }
      // Núcleo de advertencia.
      ctx.fillStyle = `rgba(224,24,24,${0.5 + pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 7 + pulse * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    const isSentry = e.type === "sentry";
    ctx.shadowColor = isSentry ? "#F2C10A" : "#E01818";
    ctx.shadowBlur = 7;
    const bodyGrad = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
    bodyGrad.addColorStop(0, isSentry ? "#b91c1c" : "#ff3b3b");
    bodyGrad.addColorStop(1, isSentry ? "#450a0a" : "#7f1d1d");
    ctx.fillStyle = bodyGrad;
    roundRect(e.x, e.y, e.w, e.h, 14);
    ctx.shadowBlur = 0;

    // Visor con "ojo" que escanea.
    ctx.fillStyle = "#111827";
    ctx.fillRect(e.x + 9, e.y + 12, e.w - 18, 13);
    const eyeX = e.x + 14 + ((Math.sin(missionTime / 20 + e.x) + 1) / 2) * (e.w - 34);
    ctx.fillStyle = isSentry ? "#F2C10A" : "#60a5fa";
    ctx.beginPath();
    ctx.arc(eyeX, e.y + 18, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Propulsores animados.
    const flick = Math.random() * 5;
    ctx.fillStyle = isSentry ? "rgba(242,193,10,.6)" : "rgba(96,165,250,.6)";
    ctx.beginPath();
    ctx.moveTo(e.x + 20, e.y + e.h);
    ctx.lineTo(e.x + 26, e.y + e.h + 10 + flick);
    ctx.lineTo(e.x + 32, e.y + e.h);
    ctx.closePath(); ctx.fill();

    // Anillo orbital de los centinelas.
    if (isSentry) {
      ctx.strokeStyle = "rgba(242,193,10,.55)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w * 0.85, e.h * 0.4, missionTime / 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* --------------------------- Portal ---------------------------- */
function drawPortal() {
  const cx = portal.x + portal.w / 2;
  const cy = portal.y + portal.h / 2;
  const pulse = Math.sin(missionTime / 18) * 10;

  const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, 195 + pulse);
  g.addColorStop(0, "rgba(242,193,10,.95)");
  g.addColorStop(0.45, "rgba(10,143,67,.65)");
  g.addColorStop(1, "rgba(13,46,139,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 195 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Anillos elípticos.
  ctx.strokeStyle = "#F2C10A";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 65 + pulse * 0.08, 130 + pulse * 0.18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#0A8F43";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 92, 155, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Partículas orbitando el portal.
  for (let i = 0; i < 10; i++) {
    const a = missionTime / 30 + (i / 10) * Math.PI * 2;
    const px = cx + Math.cos(a) * 95;
    const py = cy + Math.sin(a) * 150;
    ctx.fillStyle = i % 2 ? "rgba(242,193,10,.85)" : "rgba(134,239,172,.8)";
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "white";
  ctx.font = "900 26px Orbitron, Arial";
  ctx.textAlign = "center";
  ctx.fillText("PREMIO", cx, portal.y - 42);
  ctx.font = "700 16px Orbitron, Arial";
  ctx.fillStyle = "#F2C10A";
  ctx.fillText(`${maxCoins} MONEDAS`, cx, portal.y - 16);
  ctx.textAlign = "left";
}

/* --------------------------- Nave ------------------------------ */
function drawTrail() {
  for (const t of trail) {
    const a = t.life / t.maxLife;
    ctx.fillStyle = `rgba(96,165,250,${0.22 * a})`;
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, 16 * a, 7 * a, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShip() {
  const x = ship.x;
  const y = ship.y;
  const cx = x + ship.w / 2;
  const cy = y + ship.h / 2;
  const thrustOn = keys.up || Math.abs(ship.vx) > 1.5;
  const tilt = clamp(ship.vy * 0.028, -0.3, 0.3);

  // Halo de energía.
  const glow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 92);
  glow.addColorStop(0, boostTime > 0 ? "rgba(242,193,10,.28)" : "rgba(10,143,67,.22)");
  glow.addColorStop(0.45, "rgba(13,46,139,.18)");
  glow.addColorStop(1, "rgba(13,46,139,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.fill();

  // Aura del imán.
  if (magnetTime > 0) {
    const ma = 0.25 + Math.sin(missionTime / 8) * 0.12;
    ctx.strokeStyle = `rgba(192,132,252,${ma})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.arc(cx, cy, 120, missionTime / 40, missionTime / 40 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.translate(-ship.w / 2, -ship.h / 2);

  // Llamas de propulsión.
  if (thrustOn) {
    const flicker = Math.random() * 10;
    const boostExtra = boostTime > 0 ? 22 : 0;
    const flameOuter = ctx.createLinearGradient(-58 - boostExtra, ship.h / 2, 12, ship.h / 2);
    flameOuter.addColorStop(0, "rgba(37,99,235,0)");
    flameOuter.addColorStop(0.35, "rgba(96,165,250,.78)");
    flameOuter.addColorStop(1, "rgba(14,165,233,.94)");
    ctx.fillStyle = flameOuter;
    ctx.beginPath();
    ctx.moveTo(8, ship.h / 2 - 15);
    ctx.lineTo(-50 - flicker - boostExtra, ship.h / 2);
    ctx.lineTo(8, ship.h / 2 + 15);
    ctx.closePath();
    ctx.fill();

    const flameInner = ctx.createLinearGradient(-34, ship.h / 2, 10, ship.h / 2);
    flameInner.addColorStop(0, "rgba(242,193,10,0)");
    flameInner.addColorStop(0.55, "rgba(242,193,10,.88)");
    flameInner.addColorStop(1, "rgba(255,255,255,.95)");
    ctx.fillStyle = flameInner;
    ctx.beginPath();
    ctx.moveTo(7, ship.h / 2 - 8);
    ctx.lineTo(-29 - flicker * 0.65 - boostExtra * 0.6, ship.h / 2);
    ctx.lineTo(7, ship.h / 2 + 8);
    ctx.closePath();
    ctx.fill();
  }

  // Ala azul superior.
  const blueWing = ctx.createLinearGradient(6, -20, 52, 34);
  blueWing.addColorStop(0, "#0D2E8B");
  blueWing.addColorStop(0.65, "#2563eb");
  blueWing.addColorStop(1, "#93c5fd");
  ctx.fillStyle = blueWing;
  ctx.beginPath();
  ctx.moveTo(42, 12);
  ctx.lineTo(7, -24);
  ctx.lineTo(22, 21);
  ctx.lineTo(50, 25);
  ctx.closePath();
  ctx.fill();

  // Ala roja inferior.
  const redWing = ctx.createLinearGradient(6, 78, 52, 28);
  redWing.addColorStop(0, "#E01818");
  redWing.addColorStop(0.65, "#ef4444");
  redWing.addColorStop(1, "#fecaca");
  ctx.fillStyle = redWing;
  ctx.beginPath();
  ctx.moveTo(42, 42);
  ctx.lineTo(7, 78);
  ctx.lineTo(22, 33);
  ctx.lineTo(50, 29);
  ctx.closePath();
  ctx.fill();

  // Sombra técnica bajo el casco.
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(49, 34, 56, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  // Casco principal metálico.
  const hull = ctx.createLinearGradient(3, 0, 100, 55);
  hull.addColorStop(0, "#f8fafc");
  hull.addColorStop(0.28, "#cbd5e1");
  hull.addColorStop(0.52, "#f1f5f9");
  hull.addColorStop(0.78, "#94a3b8");
  hull.addColorStop(1, "#e5e7eb");
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(100, 27);
  ctx.bezierCurveTo(84, 7, 61, 0, 35, 7);
  ctx.bezierCurveTo(18, 11, 4, 19, -10, 27);
  ctx.bezierCurveTo(4, 35, 18, 43, 35, 47);
  ctx.bezierCurveTo(61, 54, 84, 47, 100, 27);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(226,232,240,.95)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = "rgba(15,23,42,.46)";
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Nariz amarilla.
  const nose = ctx.createLinearGradient(66, 10, 101, 44);
  nose.addColorStop(0, "#fde047");
  nose.addColorStop(0.45, "#F2C10A");
  nose.addColorStop(1, "#b45309");
  ctx.fillStyle = nose;
  ctx.beginPath();
  ctx.moveTo(100, 27);
  ctx.lineTo(65, 11);
  ctx.bezierCurveTo(74, 23, 74, 31, 65, 43);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(120,53,15,.55)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Paneles laterales.
  ctx.fillStyle = "#0D2E8B";
  ctx.beginPath();
  ctx.moveTo(28, 10); ctx.lineTo(56, 6); ctx.lineTo(47, 18); ctx.lineTo(21, 22);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = "#E01818";
  ctx.beginPath();
  ctx.moveTo(28, 44); ctx.lineTo(56, 48); ctx.lineTo(47, 36); ctx.lineTo(21, 32);
  ctx.closePath(); ctx.fill();

  // Emblema verde KSL.
  ctx.strokeStyle = "#0A8F43";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(22, 38);
  ctx.bezierCurveTo(37, 7, 64, 10, 78, 27);
  ctx.stroke();
  ctx.strokeStyle = "rgba(187,247,208,.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 37);
  ctx.bezierCurveTo(39, 11, 61, 13, 75, 27);
  ctx.stroke();

  // Cabina.
  const canopy = ctx.createLinearGradient(45, 15, 78, 36);
  canopy.addColorStop(0, "#020617");
  canopy.addColorStop(0.55, "#0f172a");
  canopy.addColorStop(1, "#38bdf8");
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.ellipse(64, 25, 18, 10, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(14,165,233,.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(125,211,252,.9)";
  ctx.beginPath();
  ctx.ellipse(69, 21, 6, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Motores traseros.
  const engineGrad = ctx.createLinearGradient(-4, 18, 16, 36);
  engineGrad.addColorStop(0, "#111827");
  engineGrad.addColorStop(0.5, "#475569");
  engineGrad.addColorStop(1, "#020617");
  ctx.fillStyle = engineGrad;
  ctx.beginPath();
  ctx.roundRect(-4, 18, 22, 18, 7);
  ctx.fill();
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = thrustOn ? "#60a5fa" : "#1e293b";
  ctx.beginPath();
  ctx.arc(1, 27, 4.8, 0, Math.PI * 2);
  ctx.fill();

  // Líneas de placas.
  ctx.strokeStyle = "rgba(15,23,42,.32)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(31, 14); ctx.lineTo(44, 24); ctx.lineTo(31, 40);
  ctx.moveTo(51, 9);  ctx.lineTo(60, 20);
  ctx.moveTo(51, 45); ctx.lineTo(60, 34);
  ctx.stroke();

  ctx.fillStyle = "#0A8F43";
  ctx.font = "900 10px Orbitron, Arial";
  ctx.fillText("KSL", 32, 32);

  ctx.restore();

  // Burbuja de escudo (fuera de la rotación para mantenerla estable).
  if (shield > 0) {
    const shieldPulse = Math.sin(missionTime * 0.08) * 2;
    ctx.strokeStyle = "rgba(96,165,250,.78)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70 + shieldPulse, 48 + shieldPulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(242,193,10,.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 77 + shieldPulse, 54 + shieldPulse, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/* --------------------- Partículas y popups --------------------- */
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawPopups() {
  for (const p of popups) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.font = "900 19px Orbitron, Arial";
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}

/* -------------------- Superposiciones de UI -------------------- */
function drawSectorTint() {
  // Tinte ambiental muy sutil según el sector actual.
  const tint = getSectorTint();
  const g = ctx.createRadialGradient(canvas.width / 2, -100, 100, canvas.width / 2, 0, canvas.height * 1.1);
  g.addColorStop(0, tint);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawDistanceBar() {
  const margin = 26;
  const w = canvas.width - margin * 2;
  const h = 10;
  const progress = clamp(ship.x / (levelWidth - ship.w), 0, 1);

  ctx.fillStyle = "rgba(255,255,255,.16)";
  roundRect(margin, 22, w, h, 8);

  const grad = ctx.createLinearGradient(margin, 0, margin + w, 0);
  grad.addColorStop(0, "#0D2E8B");
  grad.addColorStop(0.5, "#0A8F43");
  grad.addColorStop(1, "#F2C10A");
  ctx.fillStyle = grad;
  roundRect(margin, 22, Math.max(6, w * progress), h, 8);

  // Marcas de checkpoints en la barra.
  for (const cp of checkpoints) {
    const tx = margin + (cp.x / levelWidth) * w;
    ctx.fillStyle = cp.active ? "#22c55e" : "rgba(255,255,255,.55)";
    ctx.fillRect(tx - 1.5, 19, 3, 16);
  }

  // Marcador de la nave.
  const shipX = margin + progress * w;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(shipX, 16);
  ctx.lineTo(shipX + 6, 22);
  ctx.lineTo(shipX - 6, 22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 14px Orbitron, Arial";
  ctx.fillText(`${Math.floor(progress * 100)}%`, margin, 16);
  ctx.textAlign = "right";
  ctx.fillText("META", margin + w, 16);
  ctx.textAlign = "left";
}

function drawSectorBanner() {
  if (bannerTime <= 0 || !bannerText) return;
  const t = bannerTime / 150;
  const alpha = t > 0.85 ? (1 - t) / 0.15 : t < 0.25 ? t / 0.25 : 1;
  const slide = t > 0.85 ? (t - 0.85) / 0.15 * -30 : 0;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, slide);

  const cy = 110;
  ctx.fillStyle = "rgba(2,6,23,.72)";
  roundRect(canvas.width / 2 - 280, cy - 38, 560, 66, 18);

  ctx.strokeStyle = "rgba(242,193,10,.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 240, cy + 16);
  ctx.lineTo(canvas.width / 2 + 240, cy + 16);
  ctx.stroke();

  ctx.fillStyle = "#F2C10A";
  ctx.font = "700 13px Orbitron, Arial";
  ctx.textAlign = "center";
  ctx.fillText("ENTRANDO A SECTOR", canvas.width / 2, cy - 14);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px Orbitron, Arial";
  ctx.fillText(bannerText.toUpperCase(), canvas.width / 2, cy + 8 + 2);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawMiniTips() {
  if (!running || paused || missionTime > 520) return;
  ctx.fillStyle = "rgba(2,6,23,.7)";
  roundRect(30, canvas.height - 82, 760, 52, 16);
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "700 16px Orbitron, Arial";
  ctx.fillText("Tip: cruza los anillos de impulso, busca gemas +5 en las alturas y reúne 120 monedas.", 48, canvas.height - 50);
}

function drawDamageOverlay() {
  // Viñeta roja al recibir daño.
  if (hitFlash > 0) {
    const a = (hitFlash / 26) * 0.4;
    const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.width * 0.72);
    g.addColorStop(0, "rgba(224,24,24,0)");
    g.addColorStop(1, `rgba(224,24,24,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Pulso de advertencia con 1 vida.
  if (running && !paused && lives === 1) {
    const a = (Math.sin(missionTime / 12) + 1) / 2 * 0.16;
    const g = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.42, canvas.width / 2, canvas.height / 2, canvas.width * 0.72);
    g.addColorStop(0, "rgba(224,24,24,0)");
    g.addColorStop(1, `rgba(224,24,24,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/* ----------------------- Partículas util ----------------------- */
function spawnBoxCoins(x, y, amount) {
  for (let i = 0; i < amount * 4; i++) {
    particles.push({ x, y, vx: Math.random() * 6 - 3, vy: Math.random() * -6 - 1.5, r: Math.random() * 4 + 2, color: Math.random() > 0.25 ? "#F2C10A" : "#ffffff", life: 46, maxLife: 46, g: 0.16 });
  }
}

function makeFire(x, y) {
  particles.push({ x, y, vx: Math.random() * -5 - 1, vy: Math.random() * 3 - 1.5, r: Math.random() * 4 + 2, color: Math.random() > 0.5 ? "#60a5fa" : "#F2C10A", life: 18, maxLife: 18, g: 0 });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({ x, y, vx: Math.random() * 9 - 4.5, vy: Math.random() * 9 - 4.5, r: Math.random() * 4.5 + 2, color, life: 34, maxLife: 34, g: 0.04 });
  }
}

function addPopup(text, x, y, color) {
  popups.push({ text, x, y, color, life: 70, maxLife: 70 });
}

/* -------------------------- Utilidades -------------------------- */
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRect(cx, cy, r, rect) {
  const tx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ty = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - tx;
  const dy = cy - ty;
  return dx * dx + dy * dy <= r * r;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function roundStroke(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

/* --------------------------- Pausa ------------------------------ */
function togglePause() {
  if (!running || won) return;
  paused = !paused;
  pauseBadge.classList.toggle("active", paused);
  statusEl.textContent = paused ? "Juego en pausa" : "Misión activa";
}

/* ------------------------- Controles ---------------------------- */
function bindHoldButton(id, key) {
  const btn = document.getElementById(id);
  const on = (e) => { e.preventDefault(); keys[key] = true; };
  const off = (e) => { e.preventDefault(); keys[key] = false; };
  btn.addEventListener("mousedown", on);
  btn.addEventListener("mouseup", off);
  btn.addEventListener("mouseleave", off);
  btn.addEventListener("touchstart", on, { passive: false });
  btn.addEventListener("touchend", off, { passive: false });
  btn.addEventListener("touchcancel", off, { passive: false });
}

document.getElementById("startBtn").addEventListener("click", resetGame);
document.getElementById("retryBtn").addEventListener("click", resetGame);
document.getElementById("playAgainBtn").addEventListener("click", resetGame);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = true;
  if (e.key === "ArrowUp" || e.code === "Space" || e.key.toLowerCase() === "w") {
    e.preventDefault();
    keys.up = true;
  }
  if (e.key.toLowerCase() === "p") togglePause();
  if (e.key.toLowerCase() === "m") toggleMute();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = false;
  if (e.key === "ArrowUp" || e.code === "Space" || e.key.toLowerCase() === "w") keys.up = false;
});

bindHoldButton("leftBtn", "left");
bindHoldButton("rightBtn", "right");
bindHoldButton("upBtn", "up");

/* --------------------------- Arranque --------------------------- */
initStars();
buildLevel();
updateHud("Listo");
draw();
