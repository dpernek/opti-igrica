const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const repValue = document.getElementById("repValue");
const missionValue = document.getElementById("missionValue");
const activeIssue = document.getElementById("activeIssue");
const eventOverlay = document.getElementById("eventOverlay");

const world = { width: 3200, height: 2200 };
const camera = { x: 0, y: 0 };

const player = {
  x: world.width / 2,
  y: world.height / 2,
  speed: 300,
  sprint: 420,
  radius: 20,
  colorA: "#31d7ff",
  colorB: "#0e8ca8",
};

const autobots = [
  { x: player.x - 60, y: player.y + 45, lag: 0.09, tone: "#ffae57" },
  { x: player.x + 75, y: player.y - 25, lag: 0.12, tone: "#7df279" },
];

const keys = new Set();

const issuePool = [
  "Kvar semafora blokira promet",
  "Građanin je zapeo u poplavljenoj zoni",
  "Nestanak struje u bloku nebodera",
  "Autobusna linija kasni zbog kaosa na cesti",
  "Pomoć starijima oko dostave lijekova",
  "Siguran prolaz za djecu iz škole",
];

function randomIssue() {
  return issuePool[Math.floor(Math.random() * issuePool.length)];
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function createCitizen() {
  return {
    x: rand(200, world.width - 200),
    y: rand(200, world.height - 200),
    radius: 14,
    issue: randomIssue(),
    solved: false,
    pulse: rand(0, Math.PI * 2),
  };
}

const citizens = Array.from({ length: 11 }, createCitizen);

const state = {
  reputation: 0,
  missions: 0,
  message: "JAN i Autoboti patroliraju gradom...",
  messageUntil: 0,
};

let lastTime = performance.now();

window.addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === "e") {
    attemptSolve();
  }
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function attemptSolve() {
  let closest = null;
  let bestDist = Infinity;

  for (const c of citizens) {
    if (c.solved) continue;
    const d = distance(player, c);
    if (d < bestDist) {
      bestDist = d;
      closest = c;
    }
  }

  if (!closest || bestDist > 90) {
    popMessage("Nema građanina dovoljno blizu. Priđi i pritisni E.", 2000);
    return;
  }

  closest.solved = true;
  state.reputation += 10;
  state.missions += 1;
  popMessage(`Riješeno: ${closest.issue}. Grad je sigurniji!`, 2600);

  setTimeout(() => {
    const idx = citizens.indexOf(closest);
    citizens[idx] = createCitizen();
  }, 1800);
}

function popMessage(message, duration = 1800) {
  state.message = message;
  state.messageUntil = performance.now() + duration;
}

function getMoveVector() {
  let x = 0;
  let y = 0;
  if (keys.has("w") || keys.has("arrowup")) y -= 1;
  if (keys.has("s") || keys.has("arrowdown")) y += 1;
  if (keys.has("a") || keys.has("arrowleft")) x -= 1;
  if (keys.has("d") || keys.has("arrowright")) x += 1;

  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len, moving: !!(x || y) };
}

function update(dt, now) {
  const move = getMoveVector();
  const speed = keys.has("shift") ? player.sprint : player.speed;

  player.x = clamp(player.x + move.x * speed * dt, 30, world.width - 30);
  player.y = clamp(player.y + move.y * speed * dt, 30, world.height - 30);

  autobots.forEach((bot, i) => {
    const anchorX = player.x + Math.cos(now / 400 + i * Math.PI) * 70;
    const anchorY = player.y + Math.sin(now / 460 + i * Math.PI * 0.7) * 55;
    bot.x += (anchorX - bot.x) * bot.lag;
    bot.y += (anchorY - bot.y) * bot.lag;
  });

  camera.x = clamp(player.x - canvas.width / 2, 0, world.width - canvas.width);
  camera.y = clamp(player.y - canvas.height / 2, 0, world.height - canvas.height);

  repValue.textContent = String(state.reputation);
  missionValue.textContent = String(state.missions);

  const nearest = getNearestUnsolved();
  activeIssue.textContent = nearest ? nearest.issue : "Svi problemi riješeni";

  if (now > state.messageUntil) {
    state.message = nearest
      ? `Najbliži građanin treba pomoć: ${nearest.issue}`
      : "Grad je miran. Patrola je uspješna.";
  }
  eventOverlay.textContent = state.message;
}

function getNearestUnsolved() {
  let closest = null;
  let best = Infinity;
  for (const c of citizens) {
    if (c.solved) continue;
    const d = distance(player, c);
    if (d < best) {
      best = d;
      closest = c;
    }
  }
  return closest;
}

