import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

const app = document.getElementById("app");
const scoreEl = document.getElementById("score");
const savedEl = document.getElementById("saved");
const modeEl = document.getElementById("mode");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const transformBtn = document.getElementById("transformBtn");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa5d8ff);
scene.fog = new THREE.Fog(0xb9e6ff, 30, 210);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 420);
camera.position.set(0, 9, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xe8f8ff, 0x56705b, 0.85);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff1d4, 1.9);
sun.position.set(40, 52, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -34;
sun.shadow.camera.right = 34;
sun.shadow.camera.top = 34;
sun.shadow.camera.bottom = -34;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 140;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xd6ecff, 0.5);
fillLight.position.set(-25, 15, -10);
scene.add(fillLight);

const roadGroup = new THREE.Group();
scene.add(roadGroup);

const grass = new THREE.Mesh(
  new THREE.PlaneGeometry(230, 460),
  new THREE.MeshStandardMaterial({ color: 0x5ea765, roughness: 0.96, metalness: 0.01 })
);
grass.rotation.x = -Math.PI / 2;
grass.position.set(0, -0.02, -120);
grass.receiveShadow = true;
scene.add(grass);

const asphalt = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 360),
  new THREE.MeshStandardMaterial({ color: 0x2f3541, roughness: 0.92, metalness: 0.04 })
);
asphalt.rotation.x = -Math.PI / 2;
asphalt.position.set(0, 0, -120);
asphalt.receiveShadow = true;
roadGroup.add(asphalt);

const laneMat = new THREE.MeshStandardMaterial({ color: 0xffec8b, emissive: 0x544212, emissiveIntensity: 0.3 });
for (let i = 0; i < 54; i++) {
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 3.8), laneMat);
  mark.position.set(0, 0.03, 8 - i * 7.2);
  mark.receiveShadow = true;
  roadGroup.add(mark);
}

function createTree() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x6f4d2d, roughness: 0.95 })
  );
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f944c, roughness: 0.86 });
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.05 - i * 0.14, 14, 12), leafMat);
    leaf.position.y = 2 + i * 0.5;
    leaf.castShadow = true;
    tree.add(leaf);
  }

  return tree;
}

const forest = new THREE.Group();
scene.add(forest);
for (let i = 0; i < 220; i++) {
  const tree = createTree();
  const side = Math.random() > 0.5 ? 1 : -1;
  tree.position.x = side * THREE.MathUtils.randFloat(11, 36);
  tree.position.z = THREE.MathUtils.randFloat(-300, 60);
  tree.rotation.y = Math.random() * Math.PI;
  tree.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.45));
  forest.add(tree);
}

const skyline = new THREE.Group();
scene.add(skyline);
const buildingColors = [0xd8dee6, 0xb4c6d8, 0x9fb3c9, 0xf0d7be, 0xb7c6d0, 0xc7d7e2];

function addWindows(building, w, h, d) {
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xb5dfff,
    emissive: 0x2d6dad,
    emissiveIntensity: 0.2,
    metalness: 0.45,
    roughness: 0.26
  });
  const rows = Math.max(2, Math.floor(h / 1.25));
  const cols = Math.max(2, Math.floor(w / 0.9));
  const depthOffset = d / 2 + 0.03;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.24) {
        continue;
      }
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.36), windowMat);
      win.position.set(-w / 2 + 0.45 + c * ((w - 0.9) / Math.max(cols - 1, 1)), -h / 2 + 0.62 + r * ((h - 1.1) / Math.max(rows - 1, 1)), depthOffset);
      building.add(win);
    }
  }
}

for (let i = 0; i < 150; i++) {
  const w = THREE.MathUtils.randFloat(2.7, 5.7);
  const h = THREE.MathUtils.randFloat(5.5, 23);
  const d = THREE.MathUtils.randFloat(2.8, 6.4);
  const side = Math.random() > 0.5 ? 1 : -1;

  const block = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
      roughness: 0.7,
      metalness: 0.08
    })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  block.add(body);
  addWindows(block, w, h, d);

  block.position.set(side * THREE.MathUtils.randFloat(15, 38), h / 2, THREE.MathUtils.randFloat(-330, 45));
  skyline.add(block);
}

