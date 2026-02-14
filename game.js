import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

const repValue = document.getElementById("repValue");
const missionValue = document.getElementById("missionValue");
const activeIssue = document.getElementById("activeIssue");
const eventOverlay = document.getElementById("eventOverlay");
const loaderEl = document.getElementById("loader");
const canvas = document.getElementById("gameCanvas");

const WORLD_SIZE = 1400;
const ROAD_WIDTH = 42;
const BLOCK_SIZE = 140;

const keys = new Set();
const clock = new THREE.Clock();

const state = {
  reputation: 0,
  missions: 0,
  message: "Učitavanje 3D grada...",
  messageUntil: 0,
};

const issuePool = [
  "Kvar semafora blokira promet",
  "Građanin je zapeo u poplavljenom pothodniku",
  "Nestanak struje u neboderu",
  "Kvar autobusa za noćnu liniju",
  "Dostava lijekova starijima kasni",
  "Siguran prolaz djece nakon škole",
  "Opasan kvar rasvjete na križanju",
];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#070d14");
scene.fog = new THREE.FogExp2("#0a1420", 0.0017);

const camera = new THREE.PerspectiveCamera(62, canvas.clientWidth / canvas.clientHeight, 0.1, 6000);
camera.position.set(0, 55, 90);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.minDistance = 22;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI * 0.46;
controls.target.set(0, 12, 0);

const hemi = new THREE.HemisphereLight("#7dc6ff", "#0e1f32", 0.7);
scene.add(hemi);

const sun = new THREE.DirectionalLight("#ffd8a8", 1.4);
sun.position.set(-90, 160, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 600;
sun.shadow.camera.left = -260;
sun.shadow.camera.right = 260;
sun.shadow.camera.top = 260;
sun.shadow.camera.bottom = -260;
scene.add(sun);

const streetGlow = new THREE.PointLight("#3ab8ff", 0.9, 450, 1.4);
streetGlow.position.set(0, 40, 0);
scene.add(streetGlow);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
  new THREE.MeshStandardMaterial({ color: "#1d2e3a", roughness: 0.95, metalness: 0.05 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const cityGroup = new THREE.Group();
scene.add(cityGroup);

const roadMat = new THREE.MeshStandardMaterial({ color: "#202a34", roughness: 0.92, metalness: 0.08 });
const laneMat = new THREE.MeshStandardMaterial({ color: "#8ca8bd", roughness: 0.5, metalness: 0.2 });

function createRoads() {
  const span = WORLD_SIZE - 40;
  for (let i = -4; i <= 4; i += 1) {
    const x = i * BLOCK_SIZE;

    const vertical = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 1.6, span), roadMat);
    vertical.position.set(x, 0.8, 0);
    vertical.receiveShadow = true;
    cityGroup.add(vertical);

    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(span, 1.6, ROAD_WIDTH), roadMat);
    horizontal.position.set(0, 0.8, x);
    horizontal.receiveShadow = true;
    cityGroup.add(horizontal);

    const laneV = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, span), laneMat);
    laneV.position.set(x, 1.7, 0);
    cityGroup.add(laneV);

    const laneH = new THREE.Mesh(new THREE.BoxGeometry(span, 0.2, 2.2), laneMat);
    laneH.position.set(0, 1.7, x);
    cityGroup.add(laneH);
  }
}

function randomFromSeed(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function createBuilding(x, z, seed) {
  const width = 34 + Math.floor(randomFromSeed(seed + 1) * 26);
  const depth = 34 + Math.floor(randomFromSeed(seed + 2) * 28);
  const height = 28 + Math.floor(randomFromSeed(seed + 3) * 160);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.58 + randomFromSeed(seed + 4) * 0.08, 0.25, 0.2 + randomFromSeed(seed + 5) * 0.18),
      roughness: 0.82,
      metalness: 0.12,
    })
  );
  body.position.set(x, height / 2 + 1, z);
  body.castShadow = true;
  body.receiveShadow = true;

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.88, 3.4, depth * 0.88),
    new THREE.MeshStandardMaterial({ color: "#89d5ff", emissive: "#163348", emissiveIntensity: 0.52 })
  );
  trim.position.set(0, height * 0.45, 0);
  body.add(trim);

  cityGroup.add(body);
}

