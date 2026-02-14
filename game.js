import * as THREE from "https://esm.sh/three@0.164.1";
import { GLTFLoader } from "https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader";
import { clone } from "https://esm.sh/three@0.164.1/examples/jsm/utils/SkeletonUtils";

const repValue = document.getElementById("repValue");
const missionValue = document.getElementById("missionValue");
const activeIssue = document.getElementById("activeIssue");
const eventOverlay = document.getElementById("eventOverlay");
const loaderEl = document.getElementById("loader");
const canvas = document.getElementById("gameCanvas");

window.__jan3dReady = true;

const WORLD_SIZE = 1800;
const ROAD_GAP = 180;
const ROAD_WIDTH = 46;
const keys = new Set();
const clock = new THREE.Clock();

const state = {
  reputation: 0,
  missions: 0,
  message: "Priprema 3D grada i vozila...",
  messageUntil: 0,
};

const issues = [
  "Kvar semafora na glavnoj aveniji",
  "Pokvaren gradski autobus na križanju",
  "Nestanak rasvjete u stambenom bloku",
  "Hitna dostava lijekova građaninu",
  "Siguran koridor za djecu iz škole",
  "Kritična gužva kod bolnice",
];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#87a9c8");
scene.fog = new THREE.Fog("#9db6cd", 280, 1500);

const camera = new THREE.PerspectiveCamera(64, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
camera.position.set(0, 18, -28);

const hemi = new THREE.HemisphereLight("#d8eeff", "#4e6d87", 0.72);
scene.add(hemi);

const sun = new THREE.DirectionalLight("#ffe9bd", 1.3);
sun.position.set(-140, 220, 110);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -300;
sun.shadow.camera.right = 300;
sun.shadow.camera.top = 300;
sun.shadow.camera.bottom = -300;
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 800;
scene.add(sun);

const ambientBounce = new THREE.PointLight("#8bc7ff", 0.5, 600, 2);
ambientBounce.position.set(0, 55, 0);
scene.add(ambientBounce);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
  new THREE.MeshStandardMaterial({ color: "#7f9a6e", roughness: 0.92, metalness: 0.03 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function createRoad(x, z, w, d) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(w, 1, d),
    new THREE.MeshStandardMaterial({ color: "#2b3138", roughness: 0.85, metalness: 0.08 })
  );
  road.position.set(x, 0.5, z);
  road.receiveShadow = true;
  scene.add(road);

  const lane = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.98, 0.05, 1.8),
    new THREE.MeshStandardMaterial({ color: "#d8dfad", roughness: 0.2, metalness: 0.05 })
  );
  lane.position.set(x, 1.05, z);
  scene.add(lane);
}

function createCity() {
  const span = WORLD_SIZE - 40;
  for (let i = -4; i <= 4; i += 1) {
    const p = i * ROAD_GAP;
    createRoad(0, p, span, ROAD_WIDTH);
    createRoad(p, 0, ROAD_WIDTH, span);
  }

  const buildingMat = new THREE.MeshStandardMaterial({ color: "#6f7f90", roughness: 0.78, metalness: 0.2 });
  const windowMat = new THREE.MeshStandardMaterial({ color: "#abd9ff", emissive: "#4ca3e0", emissiveIntensity: 0.35 });

  for (let gx = -4; gx <= 4; gx += 1) {
    for (let gz = -4; gz <= 4; gz += 1) {
      if (gx === 0 || gz === 0) continue;
      const x = gx * ROAD_GAP + (Math.random() - 0.5) * 30;
      const z = gz * ROAD_GAP + (Math.random() - 0.5) * 30;
      const w = 40 + Math.random() * 45;
      const d = 40 + Math.random() * 45;
      const h = 50 + Math.random() * 220;

      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat.clone());
      body.material.color.offsetHSL((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.1);
      body.position.set(x, h / 2 + 1, z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      const lightBand = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 3.5, d * 0.85), windowMat.clone());
      lightBand.position.set(0, h * (0.35 + Math.random() * 0.2), 0);
      body.add(lightBand);
    }
  }

  const treeMat = new THREE.MeshStandardMaterial({ color: "#4f7e40", roughness: 0.9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: "#5f4833", roughness: 0.95 });

  for (let i = 0; i < 120; i += 1) {
    const x = (Math.random() - 0.5) * (WORLD_SIZE - 120);
    const z = (Math.random() - 0.5) * (WORLD_SIZE - 120);
    if (Math.abs((x % ROAD_GAP)) < ROAD_WIDTH || Math.abs((z % ROAD_GAP)) < ROAD_WIDTH) continue;

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 8, 8), trunkMat);
    trunk.position.set(x, 4, z);
    trunk.castShadow = true;
    scene.add(trunk);

    const crown = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 2, 12, 12), treeMat);
    crown.position.set(x, 10, z);
    crown.castShadow = true;
    scene.add(crown);
  }
}