const clouds = new THREE.Group();
scene.add(clouds);
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 });
for (let i = 0; i < 10; i++) {
  const cloud = new THREE.Group();
  for (let p = 0; p < 5; p++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.4 + Math.random() * 1.3, 14, 12), cloudMat);
    puff.position.set((p - 2) * 1.5, Math.random() * 0.5, Math.random() * 0.8);
    cloud.add(puff);
  }
  cloud.position.set(THREE.MathUtils.randFloat(-34, 34), THREE.MathUtils.randFloat(15, 26), THREE.MathUtils.randFloat(-120, 20));
  clouds.add(cloud);
}

function castShadowRecursive(obj) {
  obj.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
}

function createOptimusRobot() {
  const robot = new THREE.Group();

  const red = new THREE.MeshStandardMaterial({ color: 0xd82d2d, roughness: 0.38, metalness: 0.68 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x1d4db8, roughness: 0.42, metalness: 0.7 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd0d5dc, roughness: 0.25, metalness: 0.92 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1f2d, roughness: 0.72, metalness: 0.22 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x75c9ff, transparent: true, opacity: 0.78, metalness: 0.2, roughness: 0.12 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xffd84d, roughness: 0.45, metalness: 0.58 });

  const hips = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.1), silver);
  hips.position.y = 2.55;
  robot.add(hips);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2, 1.25), red);
  chest.position.y = 4.35;
  robot.add(chest);

  const ab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.15, 0.95), silver);
  ab.position.y = 3.2;
  robot.add(ab);

  const grill = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.2, 0.22), silver);
  grill.position.set(0, 3.9, 0.72);
  robot.add(grill);

  const winL = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.72, 0.16), glass);
  winL.position.set(-0.56, 4.76, 0.72);
  robot.add(winL);

  const winR = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.72, 0.16), glass);
  winR.position.set(0.56, 4.76, 0.72);
  robot.add(winR);

  const waistLightL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.15), yellow);
  waistLightL.position.set(-0.33, 2.98, 0.6);
  robot.add(waistLightL);

  const waistLightR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.15), yellow);
  waistLightR.position.set(0.33, 2.98, 0.6);
  robot.add(waistLightR);

  const head = new THREE.Group();
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.86, 0.85), blue);
  helmet.position.y = 5.9;
  head.add(helmet);

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.4), silver);
  face.position.set(0, 5.83, 0.38);
  head.add(face);

  const crestL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 4), blue);
  crestL.position.set(-0.42, 6.18, 0);
  crestL.rotation.z = 0.2;
  head.add(crestL);

  const crestR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 4), blue);
  crestR.position.set(0.42, 6.18, 0);
  crestR.rotation.z = -0.2;
  head.add(crestR);

  const eyeBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.12), new THREE.MeshStandardMaterial({ color: 0x8ee1ff, emissive: 0x2f8fc8, emissiveIntensity: 0.8 }));
  eyeBar.position.set(0, 5.95, 0.45);
  head.add(eyeBar);
  robot.add(head);

  const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.16, 1.2), red);
  shoulderL.position.set(-2.02, 4.66, 0);
  robot.add(shoulderL);

  const shoulderR = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.16, 1.2), red);
  shoulderR.position.set(2.02, 4.66, 0);
  robot.add(shoulderR);

  const armL = new THREE.Group();
  const upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.35, 0.7), dark);
  upperArmL.position.y = -0.78;
  armL.add(upperArmL);
  const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.34, 0.9), red);
  forearmL.position.y = -2.2;
  armL.add(forearmL);
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.65), blue);
  handL.position.y = -3.1;
  armL.add(handL);
  armL.position.set(-2.02, 4.6, 0);
  robot.add(armL);

  const armR = armL.clone(true);
  armR.position.x = 2.02;
  robot.add(armR);

  const legL = new THREE.Group();
  const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.56, 0.95), silver);
  thighL.position.y = -0.85;
  legL.add(thighL);
  const shinL = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.85, 1.08), blue);
  shinL.position.y = -2.55;
  legL.add(shinL);
  const kneeL = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.35, 0.66), yellow);
  kneeL.position.set(0, -1.74, 0.45);
  legL.add(kneeL);
  const footL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.74), blue);
  footL.position.set(0, -3.68, 0.27);
  legL.add(footL);
  legL.position.set(-0.72, 2.65, 0);
  robot.add(legL);

  const legR = legL.clone(true);
  legR.position.x = 0.72;
  robot.add(legR);

  robot.userData = {
    head,
    armL,
    armR,
    legL,
    legR
  };

  castShadowRecursive(robot);
  robot.scale.setScalar(0.56);
  robot.position.y = 0.02;
  return robot;
}

