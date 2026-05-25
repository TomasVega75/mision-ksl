const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const deathScreen = document.getElementById("deathScreen");
const winScreen = document.getElementById("winScreen");

const coinsEl = document.getElementById("coins");
const livesEl = document.getElementById("lives");
const statusEl = document.getElementById("status");
const deathCoinsEl = document.getElementById("deathCoins");
const winCoinsEl = document.getElementById("winCoins");
const loginLink = document.getElementById("loginLink");

// Cambia esta URL cuando tengas la página real de loggeo.
const paginaDeLoggeo = "https://ejemplo.com/login";
loginLink.href = paginaDeLoggeo;

const logo = new Image();
logo.src = "assets/logo-ksl.png";

const keys = { left: false, right: false, up: false };

let running = false;
let won = false;
let cameraX = 0;
let animationId = null;
let coins = 0;
let lives = 5;
let lastHit = 0;
let lastPortalWarning = 0;

const levelWidth = 8400;
const gravity = 0.36;
const thrust = -0.66;

const maxCoins = 30;

const ship = {
  x: 100,
  y: 280,
  w: 96,
  h: 54,
  vx: 0,
  vy: 0,
  maxSpeed: 7.2
};

const portal = { x: 8180, y: 320, w: 120, h: 230 };

let platforms = [];
let boxes = [];
let enemies = [];
let coinsMap = [];
let particles = [];
let stars = [];

function buildLevel() {
  platforms = [
    {x:0,y:610,w:780,h:90}, {x:980,y:610,w:640,h:90}, {x:1840,y:610,w:720,h:90},
    {x:2800,y:610,w:620,h:90}, {x:3650,y:610,w:700,h:90}, {x:4650,y:610,w:760,h:90},
    {x:5650,y:610,w:680,h:90}, {x:6600,y:610,w:620,h:90}, {x:7480,y:610,w:920,h:90},

    {x:520,y:470,w:220,h:32}, {x:1180,y:420,w:210,h:32}, {x:1980,y:465,w:250,h:32},
    {x:2980,y:410,w:220,h:32}, {x:3850,y:455,w:240,h:32}, {x:4900,y:420,w:260,h:32},
    {x:5900,y:455,w:250,h:32}, {x:6820,y:405,w:230,h:32}, {x:7680,y:455,w:280,h:32}
  ];

  boxes = [
    {x:620,y:400,w:60,h:60,type:"normal",hit:false},
    {x:1240,y:350,w:60,h:60,type:"special",hit:false},
    {x:2070,y:395,w:60,h:60,type:"normal",hit:false},
    {x:3040,y:340,w:60,h:60,type:"special",hit:false},
    {x:3930,y:385,w:60,h:60,type:"normal",hit:false},
    {x:5010,y:350,w:60,h:60,type:"special",hit:false},
    {x:6000,y:385,w:60,h:60,type:"normal",hit:false},
    {x:6900,y:335,w:60,h:60,type:"special",hit:false},
    {x:7780,y:385,w:60,h:60,type:"final",hit:false}
  ];

  enemies = [
    {x:1080,y:548,w:58,h:46,min:990,max:1540,vx:2.1},
    {x:1900,y:548,w:58,h:46,min:1840,max:2480,vx:2.4},
    {x:3700,y:548,w:58,h:46,min:3650,max:4300,vx:2.5},
    {x:4700,y:548,w:58,h:46,min:4650,max:5350,vx:2.7},
    {x:5700,y:548,w:58,h:46,min:5650,max:6260,vx:2.8},
    {x:7520,y:548,w:58,h:46,min:7480,max:8280,vx:3.0}
  ];

  coinsMap = [];
  for (let x = 340; x < levelWidth - 360; x += 145) {
    const wave = Math.sin(x / 310) * 88;
    const y = 300 + wave;
    coinsMap.push({x, y, taken:false});
  }
}

function initStars() {
  stars = [];
  for (let i = 0; i < 230; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + .35,
      speed: Math.random() * .75 + .15,
      alpha: Math.random() * .65 + .25
    });
  }
}

function resetGame() {
  running = true;
  won = false;
  coins = 0;
  lives = 5;
  cameraX = 0;
  lastHit = 0;
  lastPortalWarning = 0;
  particles = [];

  ship.x = 100;
  ship.y = 280;
  ship.vx = 0;
  ship.vy = 0;

  buildLevel();

  coinsEl.textContent = `${coins}/${maxCoins}`;
  livesEl.textContent = lives;
  statusEl.textContent = "Misión activa";

  startScreen.classList.remove("active");
  deathScreen.classList.remove("active");
  winScreen.classList.remove("active");

  cancelAnimationFrame(animationId);
  loop();
}