createCity();

function buildFallbackCar() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 1.6, 11),
    new THREE.MeshStandardMaterial({ color: "#1f90e5", roughness: 0.35, metalness: 0.72 })
  );
  body.position.y = 2.4;
  body.castShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4.3, 1.4, 5.2),
    new THREE.MeshStandardMaterial({ color: "#d4e7f4", roughness: 0.15, metalness: 0.35 })
  );
  roof.position.set(0, 3.5, -0.5);
  roof.castShadow = true;
  group.add(roof);

  const wheelGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.8, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#1f2228", roughness: 0.9, metalness: 0.1 });
  [[-2.5, 1.1, -3.8], [2.5, 1.1, -3.8], [-2.5, 1.1, 3.8], [2.5, 1.1, 3.8]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
  });

  return group;
}

const vehicle = {
  root: new THREE.Group(),
  speed: 0,
  heading: 0,
  maxForward: 105,
  maxReverse: -40,
  acceleration: 58,
  brake: 95,
  drag: 28,
  steerRate: 1.85,
};
vehicle.root.position.set(0, 0, 0);
scene.add(vehicle.root);

const fallbackCar = buildFallbackCar();
vehicle.root.add(fallbackCar);

const janTag = makeSpriteLabel("JAN");
janTag.position.set(0, 8, 0);
vehicle.root.add(janTag);

const autobots = [makeAutobot("#f59e48"), makeAutobot("#7ce88d")];
autobots.forEach((bot) => scene.add(bot));

const traffic = [];
function makeTraffic() {
  for (let i = 0; i < 42; i += 1) {
    const car = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.5, 9.2),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL((i * 0.11) % 1, 0.72, 0.53),
        roughness: 0.4,
        metalness: 0.4,
      })
    );
    car.castShadow = true;
    car.receiveShadow = true;

    const lane = (-4 + (i % 9)) * ROAD_GAP;
    const horizontal = i % 2 === 0;

    if (horizontal) {
      car.position.set(-WORLD_SIZE / 2 + (i * 57) % WORLD_SIZE, 1.1, lane);
      car.rotation.y = Math.PI / 2;
    } else {
      car.position.set(lane, 1.1, -WORLD_SIZE / 2 + (i * 83) % WORLD_SIZE);
      car.rotation.y = 0;
    }

    scene.add(car);
    traffic.push({ mesh: car, horizontal, speed: 26 + (i % 7) * 4, dir: i % 3 === 0 ? -1 : 1 });
  }
}
makeTraffic();

function makeAutobot(color) {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 6.8, 2.8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.85 })
  );
  body.position.y = 3.8;
  body.castShadow = true;
  g.add(body);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.1, 2.95),
    new THREE.MeshStandardMaterial({ color: "#162f48", emissive: "#2d9af0", emissiveIntensity: 0.6 })
  );
  visor.position.set(0, 4.6, 0);
  g.add(visor);

  return g;
}

function makeSpriteLabel(text) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 80;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#07233a";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#5ec9ff";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, c.width - 4, c.height - 4);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 44px Rajdhani";
  ctx.fillText(text, c.width / 2, c.height / 2);

  const tex = new THREE.CanvasTexture(c);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  spr.scale.set(14, 4.2, 1);
  return spr;
}

function modelLoader(url, timeoutMs = 4500) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error(`Model timeout: ${url}`));
    }, timeoutMs);

    loader.load(
      url,
      (gltf) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(gltf);
      },
      undefined,
      (err) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        reject(err);
      }
    );
  });
}

const citizens = [];
let citizenTemplate = null;
let autobotTemplate = null;

function randomIssue() {
  return issues[Math.floor(Math.random() * issues.length)];
}

function randomStreetPoint() {
  const lane = (-4 + Math.floor(Math.random() * 9)) * ROAD_GAP;
  const along = -WORLD_SIZE / 2 + Math.random() * WORLD_SIZE;
  if (Math.random() > 0.5) {
    return new THREE.Vector3(lane + (Math.random() - 0.5) * 14, 0, along);
  }
  return new THREE.Vector3(along, 0, lane + (Math.random() - 0.5) * 14);
}

function buildFallbackCitizen() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.1, 2.8, 8, 14),
    new THREE.MeshStandardMaterial({ color: "#f2d0ae", roughness: 0.58 })
  );
  body.position.y = 2.8;
  body.castShadow = true;
  g.add(body);
  return g;
}