function createOptimusTruck() {
  const truck = new THREE.Group();

  const blue = new THREE.MeshStandardMaterial({ color: 0x1d4db8, roughness: 0.42, metalness: 0.66 });
  const red = new THREE.MeshStandardMaterial({ color: 0xd82d2d, roughness: 0.36, metalness: 0.68 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd1d8dd, roughness: 0.24, metalness: 0.92 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d27, roughness: 0.86, metalness: 0.12 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x7acbff, transparent: true, opacity: 0.8, roughness: 0.12, metalness: 0.2 });

  const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2, 6.7), blue);
  trailer.position.set(0, 1.38, -1.9);
  truck.add(trailer);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.52, 2.8), red);
  cab.position.set(0, 1.68, 2.25);
  truck.add(cab);

  const grill = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.92, 0.3), silver);
  grill.position.set(0, 1.3, 3.72);
  truck.add(grill);

  const winL = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.72, 0.16), glass);
  winL.position.set(-0.5, 2.18, 3.34);
  truck.add(winL);

  const winR = winL.clone();
  winR.position.x = 0.5;
  truck.add(winR);

  const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.85, 10), silver);
  pipeL.position.set(-1.24, 2.45, 1.2);
  truck.add(pipeL);

  const pipeR = pipeL.clone();
  pipeR.position.x = 1.24;
  truck.add(pipeR);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.95 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x9ca5ac, roughness: 0.2, metalness: 0.9 });
  const wheelZ = [3.05, 1.25, -1.05, -3.15];

  for (const z of wheelZ) {
    for (const x of [-1.48, 1.48]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.55, 22), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.52, z);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.56, 16), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);
      truck.add(wheel);
    }
  }

  castShadowRecursive(truck);
  truck.scale.setScalar(0.66);
  truck.position.y = 0.04;
  return truck;
}

function createBumblebee() {
  const bot = new THREE.Group();

  const yellow = new THREE.MeshStandardMaterial({ color: 0xffd330, roughness: 0.45, metalness: 0.58 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1e2129, roughness: 0.66, metalness: 0.24 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, roughness: 0.25, metalness: 0.9 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x85d4ff, transparent: true, opacity: 0.76 });

  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.45, 1), yellow);
  chest.position.y = 2.88;
  bot.add(chest);

  const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 0.08), black);
  chestStripe.position.set(0, 2.88, 0.55);
  bot.add(chestStripe);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.62, 0.62), black);
  head.position.y = 3.84;
  bot.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.08), glass);
  visor.position.set(0, 3.86, 0.36);
  bot.add(visor);

  const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.6, 0.7), yellow);
  shoulderL.position.set(-1.05, 3.1, 0);
  bot.add(shoulderL);

  const shoulderR = shoulderL.clone();
  shoulderR.position.x = 1.05;
  bot.add(shoulderR);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.2, 0.52), black);
  armL.position.set(-1.05, 2.15, 0);
  bot.add(armL);

  const armR = armL.clone();
  armR.position.x = 1.05;
  bot.add(armR);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1, 0.58, 0.72), silver);
  pelvis.position.y = 2.02;
  bot.add(pelvis);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.55, 0.66), yellow);
  legL.position.set(-0.34, 1.05, 0);
  bot.add(legL);

  const legR = legL.clone();
  legR.position.x = 0.34;
  bot.add(legR);

  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.35, 0.92), black);
  footL.position.set(-0.34, 0.2, 0.14);
  bot.add(footL);

  const footR = footL.clone();
  footR.position.x = 0.34;
  bot.add(footR);

  bot.userData = { armL, armR, legL, legR, head };

  castShadowRecursive(bot);
  bot.scale.setScalar(0.45);
  bot.position.y = 0.02;
  return bot;
}