function createCityBlocks() {
  for (let gx = -4; gx <= 4; gx += 1) {
    for (let gz = -4; gz <= 4; gz += 1) {
      if (Math.abs(gx) <= 0 || Math.abs(gz) <= 0) continue;

      const blockCenterX = gx * BLOCK_SIZE;
      const blockCenterZ = gz * BLOCK_SIZE;

      if (Math.abs(blockCenterX) < ROAD_WIDTH * 1.2 || Math.abs(blockCenterZ) < ROAD_WIDTH * 1.2) {
        continue;
      }

      const seed = gx * 100 + gz;
      createBuilding(blockCenterX + (randomFromSeed(seed) - 0.5) * 28, blockCenterZ + (randomFromSeed(seed + 9) - 0.5) * 30, seed);
    }
  }
}

function createTraffic() {
  const cars = [];
  for (let i = 0; i < 38; i += 1) {
    const isVertical = i % 2 === 0;
    const lane = ((i % 9) - 4) * BLOCK_SIZE;
    const speed = 24 + (i % 7) * 4;

    const car = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 20),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.03 + (i * 0.09) % 0.95, 0.85, 0.56),
        roughness: 0.45,
        metalness: 0.55,
      })
    );
    car.castShadow = true;
    car.receiveShadow = true;

    car.position.set(
      isVertical ? lane : -WORLD_SIZE / 2 + ((i * 58) % WORLD_SIZE),
      3,
      isVertical ? -WORLD_SIZE / 2 + ((i * 91) % WORLD_SIZE) : lane
    );

    cityGroup.add(car);
    cars.push({ mesh: car, vertical: isVertical, speed, direction: i % 3 === 0 ? -1 : 1 });
  }
  return cars;
}

createRoads();
createCityBlocks();
const traffic = createTraffic();

const janRoot = new THREE.Group();
janRoot.position.set(0, 0, 0);
scene.add(janRoot);

const janFallback = new THREE.Mesh(
  new THREE.CapsuleGeometry(4, 8, 8, 16),
  new THREE.MeshStandardMaterial({ color: "#33d6ff", roughness: 0.33, metalness: 0.42 })
);
janFallback.position.y = 9;
janFallback.castShadow = true;
janRoot.add(janFallback);

const janLabel = buildLabel("JAN");
janLabel.position.set(0, 22, 0);
janRoot.add(janLabel);

const autbotA = buildAutobot("#f7a24c");
const autbotB = buildAutobot("#7ae98a");
scene.add(autbotA.root, autbotB.root);

const citizens = [];
const beaconGeom = new THREE.TorusGeometry(8, 0.65, 12, 40);
const beaconMat = new THREE.MeshBasicMaterial({ color: "#ff6a6a" });

function createCitizen(index) {
  const root = new THREE.Group();
  const avatar = new THREE.Mesh(
    new THREE.CapsuleGeometry(2.5, 4, 8, 12),
    new THREE.MeshStandardMaterial({ color: "#ffe2bf", roughness: 0.54, metalness: 0.08 })
  );
  avatar.castShadow = true;
  avatar.position.y = 6;
  root.add(avatar);

  const beacon = new THREE.Mesh(beaconGeom, beaconMat.clone());
  beacon.rotation.x = Math.PI / 2;
  beacon.position.y = 1.8;
  root.add(beacon);

  const issue = issuePool[index % issuePool.length];

  placeAtRandomStreet(root, index * 111 + 13);
  scene.add(root);

  return { root, beacon, issue, solved: false, pulse: Math.random() * Math.PI * 2 };
}

for (let i = 0; i < 10; i += 1) {
  citizens.push(createCitizen(i));
}

function placeAtRandomStreet(object, seed) {
  const laneIndex = (Math.floor(randomFromSeed(seed) * 8) - 4) * BLOCK_SIZE;
  const along = -WORLD_SIZE / 2 + randomFromSeed(seed + 9) * WORLD_SIZE;
  if (randomFromSeed(seed + 2) > 0.5) {
    object.position.set(laneIndex, 0, along);
  } else {
    object.position.set(along, 0, laneIndex);
  }
}