function drawRoadGrid() {
  const roadStep = 260;
  ctx.lineWidth = 40;
  ctx.strokeStyle = "#1f2b38";

  for (let x = 120; x < world.width; x += roadStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.height);
    ctx.stroke();
  }

  for (let y = 80; y < world.height; y += roadStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#7f96aa66";
  ctx.lineWidth = 2;
  for (let x = 120; x < world.width; x += roadStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.height);
    ctx.stroke();
  }
  for (let y = 80; y < world.height; y += roadStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.width, y);
    ctx.stroke();
  }
}

function drawBuildings(now) {
  for (let i = 0; i < 95; i++) {
    const seedX = (i * 173) % (world.width - 220) + 40;
    const seedY = (i * 251) % (world.height - 200) + 30;
    const w = 50 + ((i * 13) % 80);
    const h = 45 + ((i * 17) % 75);

    if ((seedX + w / 2) % 260 < 65 || (seedY + h / 2) % 260 < 65) continue;

    const glow = 0.12 + ((Math.sin(now / 700 + i) + 1) * 0.09);

    ctx.fillStyle = `rgba(18, 30, 43, ${0.92 - glow})`;
    ctx.fillRect(seedX, seedY, w, h);

    ctx.strokeStyle = "#76a7d244";
    ctx.lineWidth = 1;
    ctx.strokeRect(seedX, seedY, w, h);

    ctx.fillStyle = `rgba(87, 198, 255, ${glow})`;
    for (let wy = seedY + 6; wy < seedY + h - 6; wy += 9) {
      ctx.fillRect(seedX + 5, wy, w - 10, 2);
    }
  }
}

function drawCitizens(now) {
  citizens.forEach((c) => {
    if (c.solved) return;

    const pulse = (Math.sin(now / 250 + c.pulse) + 1) * 0.5;
    const radius = c.radius + pulse * 3;

    ctx.fillStyle = "#ffd58f";
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ff4f4fcc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius + 8 + pulse * 8, 0, Math.PI * 2);
    ctx.stroke();

    if (distance(player, c) < 120) {
      ctx.font = "17px Rajdhani";
      const txtWidth = Math.min(280, ctx.measureText(c.issue).width + 18);
      ctx.fillStyle = "#06111fd1";
      ctx.fillRect(c.x - txtWidth / 2, c.y - 42, txtWidth, 24);
      ctx.fillStyle = "#f7fbff";
      ctx.fillText(c.issue, c.x - txtWidth / 2 + 8, c.y - 24);
    }
  });
}

function drawPlayer() {
  const g = ctx.createLinearGradient(player.x - 14, player.y - 14, player.x + 20, player.y + 16);
  g.addColorStop(0, player.colorA);
  g.addColorStop(1, player.colorB);

  ctx.shadowColor = "#36d5ff99";
  ctx.shadowBlur = 20;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#f4fbff";
  ctx.font = "700 15px Rajdhani";
  ctx.textAlign = "center";
  ctx.fillText("JAN", player.x, player.y - 26);
  ctx.textAlign = "left";
}

function drawAutobots() {
  autobots.forEach((bot, idx) => {
    ctx.fillStyle = bot.tone;
    ctx.shadowColor = `${bot.tone}aa`;
    ctx.shadowBlur = 16;
    ctx.fillRect(bot.x - 12, bot.y - 10, 24, 20);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#081018";
    ctx.fillRect(bot.x - 6, bot.y - 4, 12, 8);

    if (idx === 0) {
      ctx.fillStyle = "#ffe7c6";
      ctx.font = "12px Rajdhani";
      ctx.fillText("Autobot", bot.x - 18, bot.y - 15);
    }
  });
}

function drawMiniMap() {
  const miniW = 220;
  const miniH = 135;
  const padding = 14;

  const x = canvas.width - miniW - padding;
  const y = padding;

  ctx.fillStyle = "#03101cd2";
  ctx.fillRect(x, y, miniW, miniH);
  ctx.strokeStyle = "#5ca8e5aa";
  ctx.strokeRect(x, y, miniW, miniH);

  const sx = miniW / world.width;
  const sy = miniH / world.height;

  ctx.fillStyle = "#6ee0ff";
  ctx.fillRect(x + player.x * sx - 3, y + player.y * sy - 3, 6, 6);

  ctx.fillStyle = "#ff8f8f";
  citizens.forEach((c) => {
    if (c.solved) return;
    ctx.fillRect(x + c.x * sx - 2, y + c.y * sy - 2, 4, 4);
  });

  ctx.strokeStyle = "#a4d8ff55";
  ctx.strokeRect(x + camera.x * sx, y + camera.y * sy, canvas.width * sx, canvas.height * sy);
}

function render(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  const sky = ctx.createLinearGradient(0, 0, 0, world.height);
  sky.addColorStop(0, "#162331");
  sky.addColorStop(1, "#20364a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, world.width, world.height);

  drawRoadGrid();
  drawBuildings(now);
  drawCitizens(now);
  drawAutobots();
  drawPlayer();

  ctx.restore();
  drawMiniMap();
}

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt, now);
  render(now);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