const heroRig = new THREE.Group();
scene.add(heroRig);

const optimusRobot = createOptimusRobot();
const optimusTruck = createOptimusTruck();
optimusTruck.visible = false;
heroRig.add(optimusRobot);
heroRig.add(optimusTruck);
heroRig.position.z = 8;

const bumblebee = createBumblebee();
bumblebee.position.set(-3.6, 0, 10.4);
scene.add(bumblebee);

const obstacleGroup = new THREE.Group();
scene.add(obstacleGroup);
const obstacles = [];

const citizenGroup = new THREE.Group();
scene.add(citizenGroup);
const citizens = [];

const sparkleGroup = new THREE.Group();
scene.add(sparkleGroup);
const sparkles = [];

const state = {
  started: false,
  ended: false,
  score: 0,
  saved: 0,
  targetSaved: 10,
  mode: "robot",
  speedRobot: 0.25,
  speedTruck: 0.36,
  laneX: 0,
  leftDown: false,
  rightDown: false,
  transformCooldown: 0,
  lastSpeechAt: 0,
  bumblebeeSpeechAt: 0
};

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function speakHr(text) {
  if (!window.speechSynthesis) {
    return;
  }

  const now = performance.now();
  if (now - state.lastSpeechAt < 900) {
    return;
  }
  state.lastSpeechAt = now;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "hr-HR";
  utter.rate = 0.96;
  utter.pitch = 1;

  const voices = speechSynthesis.getVoices();
  const hrVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("hr"));
  if (hrVoice) {
    utter.voice = hrVoice;
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

if (window.speechSynthesis) {
  speechSynthesis.getVoices();
}

function setStatus(text, ok = false) {
  statusEl.textContent = text;
  statusEl.style.borderColor = ok ? "rgba(143, 247, 180, 0.7)" : "rgba(255, 255, 255, 0.16)";
  statusEl.style.color = ok ? "var(--ok)" : "var(--text)";
}

function updateHUD() {
  scoreEl.textContent = String(state.score);
  savedEl.textContent = String(state.saved);
  modeEl.textContent = state.mode === "robot" ? "Robot" : "Kamion";
}

function createObstacle(zPos) {
  const kind = Math.random();
  let mesh;

  if (kind < 0.35) {
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.7, 1.7),
      new THREE.MeshStandardMaterial({ color: 0xa37245, roughness: 0.85, metalness: 0.04 })
    );
    mesh.position.y = 0.9;
  } else if (kind < 0.7) {
    mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.08, 0),
      new THREE.MeshStandardMaterial({ color: 0x8f9eae, roughness: 0.8, metalness: 0.1 })
    );
    mesh.position.y = 1.05;
  } else {
    mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0xf1883d, roughness: 0.75, metalness: 0.05 })
    );
    mesh.position.y = 0.96;
  }

  mesh.position.x = THREE.MathUtils.randFloat(-3.6, 3.6);
  mesh.position.z = zPos;
  mesh.userData = {
    radius: 1.15,
    baseY: mesh.position.y,
    cleared: false,
    remove: false
  };

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  obstacles.push(mesh);
  obstacleGroup.add(mesh);
}