function buildLabel(text) {
  const canvasLabel = document.createElement("canvas");
  canvasLabel.width = 256;
  canvasLabel.height = 64;
  const ctx = canvasLabel.getContext("2d");
  ctx.fillStyle = "#001625";
  ctx.fillRect(0, 0, canvasLabel.width, canvasLabel.height);
  ctx.strokeStyle = "#48cfff";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, canvasLabel.width, canvasLabel.height);
  ctx.fillStyle = "#f5fbff";
  ctx.font = "700 42px Rajdhani";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvasLabel.width / 2, canvasLabel.height / 2);

  const texture = new THREE.CanvasTexture(canvasLabel);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(16, 4, 1);
  return sprite;
}

function buildAutobot(color) {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 7.5, 4),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.85 })
  );
  body.position.y = 7;
  body.castShadow = true;
  root.add(body);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 1.2, 4.2),
    new THREE.MeshStandardMaterial({ color: "#13304a", emissive: "#1f90de", emissiveIntensity: 0.55 })
  );
  visor.position.set(0, 8.2, 0);
  root.add(visor);

  return { root, body, visor };
}

const jan = {
  root: janRoot,
  speed: 38,
  sprint: 56,
  velocity: new THREE.Vector3(),
  mixer: null,
  action: null,
  model: null,
};

const botFollow = [
  { actor: autbotA.root, phase: 0 },
  { actor: autbotB.root, phase: Math.PI },
];

const loader = new GLTFLoader();

function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

async function loadCharacterModels() {
  const janUrl = "https://threejs.org/examples/models/gltf/Soldier.glb";
  const autobotUrl = "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb";

  const [janRes, autobotRes] = await Promise.allSettled([loadModel(janUrl), loadModel(autobotUrl)]);

  if (janRes.status === "fulfilled") {
    janFallback.visible = false;
    const janModel = janRes.value.scene;
    janModel.scale.setScalar(9);
    janModel.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    janRoot.add(janModel);
    jan.model = janModel;

    if (janRes.value.animations?.length) {
      jan.mixer = new THREE.AnimationMixer(janModel);
      jan.action = jan.mixer.clipAction(janRes.value.animations[0]);
      jan.action.play();
    }
  } else {
    pushMessage("JAN model se nije učitao, korišten je fallback lik.", 2500);
  }

  if (autobotRes.status === "fulfilled") {
    const proto = autobotRes.value.scene;
    const setBotModel = (bot, hueShift) => {
      bot.children.slice().forEach((child) => {
        if (child.type !== "Sprite") bot.remove(child);
      });

      const instance = proto.clone(true);
      instance.scale.setScalar(3.3);
      instance.position.y = 0;
      instance.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          const mat = obj.material.clone();
          if (mat.color) {
            const hsl = { h: 0, s: 0, l: 0 };
            mat.color.getHSL(hsl);
            mat.color.setHSL((hsl.h + hueShift) % 1, Math.min(1, hsl.s * 1.1), hsl.l);
          }
          obj.material = mat;
        }
      });
      bot.add(instance);
    };

    setBotModel(autbotA.root, 0.03);
    setBotModel(autbotB.root, 0.27);
  } else {
    pushMessage("Autobot modeli nisu dostupni, koristi se fallback robot.", 2500);
  }
}

function pushMessage(msg, duration = 2200) {
  state.message = msg;
  state.messageUntil = performance.now() + duration;
}

function nearestCitizen() {
  let closest = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const citizen of citizens) {
    if (citizen.solved) continue;
    const d = citizen.root.position.distanceTo(jan.root.position);
    if (d < bestDist) {
      bestDist = d;
      closest = citizen;
    }
  }
  return { closest, bestDist };
}

function solveMission() {
  const { closest, bestDist } = nearestCitizen();
  if (!closest || bestDist > 23) {
    pushMessage("Priđi građaninu i pritisni E za rješavanje problema.", 1900);
    return;
  }

  closest.solved = true;
  closest.root.visible = false;

  state.reputation += 10;
  state.missions += 1;
  pushMessage(`Riješeno: ${closest.issue}`, 2600);

  setTimeout(() => {
    placeAtRandomStreet(closest.root, Math.random() * 1000 + performance.now() * 0.0001);
    closest.issue = issuePool[Math.floor(Math.random() * issuePool.length)];
    closest.solved = false;
    closest.root.visible = true;
  }, 2300);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);

  if (key === "e") {
    solveMission();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("resize", () => {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
});

function movementDelta() {
  const forward = Number(keys.has("w") || keys.has("arrowup")) - Number(keys.has("s") || keys.has("arrowdown"));
  const right = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));

  const dir = new THREE.Vector3(right, 0, forward);
  if (dir.lengthSq() === 0) return dir;

  dir.normalize();
  const angle = controls.getAzimuthalAngle();
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  return dir;
}