function loop() {
  update();
  draw();
  if (running) animationId = requestAnimationFrame(loop);
}

function update() {
  if (keys.left) ship.vx -= 0.42;
  if (keys.right) ship.vx += 0.42;
  if (keys.up) {
    ship.vy += thrust;
    makeFire(ship.x, ship.y + ship.h / 2);
  }

  ship.vy += gravity;
  ship.vx *= 0.965;
  ship.vy *= 0.985;

  ship.vx = clamp(ship.vx, -ship.maxSpeed, ship.maxSpeed);
  ship.vy = clamp(ship.vy, -10.2, 10.2);

  ship.x += ship.vx;
  ship.y += ship.vy;
  ship.x = clamp(ship.x, 0, levelWidth - ship.w);

  if (ship.y < 18) {
    ship.y = 18;
    ship.vy = 0;
  }

  if (ship.y > canvas.height + 80) {
    takeDamage("Caíste al vacío espacial", true);
  }

  for (const p of platforms) {
    if (overlap(ship, p)) {
      const topCollision = ship.y + ship.h - ship.vy <= p.y + 12;
      if (topCollision && ship.vy >= 0) {
        ship.y = p.y - ship.h;
        ship.vy = -0.8;
      } else {
        takeDamage("Choque con asteroide/plataforma");
      }
    }
  }

  for (const box of boxes) {
    if (!box.hit && overlap(ship, box)) {
      box.hit = true;
      const amount = box.type === "special" ? 8 : box.type === "final" ? 12 : 3;
      coins += amount;
      coinsEl.textContent = `${coins}/${maxCoins}`;
      statusEl.textContent = box.type === "special" ? "Caja especial KSL +8" : box.type === "final" ? "Caja premium KSL +12" : "Caja KSL +3";
      ship.vy = -7.8;
      spawnBoxCoins(box.x + box.w / 2, box.y, amount);
      burst(box.x + box.w / 2, box.y + box.h / 2, box.type === "normal" ? "#0D2E8B" : "#F2C10A", 18);
    }
  }

  for (const c of coinsMap) {
    if (!c.taken && circleRect(c.x, c.y, 18, ship)) {
      c.taken = true;
      coins += 1;
      coinsEl.textContent = `${coins}/${maxCoins}`;
      statusEl.textContent = "+1 moneda KSL";
      burst(c.x, c.y, "#F2C10A", 10);
    }
  }

  for (const e of enemies) {
    e.x += e.vx;
    if (e.x < e.min || e.x > e.max) e.vx *= -1;
    if (overlap(ship, e)) takeDamage("Impacto con dron enemigo");
  }

  if (overlap(ship, portal)) {
    if (coins >= maxCoins) {
      win();
    } else {
      needMoreCoins();
    }
  }

  cameraX = clamp(ship.x - canvas.width * 0.30, 0, levelWidth - canvas.width);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g || 0;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
}

function takeDamage(reason, fall = false) {
  const now = Date.now();
  if (now - lastHit < 1050) return;
  lastHit = now;

  lives--;
  livesEl.textContent = lives;
  statusEl.textContent = reason;
  burst(ship.x + ship.w/2, ship.y + ship.h/2, "#E01818", 28);

  ship.vx = -ship.vx * .6;
  ship.vy = -7.6;

  if (fall) {
    ship.x = Math.max(90, ship.x - 380);
    ship.y = 240;
    ship.vx = 0;
    ship.vy = 0;
  }

  if (lives <= 0) {
    die();
  }
}

function die() {
  running = false;
  cancelAnimationFrame(animationId);
  deathCoinsEl.textContent = coins;
  deathScreen.classList.add("active");
}

function needMoreCoins() {
  const now = Date.now();
  if (now - lastPortalWarning < 1300) return;
  lastPortalWarning = now;

  statusEl.textContent = `Necesitas ${maxCoins} monedas para reclamar el premio`;
  burst(ship.x + ship.w / 2, ship.y + ship.h / 2, "#F2C10A", 18);

  // Empuja suavemente la nave hacia atrás para que el jugador siga recolectando.
  ship.x = Math.max(0, ship.x - 140);
  ship.vx = -5;
  ship.vy = -4;
}

function win() {
  if (won) return;
  won = true;
  running = false;
  cancelAnimationFrame(animationId);
  winCoinsEl.textContent = coins;
  statusEl.textContent = "Premio desbloqueado";
  winScreen.classList.add("active");

  // El jugador decide si reclamar el premio o jugar de nuevo.
  // No se redirige automáticamente.
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpace();

  ctx.save();
  ctx.translate(-cameraX, 0);
  drawNebulas();
  drawPlanets();
  drawPlatforms();
  drawBoxes();
  drawCoins();
  drawEnemies();
  drawPortal();
  drawParticles();
  drawShip();
  ctx.restore();

  drawDistanceBar();
}