function createCitizen(zPos) {
  const person = new THREE.Group();
  const color = [0x7ed6df, 0xffbe76, 0xff7979, 0x95afc0][Math.floor(Math.random() * 4)];

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.34, 0.6, 4, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
  body.position.y = 0.86;
  person.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd8b5, roughness: 0.78 })
  );
  head.position.y = 1.62;
  person.add(head);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), body.material);
  handL.position.set(-0.34, 1.03, 0);
  person.add(handL);

  const handR = handL.clone();
  handR.position.x = 0.34;
  person.add(handR);

  person.position.set(THREE.MathUtils.randFloat(-3.5, 3.5), 0, zPos);
  person.userData = { saved: false };
  castShadowRecursive(person);

  citizens.push(person);
  citizenGroup.add(person);
}

function sparkleBurst(position, color = 0xfff08a) {
  for (let i = 0; i < 12; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ color, transparent: true, opacity: 0.96 })
    );
    sprite.position.copy(position);
    sprite.position.x += THREE.MathUtils.randFloatSpread(1.5);
    sprite.position.y += THREE.MathUtils.randFloat(0.5, 1.8);
    sprite.position.z += THREE.MathUtils.randFloatSpread(1.5);
    sprite.scale.setScalar(0.35 + Math.random() * 0.4);

    sprite.userData = {
      v: new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.05),
        THREE.MathUtils.randFloat(0.02, 0.06),
        THREE.MathUtils.randFloatSpread(0.05)
      ),
      life: 50 + Math.random() * 18
    };

    sparkles.push(sprite);
    sparkleGroup.add(sprite);
  }
}

function populateLevel() {
  for (const o of obstacles) {
    obstacleGroup.remove(o);
  }
  obstacles.length = 0;

  for (const c of citizens) {
    citizenGroup.remove(c);
  }
  citizens.length = 0;

  for (const s of sparkles) {
    sparkleGroup.remove(s);
  }
  sparkles.length = 0;

  for (let i = 0; i < 40; i++) {
    createObstacle(-15 - i * THREE.MathUtils.randFloat(7.5, 10.5));
  }

  for (let i = 0; i < state.targetSaved; i++) {
    createCitizen(-32 - i * 18);
  }
}

function setMode(mode) {
  state.mode = mode;
  const robotMode = mode === "robot";
  optimusRobot.visible = robotMode;
  optimusTruck.visible = !robotMode;
  updateHUD();
}

function toggleTransform() {
  if (state.transformCooldown > 0 || state.ended) {
    return;
  }

  if (!state.started) {
    state.started = true;
    setStatus("Misija je krenula. Optimus je u pokretu.");
    speakHr("Krećemo u akciju.");
  }

  const next = state.mode === "robot" ? "truck" : "robot";
  setMode(next);
  state.transformCooldown = 0.8;

  if (next === "truck") {
    setStatus("Transformacija završena. Optimus je kamion.");
    speakHr("Transformiram se u kamion.");
  } else {
    setStatus("Optimus je opet robot.");
    speakHr("Vraćam se u robotski oblik.");
  }

  sparkleBurst(heroRig.position.clone().add(new THREE.Vector3(0, 2, 0)), 0x8ddcff);
}

function resetGame() {
  populateLevel();
  heroRig.position.set(0, 0, 8);
  bumblebee.position.set(-3.6, 0, 10.4);

  state.started = false;
  state.ended = false;
  state.score = 0;
  state.saved = 0;
  state.laneX = 0;
  state.transformCooldown = 0;
  state.bumblebeeSpeechAt = 0;
  state.lastSpeechAt = 0;
  state.leftDown = false;
  state.rightDown = false;

  setMode("robot");
  updateHUD();
  setStatus("Dodirni ekran za početak misije");
  restartBtn.classList.add("hidden");
}