function clampPlayerPosition() {
  jan.root.position.x = THREE.MathUtils.clamp(jan.root.position.x, -WORLD_SIZE / 2 + 24, WORLD_SIZE / 2 - 24);
  jan.root.position.z = THREE.MathUtils.clamp(jan.root.position.z, -WORLD_SIZE / 2 + 24, WORLD_SIZE / 2 - 24);
}

function updateTraffic(dt) {
  for (const car of traffic) {
    if (car.vertical) {
      car.mesh.position.z += car.speed * dt * car.direction;
      if (car.mesh.position.z > WORLD_SIZE / 2) car.mesh.position.z = -WORLD_SIZE / 2;
      if (car.mesh.position.z < -WORLD_SIZE / 2) car.mesh.position.z = WORLD_SIZE / 2;
      car.mesh.rotation.y = car.direction > 0 ? 0 : Math.PI;
    } else {
      car.mesh.position.x += car.speed * dt * car.direction;
      if (car.mesh.position.x > WORLD_SIZE / 2) car.mesh.position.x = -WORLD_SIZE / 2;
      if (car.mesh.position.x < -WORLD_SIZE / 2) car.mesh.position.x = WORLD_SIZE / 2;
      car.mesh.rotation.y = car.direction > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
  }
}

function updateBots(time) {
  botFollow.forEach((bot, idx) => {
    const radius = 15 + idx * 3;
    const offset = new THREE.Vector3(
      Math.cos(time * 0.0019 + bot.phase) * radius,
      0,
      Math.sin(time * 0.0019 + bot.phase) * radius
    );

    const target = jan.root.position.clone().add(offset);
    bot.actor.position.lerp(target, 0.08);

    const lookAt = jan.root.position.clone();
    lookAt.y = 7;
    bot.actor.lookAt(lookAt);
  });
}

function updateCitizens(time) {
  for (const citizen of citizens) {
    if (citizen.solved) continue;
    const pulse = (Math.sin(time * 0.004 + citizen.pulse) + 1) * 0.5;
    citizen.beacon.scale.setScalar(0.9 + pulse * 0.5);
    citizen.beacon.material.opacity = 0.45 + pulse * 0.55;
    citizen.beacon.material.transparent = true;
  }
}

function updateUI(time) {
  repValue.textContent = String(state.reputation);
  missionValue.textContent = String(state.missions);

  const { closest } = nearestCitizen();
  activeIssue.textContent = closest ? closest.issue : "Svi problemi riješeni";

  if (time > state.messageUntil) {
    state.message = closest
      ? `Najbliži problem: ${closest.issue}`
      : "Mega grad je trenutno siguran.";
  }

  eventOverlay.textContent = state.message;
}

function updatePlayer(dt) {
  const input = movementDelta();
  const speed = keys.has("shift") ? jan.sprint : jan.speed;

  if (input.lengthSq() > 0) {
    jan.velocity.copy(input).multiplyScalar(speed * dt);
    jan.root.position.add(jan.velocity);
    const facing = Math.atan2(input.x, input.z);
    jan.root.rotation.y = facing;
  }

  clampPlayerPosition();

  controls.target.lerp(jan.root.position.clone().add(new THREE.Vector3(0, 10, 0)), 0.11);
}

function animate() {
  const dt = Math.min(0.033, clock.getDelta());
  const time = performance.now();

  updatePlayer(dt);
  updateBots(time);
  updateTraffic(dt);
  updateCitizens(time);

  if (jan.mixer) jan.mixer.update(dt);

  updateUI(time);

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

async function init() {
  try {
    await loadCharacterModels();
  } catch (_err) {
    pushMessage("Neki 3D modeli nisu učitani, igra radi s fallback modelima.", 2800);
  } finally {
    loaderEl.classList.add("hidden");
    pushMessage("JAN i Autoboti ulaze u patrolu. Kreni s misijama!", 2600);
    animate();
  }
}

init();