function spawnCitizen() {
  const root = citizenTemplate ? clone(citizenTemplate) : buildFallbackCitizen();
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(4.6, 0.45, 12, 40),
    new THREE.MeshBasicMaterial({ color: "#f45454", transparent: true, opacity: 0.9 })
  );
  marker.rotation.x = Math.PI / 2;
  marker.position.y = 0.7;
  root.add(marker);

  const p = randomStreetPoint();
  root.position.copy(p);
  scene.add(root);

  citizens.push({ root, marker, issue: randomIssue(), solved: false, pulse: Math.random() * Math.PI * 2 });
}

function message(text, duration = 2400) {
  state.message = text;
  state.messageUntil = performance.now() + duration;
}

function getNearestCitizen() {
  let nearest = null;
  let dist = Infinity;
  for (const c of citizens) {
    if (c.solved) continue;
    const d = c.root.position.distanceTo(vehicle.root.position);
    if (d < dist) {
      dist = d;
      nearest = c;
    }
  }
  return { nearest, dist };
}

function solveCitizenIssue() {
  const { nearest, dist } = getNearestCitizen();
  if (!nearest || dist > 12) {
    message("Priđi građaninu autom i pritisni E.", 1700);
    return;
  }

  nearest.solved = true;
  nearest.root.visible = false;
  state.reputation += 12;
  state.missions += 1;
  message(`Riješeno: ${nearest.issue}`, 2300);

  setTimeout(() => {
    nearest.root.position.copy(randomStreetPoint());
    nearest.issue = randomIssue();
    nearest.solved = false;
    nearest.root.visible = true;
  }, 2200);
}

function updateTraffic(dt) {
  for (const car of traffic) {
    const delta = car.speed * dt * car.dir;
    if (car.horizontal) {
      car.mesh.position.x += delta;
      if (car.mesh.position.x > WORLD_SIZE / 2) car.mesh.position.x = -WORLD_SIZE / 2;
      if (car.mesh.position.x < -WORLD_SIZE / 2) car.mesh.position.x = WORLD_SIZE / 2;
      car.mesh.rotation.y = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      car.mesh.position.z += delta;
      if (car.mesh.position.z > WORLD_SIZE / 2) car.mesh.position.z = -WORLD_SIZE / 2;
      if (car.mesh.position.z < -WORLD_SIZE / 2) car.mesh.position.z = WORLD_SIZE / 2;
      car.mesh.rotation.y = car.dir > 0 ? 0 : Math.PI;
    }
  }
}

function updateVehicle(dt) {
  const throttle = Number(keys.has("w") || keys.has("arrowup"));
  const brake = Number(keys.has("s") || keys.has("arrowdown"));
  const steerLeft = Number(keys.has("a") || keys.has("arrowleft"));
  const steerRight = Number(keys.has("d") || keys.has("arrowright"));
  const handbrake = keys.has(" ");

  if (throttle) vehicle.speed += vehicle.acceleration * dt;
  if (brake) vehicle.speed -= vehicle.brake * dt;

  if (!throttle && !brake) {
    if (vehicle.speed > 0) vehicle.speed = Math.max(0, vehicle.speed - vehicle.drag * dt);
    if (vehicle.speed < 0) vehicle.speed = Math.min(0, vehicle.speed + vehicle.drag * dt);
  }

  if (handbrake) {
    vehicle.speed *= 0.94;
  }

  vehicle.speed = THREE.MathUtils.clamp(vehicle.speed, vehicle.maxReverse, vehicle.maxForward);

  const steerInput = steerRight - steerLeft;
  if (steerInput !== 0) {
    const steerPower = (0.25 + Math.min(Math.abs(vehicle.speed) / vehicle.maxForward, 1) * 0.75) * vehicle.steerRate;
    vehicle.heading -= steerInput * steerPower * dt * Math.sign(vehicle.speed || 1);
  }

  vehicle.root.rotation.y = vehicle.heading;

  const dir = new THREE.Vector3(Math.sin(vehicle.heading), 0, Math.cos(vehicle.heading));
  vehicle.root.position.addScaledVector(dir, vehicle.speed * dt);

  vehicle.root.position.x = THREE.MathUtils.clamp(vehicle.root.position.x, -WORLD_SIZE / 2 + 20, WORLD_SIZE / 2 - 20);
  vehicle.root.position.z = THREE.MathUtils.clamp(vehicle.root.position.z, -WORLD_SIZE / 2 + 20, WORLD_SIZE / 2 - 20);
}