function endGame(win) {
  state.ended = true;
  restartBtn.classList.remove("hidden");

  if (win) {
    setStatus("Bravo! Grad je siguran.", true);
    speakHr("Odlično. Grad je spašen.");
  } else {
    setStatus("Prepreka je bila prejaka. Pokušaj opet.");
    speakHr("Pokušaj ponovno. Možemo to.");
  }
}

function screenToNdc(clientX, clientY) {
  return {
    x: (clientX / window.innerWidth) * 2 - 1,
    y: -(clientY / window.innerHeight) * 2 + 1
  };
}

function clearObstacleByPointer(clientX, clientY) {
  const ndc = screenToNdc(clientX, clientY);
  pointer.set(ndc.x, ndc.y);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(obstacles, false);
  if (hits.length === 0) {
    return false;
  }

  const hit = hits[0].object;
  if (hit.userData.cleared) {
    return false;
  }

  hit.userData.cleared = true;
  state.score += 12;
  updateHUD();
  sparkleBurst(hit.position.clone(), 0xfff08a);
  speakHr("Put je čist.");
  return true;
}

function onPointerDown(event) {
  if (event.target.closest("#controls") || event.target === restartBtn) {
    return;
  }

  if (state.ended) {
    return;
  }

  if (!state.started) {
    state.started = true;
    setStatus("Odlično. Optimus brzo hoda kroz grad.");
    speakHr("Krećemo. Prati me, Bumblebee.");
  }

  clearObstacleByPointer(event.clientX, event.clientY);
}

window.addEventListener("pointerdown", onPointerDown);

function bindHoldButton(button, setValue) {
  const onDown = (event) => {
    event.preventDefault();
    if (!state.started && !state.ended) {
      state.started = true;
      setStatus("Misija je krenula. Čuvaj cestu.");
      speakHr("Idemo spasiti grad.");
    }
    setValue(true);
  };

  const onUp = (event) => {
    event.preventDefault();
    setValue(false);
  };

  button.addEventListener("pointerdown", onDown);
  button.addEventListener("pointerup", onUp);
  button.addEventListener("pointerleave", onUp);
  button.addEventListener("pointercancel", onUp);
}

bindHoldButton(leftBtn, (v) => {
  state.leftDown = v;
});

bindHoldButton(rightBtn, (v) => {
  state.rightDown = v;
});