function drawSpace() {
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#00020a");
  bg.addColorStop(.5, "#050816");
  bg.addColorStop(1, "#020617");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const s of stars) {
    s.x -= s.speed;
    if (s.x < -5) {
      s.x = canvas.width + 5;
      s.y = Math.random() * canvas.height;
    }
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawNebulas() {
  const nebulas = [
    {x:520,y:150,r:260,c:"rgba(13,46,139,.28)"},
    {x:1820,y:230,r:280,c:"rgba(10,143,67,.20)"},
    {x:3180,y:130,r:260,c:"rgba(242,193,10,.16)"},
    {x:4650,y:190,r:300,c:"rgba(224,24,24,.16)"},
    {x:6150,y:150,r:320,c:"rgba(13,46,139,.25)"},
    {x:7600,y:220,r:280,c:"rgba(10,143,67,.18)"}
  ];

  for (const n of nebulas) {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, n.c);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlanets() {
  drawPlanet(900, 150, 70, "#0D2E8B", "#60a5fa");
  drawPlanet(2700, 120, 52, "#0A8F43", "#86efac");
  drawPlanet(5200, 150, 82, "#E01818", "#fb7185");
  drawPlanet(7200, 110, 56, "#F2C10A", "#fde68a");
}

function drawPlanet(x, y, r, color, ring) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ring;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.45, r * .35, -0.35, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlatforms() {
  for (const p of platforms) {
    ctx.fillStyle = "#1f2937";
    roundRect(p.x, p.y, p.w, p.h, 18);
    ctx.fillStyle = "#D9D9D9";
    ctx.fillRect(p.x, p.y, p.w, 11);
    ctx.fillStyle = "rgba(255,255,255,.13)";
    for (let x = p.x + 24; x < p.x + p.w - 24; x += 62) {
      ctx.fillRect(x, p.y + 28, 36, 10);
    }
  }
}

function drawBoxes() {
  for (const b of boxes) {
    ctx.save();
    if (b.hit) ctx.globalAlpha = .28;

    ctx.fillStyle = b.type === "normal" ? "#0D2E8B" : b.type === "special" ? "#F2C10A" : "#0A8F43";
    roundRect(b.x, b.y, b.w, b.h, 12);

    ctx.strokeStyle = "rgba(255,255,255,.82)";
    ctx.lineWidth = 4;
    ctx.strokeRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);

    ctx.fillStyle = b.type === "special" ? "#111827" : "#ffffff";
    ctx.font = "900 23px Arial";
    ctx.fillText("KSL", b.x + 8, b.y + 38);
    ctx.restore();
  }
}

function drawCoins() {
  for (const c of coinsMap) {
    if (c.taken) continue;
    ctx.fillStyle = "#F2C10A";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 17, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff3b0";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#0A8F43";
    ctx.font = "900 13px Arial";
    ctx.fillText("K", c.x - 4, c.y + 5);
  }
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.fillStyle = "#E01818";
    roundRect(e.x, e.y, e.w, e.h, 14);

    ctx.fillStyle = "#111827";
    ctx.fillRect(e.x + 9, e.y + 12, e.w - 18, 13);

    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.arc(e.x + 18, e.y + 18, 4.5, 0, Math.PI * 2);
    ctx.arc(e.x + 40, e.y + 18, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#D9D9D9";
    ctx.fillRect(e.x + 24, e.y + 40, 10, 16);
  }
}

function drawPortal() {
  const cx = portal.x + portal.w / 2;
  const cy = portal.y + portal.h / 2;

  const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, 155);
  g.addColorStop(0, "rgba(242,193,10,.95)");
  g.addColorStop(.45, "rgba(10,143,67,.65)");
  g.addColorStop(1, "rgba(13,46,139,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 155, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#F2C10A";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 52, 112, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#0A8F43";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 72, 136, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "900 28px Arial";
  ctx.fillText("PREMIO", portal.x - 10, portal.y - 42);
  ctx.font = "900 18px Arial";
  ctx.fillStyle = "#F2C10A";
  ctx.fillText("30 MONEDAS", portal.x - 18, portal.y - 16);
}

function drawShip() {
  const x = ship.x;
  const y = ship.y;

  if (keys.up || Math.abs(ship.vx) > 1.5) {
    ctx.fillStyle = "rgba(96,165,250,.85)";
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 27);
    ctx.lineTo(x - 54 - Math.random()*18, y + 11);
    ctx.lineTo(x - 54 - Math.random()*18, y + 43);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(242,193,10,.8)";
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 27);
    ctx.lineTo(x - 34 - Math.random()*12, y + 19);
    ctx.lineTo(x - 34 - Math.random()*12, y + 35);
    ctx.closePath();
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(x + 48, y + 27, 5, x + 48, y + 27, 86);
  glow.addColorStop(0, "rgba(13,46,139,.42)");
  glow.addColorStop(1, "rgba(13,46,139,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + 48, y + 27, 86, 0, Math.PI * 2);
  ctx.fill();

  // Body inspired by the user's spaceship concept, not a pixel copy.
  ctx.fillStyle = "#D9D9D9";
  ctx.beginPath();
  ctx.moveTo(x + 96, y + 27);
  ctx.lineTo(x + 58, y + 3);
  ctx.lineTo(x + 16, y + 9);
  ctx.lineTo(x - 12, y + 27);
  ctx.lineTo(x + 16, y + 45);
  ctx.lineTo(x + 58, y + 51);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Yellow nose
  ctx.fillStyle = "#F2C10A";
  ctx.beginPath();
  ctx.moveTo(x + 96, y + 27);
  ctx.lineTo(x + 58, y + 10);
  ctx.lineTo(x + 64, y + 44);
  ctx.closePath();
  ctx.fill();

  // Top blue wing
  ctx.fillStyle = "#0D2E8B";
  ctx.beginPath();
  ctx.moveTo(x + 36, y + 6);
  ctx.lineTo(x + 2, y - 18);
  ctx.lineTo(x + 20, y + 18);
  ctx.closePath();
  ctx.fill();

  // Bottom red wing
  ctx.fillStyle = "#E01818";
  ctx.beginPath();
  ctx.moveTo(x + 36, y + 48);
  ctx.lineTo(x + 2, y + 72);
  ctx.lineTo(x + 20, y + 36);
  ctx.closePath();
  ctx.fill();

  // Green stripe
  ctx.strokeStyle = "#0A8F43";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 38);
  ctx.bezierCurveTo(x + 40, y + 8, x + 62, y + 12, x + 76, y + 28);
  ctx.stroke();

  // Cockpit
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.ellipse(x + 62, y + 26, 17, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#38bdf8";
  ctx.globalAlpha = .75;
  ctx.beginPath();
  ctx.ellipse(x + 66, y + 23, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#0A8F43";
  ctx.font = "900 13px Arial";
  ctx.fillText("KSL", x + 25, y + 32);
}

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

function drawDistanceBar() {
  const margin = 26;
  const w = canvas.width - margin * 2;
  const h = 8;
  const progress = clamp(ship.x / (levelWidth - ship.w), 0, 1);

  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.fillRect(margin, 24, w, h);

  const grad = ctx.createLinearGradient(margin, 0, margin + w, 0);
  grad.addColorStop(0, "#0D2E8B");
  grad.addColorStop(.5, "#0A8F43");
  grad.addColorStop(1, "#F2C10A");
  ctx.fillStyle = grad;
  ctx.fillRect(margin, 24, w * progress, h);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 16px Arial";
  ctx.fillText("META", margin + w - 48, 20);
}

function spawnBoxCoins(x, y, amount) {
  for (let i = 0; i < amount * 4; i++) {
    particles.push({
      x, y,
      vx: Math.random() * 6 - 3,
      vy: Math.random() * -6 - 1.5,
      r: Math.random() * 4 + 2,
      color: Math.random() > .25 ? "#F2C10A" : "#ffffff",
      life: 46,
      maxLife: 46,
      g: .16
    });
  }
}

function makeFire(x, y) {
  particles.push({
    x, y,
    vx: Math.random() * -5 - 1,
    vy: Math.random() * 3 - 1.5,
    r: Math.random() * 4 + 2,
    color: Math.random() > .5 ? "#60a5fa" : "#F2C10A",
    life: 18,
    maxLife: 18,
    g: 0
  });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: Math.random() * 9 - 4.5,
      vy: Math.random() * 9 - 4.5,
      r: Math.random() * 4.5 + 2,
      color,
      life: 34,
      maxLife: 34,
      g: .04
    });
  }
}

function overlap(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
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

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

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
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = false;
  if (e.key === "ArrowUp" || e.code === "Space" || e.key.toLowerCase() === "w") keys.up = false;
});

bindHoldButton("leftBtn", "left");
bindHoldButton("rightBtn", "right");
bindHoldButton("upBtn", "up");

initStars();
buildLevel();
draw();