function updateBots(time) {
  const anchor = vehicle.root.position;
  autobots.forEach((bot, i) => {
    const phase = i === 0 ? 0 : Math.PI;
    const radius = 10;
    const offset = new THREE.Vector3(
      Math.cos(time * 0.002 + phase) * radius,
      0,
      Math.sin(time * 0.002 + phase) * radius
    );
    const target = anchor.clone().add(offset);
    target.y = 0;
    bot.position.lerp(target, 0.08);
    bot.lookAt(anchor.x, 2.4, anchor.z);
  });
}

const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

function updateCamera() {
  const heading = vehicle.heading;
  const back = new THREE.Vector3(-Math.sin(heading), 0, -Math.cos(heading));
  const up = new THREE.Vector3(0, 13, 0);

  camTarget.copy(vehicle.root.position).add(new THREE.Vector3(0, 4, 0));
  camPos.copy(vehicle.root.position).add(back.multiplyScalar(24)).add(up);

  camera.position.lerp(camPos, 0.12);
  camera.lookAt(camTarget);
}

function updateCitizens(time) {
  for (const c of citizens) {
    if (c.solved) continue;
    const pulse = (Math.sin(time * 0.005 + c.pulse) + 1) * 0.5;
    c.marker.scale.setScalar(0.9 + pulse * 0.5);
    c.marker.material.opacity = 0.45 + pulse * 0.5;
  }
}

function updateUI(time) {
  repValue.textContent = String(state.reputation);
  missionValue.textContent = String(state.missions);

  const { nearest } = getNearestCitizen();
  activeIssue.textContent = nearest ? nearest.issue : "Nema aktivnih problema";

  if (time > state.messageUntil) {
    state.message = nearest
      ? `Vozi do građanina: ${nearest.issue}`
      : "Grad je siguran. Nastavi patrolu.";
  }

  eventOverlay.textContent = `${state.message} | Brzina: ${Math.max(0, Math.round(vehicle.speed))} km/h`;
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  keys.add(key);
  if (key === "e") solveCitizenIssue();
});

window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

window.addEventListener("resize", () => {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
});

let started = false;
function startGame() {
  if (started) return;
  started = true;
  loaderEl.classList.add("hidden");
  message("JAN ulazi u 3D patrolnu vožnju. Rješavaj gradske probleme!", 2600);
  requestAnimationFrame(loop);
}

function loop() {
  const dt = Math.min(0.033, clock.getDelta());
  const time = performance.now();

  updateVehicle(dt);
  updateTraffic(dt);
  updateBots(time);
  updateCitizens(time);
  updateCamera();
  updateUI(time);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

async function loadModels() {
  const [carRes, citizenRes, autobotRes] = await Promise.allSettled([
    modelLoader("https://threejs.org/examples/models/gltf/ferrari.glb"),
    modelLoader("https://threejs.org/examples/models/gltf/Soldier.glb"),
    modelLoader("https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb"),
  ]);

  if (carRes.status === "fulfilled") {
    fallbackCar.visible = false;
    const car = carRes.value.scene;
    car.scale.set(0.028, 0.028, 0.028);
    car.rotation.y = Math.PI;
    car.position.y = 0.9;
    car.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    vehicle.root.add(car);
  } else {
    message("3D model auta nije učitan, koristi se fallback vozilo.", 2200);
  }

  if (citizenRes.status === "fulfilled") {
    citizenTemplate = citizenRes.value.scene;
    citizenTemplate.scale.setScalar(2.2);
  }

  if (autobotRes.status === "fulfilled") {
    autobotTemplate = autobotRes.value.scene;
    autobots.forEach((bot, i) => {
      bot.children.length = 0;
      const m = clone(autobotTemplate);
      m.scale.setScalar(1.7);
      m.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          obj.material = obj.material.clone();
          if (obj.material.color) {
            const hsl = { h: 0, s: 0, l: 0 };
            obj.material.color.getHSL(hsl);
            obj.material.color.setHSL((hsl.h + (i === 0 ? 0.06 : 0.24)) % 1, Math.min(1, hsl.s * 1.1), hsl.l);
          }
        }
      });
      bot.add(m);
    });
  }
}

async function init() {
  try {
    await loadModels();
  } catch (_err) {
    message("Dio modela nije dostupan, igra radi s fallback prikazom.", 2400);
  }

  for (let i = 0; i < 12; i += 1) {
    spawnCitizen();
  }

  startGame();
}

setTimeout(() => {
  if (started) return;
  message("Modeli kasne. Pokrećem odmah vožnju s fallback prikazom.", 2600);
  for (let i = citizens.length; i < 10; i += 1) spawnCitizen();
  startGame();
}, 7000);

init();