transformBtn.addEventListener("click", (event) => {
  event.preventDefault();
  toggleTransform();
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    state.leftDown = true;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    state.rightDown = true;
  }
  if (event.key.toLowerCase() === "t") {
    toggleTransform();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    state.leftDown = false;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    state.rightDown = false;
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const clock = new THREE.Clock();

function animateRobot(robot, t, movingSpeed) {
  const walkStrength = 0.6 + movingSpeed * 0.5;
  const phase = t * 9 * walkStrength;

  robot.userData.legL.rotation.x = Math.sin(phase) * 0.55;
  robot.userData.legR.rotation.x = -Math.sin(phase) * 0.55;
  robot.userData.armL.rotation.x = -Math.sin(phase) * 0.45;
  robot.userData.armR.rotation.x = Math.sin(phase) * 0.45;
  robot.userData.head.rotation.y = Math.sin(t * 1.5) * 0.08;

  robot.position.y = 0.02 + Math.abs(Math.sin(phase)) * 0.12;
}

function animateBumblebee(t, speed) {
  const phase = t * 10 * (0.7 + speed);
  bumblebee.userData.legL.rotation.x = Math.sin(phase) * 0.6;
  bumblebee.userData.legR.rotation.x = -Math.sin(phase) * 0.6;
  bumblebee.userData.armL.rotation.x = -Math.sin(phase) * 0.5;
  bumblebee.userData.armR.rotation.x = Math.sin(phase) * 0.5;
  bumblebee.userData.head.rotation.y = Math.sin(t * 2) * 0.12;
  bumblebee.position.y = 0.02 + Math.abs(Math.sin(phase)) * 0.08;
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.033);
  const t = performance.now() * 0.001;

  clouds.children.forEach((cloud, i) => {
    cloud.position.x += Math.sin(t * 0.12 + i) * 0.003;
  });

  if (state.transformCooldown > 0) {
    state.transformCooldown = Math.max(0, state.transformCooldown - dt);
  }

  if (state.started && !state.ended) {
    const turnSpeed = state.mode === "robot" ? 4.8 : 5.8;
    if (state.leftDown) {
      state.laneX -= turnSpeed * dt;
    }
    if (state.rightDown) {
      state.laneX += turnSpeed * dt;
    }
    state.laneX = THREE.MathUtils.clamp(state.laneX, -4.6, 4.6);

    const speed = state.mode === "robot" ? state.speedRobot : state.speedTruck;
    heroRig.position.z -= speed;
    heroRig.position.x += (state.laneX - heroRig.position.x) * 0.15;

    if (state.mode === "robot") {
      animateRobot(optimusRobot, t, speed);
    } else {
      optimusTruck.position.y = 0.04 + Math.sin(t * 22) * 0.03;
    }

    const bTargetX = heroRig.position.x - 3.2;
    const bTargetZ = heroRig.position.z + 2.7;
    bumblebee.position.x += (bTargetX - bumblebee.position.x) * 0.1;
    bumblebee.position.z += (bTargetZ - bumblebee.position.z) * 0.1;
    animateBumblebee(t, speed);

    if (t - state.bumblebeeSpeechAt > 12) {
      state.bumblebeeSpeechAt = t;
      speakHr("Bumblebee: Tu sam, Optimuse.");
    }

    const collisionRadius = state.mode === "robot" ? 1.05 : 1.3;

    for (const obs of obstacles) {
      if (obs.userData.cleared) {
        obs.rotation.x += dt * 6;
        obs.rotation.y += dt * 4;
        obs.position.y += dt * 6.4;
        obs.material.transparent = true;
        obs.material.opacity = Math.max(0, (obs.material.opacity ?? 1) - dt * 2.1);

        if (obs.position.y > 8) {
          obs.userData.remove = true;
          obstacleGroup.remove(obs);
        }
        continue;
      }

      obs.position.y = obs.userData.baseY + Math.sin(t * 2.8 + obs.position.z * 0.5) * 0.08;

      const dz = Math.abs(obs.position.z - heroRig.position.z);
      const dx = Math.abs(obs.position.x - heroRig.position.x);
      if (dz < collisionRadius + obs.userData.radius && dx < 1.65) {
        endGame(false);
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].userData.remove) {
        obstacles.splice(i, 1);
      }
    }

    for (const citizen of citizens) {
      if (citizen.userData.saved) {
        citizen.position.y = Math.sin(t * 8) * 0.08;
        continue;
      }

      const dz = Math.abs(citizen.position.z - heroRig.position.z);
      const dx = Math.abs(citizen.position.x - heroRig.position.x);
      if (dz < 1.9 && dx < 2.1) {
        citizen.userData.saved = true;
        state.saved += 1;
        state.score += 30;
        updateHUD();
        sparkleBurst(citizen.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x9cffd8);
        speakHr("Građanin je spašen.");

        if (state.saved >= state.targetSaved) {
          endGame(true);
        }
      }
    }

    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.position.add(s.userData.v);
      s.userData.life -= 1;
      s.material.opacity = Math.max(0, s.userData.life / 65);
      if (s.userData.life <= 0) {
        sparkleGroup.remove(s);
        sparkles.splice(i, 1);
      }
    }

    const camX = heroRig.position.x * 0.42;
    const camY = state.mode === "robot" ? 8.3 : 7.3;
    const camZ = heroRig.position.z + (state.mode === "robot" ? 16.4 : 14.8);
    camera.position.x += (camX - camera.position.x) * 0.07;
    camera.position.y += (camY - camera.position.y) * 0.07;
    camera.position.z += (camZ - camera.position.z) * 0.08;
  }

  camera.lookAt(heroRig.position.x, 2.8, heroRig.position.z - 8.5);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

resetGame();
loop();
