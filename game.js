import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.161.0/examples/jsm/loaders/RGBELoader.js";
import { clone } from "https://unpkg.com/three@0.161.0/examples/jsm/utils/SkeletonUtils.js";
import { EffectComposer } from "https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/ShaderPass.js";

const app = document.getElementById("app");
const scoreEl = document.getElementById("score");
const savedEl = document.getElementById("saved");
const modeEl = document.getElementById("mode");
const soundStateEl = document.getElementById("soundState");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const transformBtn = document.getElementById("transformBtn");
const soundBtn = document.getElementById("soundBtn");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaedfff);
scene.fog = new THREE.Fog(0xc2eaff, 26, 210);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 450);
camera.position.set(0, 8.5, 17.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.physicallyCorrectLights = true;
app.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.28, 0.5, 0.9);
composer.addPass(bloomPass);

const cinematicPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    contrast: { value: 1.08 },
    saturation: { value: 1.18 },
    vignette: { value: 0.2 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float contrast;
    uniform float saturation;
    uniform float vignette;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(gray), color.rgb, saturation);
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;
      float dist = distance(vUv, vec2(0.5));
      float edge = smoothstep(0.25, 0.85, dist);
      color.rgb *= (1.0 - edge * vignette);
      gl_FragColor = color;
    }
  `
});
composer.addPass(cinematicPass);
composer.setSize(window.innerWidth, window.innerHeight);

const hemi = new THREE.HemisphereLight(0xe9f8ff, 0x4f644f, 0.8);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff1d7, 2);
sun.position.set(42, 58, 22);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 160;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xc8e4ff, 0.45);
fill.position.set(-20, 13, -13);
scene.add(fill);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(320, 32, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x6bb2ff) },
      horizonColor: { value: new THREE.Color(0xe6f4ff) },
      bottomColor: { value: new THREE.Color(0xd6deea) }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        vec3 c = mix(bottomColor, horizonColor, smoothstep(0.0, 0.45, h));
        c = mix(c, topColor, smoothstep(0.45, 1.0, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `
  })
);
scene.add(sky);

const roadGroup = new THREE.Group();
scene.add(roadGroup);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(260, 500),
  new THREE.MeshStandardMaterial({ color: 0x63ab69, roughness: 0.95, metalness: 0.02 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.03, -125);
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(15.2, 400),
  new THREE.MeshStandardMaterial({ color: 0x2f3440, roughness: 0.9, metalness: 0.08 })
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0, -125);
road.receiveShadow = true;
roadGroup.add(road);

const curbMat = new THREE.MeshStandardMaterial({ color: 0xc8ced4, roughness: 0.72, metalness: 0.08 });
for (const side of [-1, 1]) {
  const curb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 400), curbMat);
  curb.position.set(side * 7.85, 0.08, -125);
  curb.castShadow = true;
  curb.receiveShadow = true;
  roadGroup.add(curb);
}

const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x434b58, roughness: 0.9, metalness: 0.04 });
for (const side of [-1, 1]) {
  const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 400), shoulderMat);
  shoulder.rotation.x = -Math.PI / 2;
  shoulder.position.set(side * 8.95, 0.01, -125);
  shoulder.receiveShadow = true;
  roadGroup.add(shoulder);
}

const laneMat = new THREE.MeshStandardMaterial({ color: 0xffe98c, emissive: 0x655118, emissiveIntensity: 0.25 });
for (let i = 0; i < 58; i++) {
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 3.8), laneMat);
  line.position.set(0, 0.03, 12 - i * 7);
  line.receiveShadow = true;
  roadGroup.add(line);
}

const crosswalkMat = new THREE.MeshStandardMaterial({ color: 0xf3f5f8, roughness: 0.7, metalness: 0.03 });
for (let i = 0; i < 7; i++) {
  const crossZ = -35 - i * 45;
  for (let s = -3; s <= 3; s++) {
    const zebra = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.6), crosswalkMat);
    zebra.position.set(s * 1.95, 0.03, crossZ);
    zebra.receiveShadow = true;
    roadGroup.add(zebra);
  }
}

const parkedCars = new THREE.Group();
scene.add(parkedCars);
function addParkedCars() {
  const carPalette = [0x1e1f2a, 0x8a1420, 0x2450a6, 0xcfd3da, 0xffba22];
  for (let i = 0; i < 28; i++) {
    const car = new THREE.Group();
    const color = carPalette[Math.floor(Math.random() * carPalette.length)];
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.6, 3.2),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.7 })
    );
    body.position.y = 0.48;
    car.add(body);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.52, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x8ac9ff, roughness: 0.15, metalness: 0.35, transparent: true, opacity: 0.82 })
    );
    cabin.position.set(0, 0.92, -0.1);
    car.add(cabin);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x101015, roughness: 0.95 });
    for (const x of [-0.75, 0.75]) {
      for (const z of [-1.05, 1.05]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.25, 14), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.22, z);
        car.add(wheel);
      }
    }
    car.position.set((Math.random() > 0.5 ? 1 : -1) * THREE.MathUtils.randFloat(10.8, 13.6), 0, -25 - i * 12.5);
    car.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
    castShadowRecursive(car);
    parkedCars.add(car);
  }
}

const skyline = new THREE.Group();
scene.add(skyline);
const buildingPalette = [0xd4dde9, 0xb9c8d8, 0xa8bbc8, 0xe6d4c6, 0xc1d1de, 0xa5bac8];

function addCity() {
  for (let i = 0; i < 140; i++) {
    const w = THREE.MathUtils.randFloat(2.7, 6.1);
    const h = THREE.MathUtils.randFloat(6, 27);
    const d = THREE.MathUtils.randFloat(2.9, 7.2);
    const side = Math.random() > 0.5 ? 1 : -1;

    const block = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        color: buildingPalette[Math.floor(Math.random() * buildingPalette.length)],
        roughness: 0.7,
        metalness: 0.1
      })
    );
    body.castShadow = true;
    body.receiveShadow = true;
    block.add(body);

    const winMat = new THREE.MeshStandardMaterial({
      color: 0xc6e5ff,
      emissive: 0x2a6ba7,
      emissiveIntensity: 0.25,
      roughness: 0.22,
      metalness: 0.45
    });

    const rows = Math.max(2, Math.floor(h / 1.25));
    const cols = Math.max(2, Math.floor(w / 1));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.22) {
          continue;
        }
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.38), winMat);
        win.position.set(
          -w / 2 + 0.48 + c * ((w - 0.96) / Math.max(cols - 1, 1)),
          -h / 2 + 0.66 + r * ((h - 1.22) / Math.max(rows - 1, 1)),
          d / 2 + 0.04
        );
        block.add(win);
      }
    }

    block.position.set(side * THREE.MathUtils.randFloat(17, 43), h / 2, THREE.MathUtils.randFloat(-360, 42));
    skyline.add(block);
  }
}

function createTree() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x6c4b29, roughness: 0.94 })
  );
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f8f48, roughness: 0.85 });
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.05 - i * 0.1, 12, 10), leafMat);
    leaf.position.y = 2 + i * 0.5;
    leaf.castShadow = true;
    tree.add(leaf);
  }

  return tree;
}

const trees = new THREE.Group();
scene.add(trees);
function addTrees() {
  for (let i = 0; i < 190; i++) {
    const tree = createTree();
    const side = Math.random() > 0.5 ? 1 : -1;
    tree.position.set(
      side * THREE.MathUtils.randFloat(10.5, 36),
      0,
      THREE.MathUtils.randFloat(-340, 60)
    );
    tree.scale.setScalar(THREE.MathUtils.randFloat(0.85, 1.5));
    tree.rotation.y = Math.random() * Math.PI;
    trees.add(tree);
  }
}

const streetLights = new THREE.Group();
scene.add(streetLights);
function addStreetLights() {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x8d99a6, roughness: 0.35, metalness: 0.7 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff4c2, emissive: 0xffcc4d, emissiveIntensity: 0.55 });

  for (let i = 0; i < 36; i++) {
    const z = 10 - i * 10.5;
    for (const side of [-1, 1]) {
      const light = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.6, 8), poleMat);
      pole.position.y = 2.3;
      light.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.08), poleMat);
      arm.position.set(side * 0.36, 4.42, 0);
      light.add(arm);

      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), lampMat);
      lamp.position.set(side * 0.7, 4.3, 0);
      light.add(lamp);

      const point = new THREE.PointLight(0xffdd8f, 0.25, 9, 2);
      point.position.copy(lamp.position);
      light.add(point);

      light.position.set(side * 8.5, 0, z);
      castShadowRecursive(light);
      streetLights.add(light);
    }
  }
}

const trafficGroup = new THREE.Group();
scene.add(trafficGroup);
function addTraffic() {
  const carMat = new THREE.MeshStandardMaterial({ color: 0x10141f, roughness: 0.45, metalness: 0.62 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffc761, emissive: 0xff9c24, emissiveIntensity: 0.8 });
  for (let i = 0; i < 16; i++) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 2.9), carMat.clone());
    body.material.color = new THREE.Color().setHSL(Math.random(), 0.35, 0.34);
    body.position.y = 0.48;
    car.add(body);
    const headLightL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), lightMat);
    headLightL.position.set(-0.45, 0.52, 1.46);
    car.add(headLightL);
    const headLightR = headLightL.clone();
    headLightR.position.x = 0.45;
    car.add(headLightR);
    car.position.set((Math.random() > 0.5 ? 1 : -1) * THREE.MathUtils.randFloat(2.1, 4.3), 0, -30 - i * 26);
    car.userData = {
      speed: THREE.MathUtils.randFloat(0.07, 0.12),
      laneX: car.position.x
    };
    castShadowRecursive(car);
    trafficGroup.add(car);
  }
}

const clouds = new THREE.Group();
scene.add(clouds);
function addClouds() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.86 });
  for (let i = 0; i < 11; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 5; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 1.2, 14, 12), mat);
      puff.position.set((j - 2) * 1.4, Math.random() * 0.4, Math.random() * 0.8);
      cloud.add(puff);
    }
    cloud.position.set(THREE.MathUtils.randFloat(-35, 35), THREE.MathUtils.randFloat(14, 26), THREE.MathUtils.randFloat(-120, 20));
    clouds.add(cloud);
  }
}

const distantMountains = new THREE.Group();
scene.add(distantMountains);
function addMountains() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x8da3bb, roughness: 0.9, metalness: 0.02 });
  for (let i = 0; i < 18; i++) {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(THREE.MathUtils.randFloat(8, 18), THREE.MathUtils.randFloat(10, 24), 7), mat);
    mountain.position.set(-160 + i * 18, 5, -300 - Math.random() * 80);
    mountain.rotation.y = Math.random() * Math.PI;
    distantMountains.add(mountain);
  }
}

addCity();
addTrees();
addStreetLights();
addClouds();
addParkedCars();
addTraffic();
addMountains();

const modelUrls = {
  robot: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r161/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
  truck: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
  hdr: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r161/examples/textures/equirectangular/venice_sunset_1k.hdr"
};

const loader = new GLTFLoader();

const heroRoot = new THREE.Group();
heroRoot.position.set(0, 0, 8);
scene.add(heroRoot);

const bumblebeeRoot = new THREE.Group();
bumblebeeRoot.position.set(-3.3, 0, 10.8);
scene.add(bumblebeeRoot);

const obstacleGroup = new THREE.Group();
scene.add(obstacleGroup);
const citizenGroup = new THREE.Group();
scene.add(citizenGroup);
const particleGroup = new THREE.Group();
scene.add(particleGroup);

const obstacles = [];
const citizens = [];
const particles = [];

const state = {
  started: false,
  ended: false,
  score: 0,
  saved: 0,
  targetSaved: 8,
  mode: "robot",
  leftDown: false,
  rightDown: false,
  laneTarget: 0,
  speedRobot: 0.22,
  speedTruck: 0.3,
  transformCooldown: 0,
  soundsEnabled: true,
  speechUnlocked: false,
  lastVoiceAt: 0,
  bumblebeeVoiceAt: 0,
  modelsReady: false
};

const audioState = {
  ctx: null,
  unlocked: false
};

const controlState = {
  swipeId: null,
  swipeStartX: 0
};

const voiceClips = {
  missionStart: "/assets/audio/hr/optimus-krecemo.mp3",
  transformTruck: "/assets/audio/hr/optimus-transform-kamion.mp3",
  transformRobot: "/assets/audio/hr/optimus-transform-robot.mp3",
  bumblebeeAssist: "/assets/audio/hr/bumblebee-tu-sam.mp3",
  citizenSaved: "/assets/audio/hr/optimus-spasen-gradanin.mp3",
  victory: "/assets/audio/hr/optimus-grad-spasen.mp3",
  retry: "/assets/audio/hr/optimus-pokusaj-opet.mp3"
};
const voiceAudioCache = {};
const missingVoiceKeys = new Set();

const anim = {
  optimusModel: null,
  truckModel: null,
  bumblebeeModel: null,
  optimusMixer: null,
  bumblebeeMixer: null,
  optimusActions: {},
  bumblebeeActions: {}
};

function updateHUD() {
  scoreEl.textContent = String(state.score);
  savedEl.textContent = String(state.saved);
  modeEl.textContent = state.mode === "robot" ? "Robot" : "Kamion";
  soundStateEl.textContent = state.soundsEnabled ? "Uključen" : "Isključen";
}

function setStatus(text, ok = false) {
  statusEl.textContent = text;
  statusEl.style.borderColor = ok ? "rgba(143,247,180,0.72)" : "rgba(255,255,255,0.14)";
  statusEl.style.color = ok ? "var(--ok)" : "var(--text)";
}

function tone(freq = 440, duration = 0.08, type = "sine", gainValue = 0.045) {
  if (!state.soundsEnabled || !audioState.unlocked || !audioState.ctx) {
    return;
  }

  const ctx = audioState.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainValue;

  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

function unlockAudio() {
  if (audioState.unlocked) {
    return;
  }

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      audioState.unlocked = true;
      return;
    }
    audioState.ctx = new AudioCtx();
    audioState.unlocked = true;
    tone(520, 0.07, "triangle", 0.03);
  } catch {
    audioState.unlocked = true;
  }
}

function playVoiceClip(key) {
  if (!state.soundsEnabled || !audioState.unlocked || !voiceClips[key] || missingVoiceKeys.has(key)) {
    return false;
  }
  try {
    if (!voiceAudioCache[key]) {
      const clip = new Audio(voiceClips[key]);
      clip.preload = "auto";
      clip.volume = 0.9;
      clip.addEventListener("error", () => {
        missingVoiceKeys.add(key);
      });
      voiceAudioCache[key] = clip;
    }

    const clip = voiceAudioCache[key];
    clip.currentTime = 0;
    clip.play().catch(() => {});
    return true;
  } catch {
    missingVoiceKeys.add(key);
    return false;
  }
}

function speakHr(text) {
  if (!state.soundsEnabled || !state.speechUnlocked || !window.speechSynthesis) {
    return;
  }

  const now = performance.now();
  if (now - state.lastVoiceAt < 900) {
    return;
  }
  state.lastVoiceAt = now;

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

function playVoice(key, fallbackText) {
  const played = playVoiceClip(key);
  if (!played && fallbackText) {
    speakHr(fallbackText);
  }
}

function unlockSpeech() {
  state.speechUnlocked = true;
  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
  }
}

function castShadowRecursive(obj) {
  obj.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = true;
      n.receiveShadow = true;
      if (n.material) {
        n.material.envMapIntensity = 1.1;
      }
    }
  });
}

function recolorOptimus(model) {
  const colors = [0xd92d2d, 0x1f4eb8, 0xd0d6de, 0x1a2030];
  let i = 0;
  model.traverse((n) => {
    if (!n.isMesh || !n.material) {
      return;
    }
    n.material = n.material.clone();
    n.material.color = new THREE.Color(colors[i % colors.length]);
    n.material.metalness = 0.6;
    n.material.roughness = 0.38;
    i += 1;
  });
}

function recolorBumblebee(model) {
  const colors = [0xffd13d, 0x1f1f24, 0xcbd4db, 0xf0c814];
  let i = 0;
  model.traverse((n) => {
    if (!n.isMesh || !n.material) {
      return;
    }
    n.material = n.material.clone();
    n.material.color = new THREE.Color(colors[i % colors.length]);
    n.material.metalness = 0.55;
    n.material.roughness = 0.42;
    i += 1;
  });
}

function recolorTruck(model) {
  const colors = [0xd92d2d, 0x1f4eb8, 0xd2d7dd];
  let i = 0;
  model.traverse((n) => {
    if (!n.isMesh || !n.material) {
      return;
    }
    n.material = n.material.clone();
    n.material.color = new THREE.Color(colors[i % colors.length]);
    n.material.metalness = 0.7;
    n.material.roughness = 0.35;
    i += 1;
  });
}

function activateAction(actionMap, clipName, fade = 0.2) {
  Object.values(actionMap).forEach((action) => {
    action.fadeOut(fade);
  });

  const target = actionMap[clipName];
  if (target) {
    target.reset().fadeIn(fade).play();
  }
}

async function addEnvironmentMap() {
  try {
    const hdr = await new RGBELoader().loadAsync(modelUrls.hdr);
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdr;
  } catch {
    // fallback lighting only
  }
}

async function loadModels() {
  const robotGltf = await loader.loadAsync(modelUrls.robot);
  const truckGltf = await loader.loadAsync(modelUrls.truck);

  const optimus = clone(robotGltf.scene);
  recolorOptimus(optimus);
  castShadowRecursive(optimus);
  optimus.scale.setScalar(0.47);
  optimus.position.y = 0.02;

  const truck = truckGltf.scene;
  recolorTruck(truck);
  castShadowRecursive(truck);
  truck.scale.setScalar(2.15);
  truck.rotation.y = Math.PI;
  truck.position.set(0, 0.03, 0);
  truck.visible = false;

  const bumblebee = clone(robotGltf.scene);
  recolorBumblebee(bumblebee);
  castShadowRecursive(bumblebee);
  bumblebee.scale.setScalar(0.39);
  bumblebee.position.y = 0.02;

  heroRoot.add(optimus);
  heroRoot.add(truck);
  bumblebeeRoot.add(bumblebee);

  const optimusMixer = new THREE.AnimationMixer(optimus);
  const bumblebeeMixer = new THREE.AnimationMixer(bumblebee);

  const optimusActions = {};
  const bumblebeeActions = {};

  for (const clip of robotGltf.animations) {
    optimusActions[clip.name] = optimusMixer.clipAction(clip);
    bumblebeeActions[clip.name] = bumblebeeMixer.clipAction(clip);
  }

  anim.optimusModel = optimus;
  anim.truckModel = truck;
  anim.bumblebeeModel = bumblebee;
  anim.optimusMixer = optimusMixer;
  anim.bumblebeeMixer = bumblebeeMixer;
  anim.optimusActions = optimusActions;
  anim.bumblebeeActions = bumblebeeActions;

  activateAction(anim.optimusActions, "Running", 0.2);
  activateAction(anim.bumblebeeActions, "Walking", 0.25);
}

function buildFallbackRobot(primary = 0xd92d2d, secondary = 0x1f4eb8) {
  const g = new THREE.Group();
  const matA = new THREE.MeshStandardMaterial({ color: primary, metalness: 0.55, roughness: 0.4 });
  const matB = new THREE.MeshStandardMaterial({ color: secondary, metalness: 0.55, roughness: 0.45 });
  const matC = new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.75, roughness: 0.28 });

  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1), matA);
  chest.position.y = 2.8;
  g.add(chest);

  const hips = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), matC);
  hips.position.y = 1.8;
  g.add(hips);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.6, 0.6), matB);
  head.position.y = 3.9;
  g.add(head);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.56), matC);
  legL.position.set(-0.34, 0.78, 0);
  g.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.34;
  g.add(legR);

  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.82), matB);
  footL.position.set(-0.34, 0.05, 0.12);
  g.add(footL);
  const footR = footL.clone();
  footR.position.x = 0.34;
  g.add(footR);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.25, 0.48), matA);
  armL.position.set(-1.18, 2.7, 0);
  g.add(armL);
  const armR = armL.clone();
  armR.position.x = 1.18;
  g.add(armR);

  castShadowRecursive(g);
  return g;
}

function buildFallbackTruck() {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xd92d2d, metalness: 0.6, roughness: 0.35 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x1f4eb8, metalness: 0.6, roughness: 0.38 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.85 });

  const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.9, 6.5), blue);
  trailer.position.set(0, 1.3, -1.9);
  g.add(trailer);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.4, 2.6), red);
  cab.position.set(0, 1.6, 2.2);
  g.add(cab);

  const wheelZ = [2.9, 1.1, -1.1, -3.1];
  for (const z of wheelZ) {
    for (const x of [-1.45, 1.45]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.52, 18), dark);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.48, z);
      g.add(w);
    }
  }

  g.scale.setScalar(0.67);
  castShadowRecursive(g);
  return g;
}

function useFallbackModels() {
  const optimus = buildFallbackRobot(0xd92d2d, 0x1f4eb8);
  const truck = buildFallbackTruck();
  const bumblebee = buildFallbackRobot(0xffd13d, 0x222222);

  truck.visible = false;
  bumblebee.scale.setScalar(0.85);

  heroRoot.add(optimus);
  heroRoot.add(truck);
  bumblebeeRoot.add(bumblebee);

  anim.optimusModel = optimus;
  anim.truckModel = truck;
  anim.bumblebeeModel = bumblebee;
  anim.optimusMixer = null;
  anim.bumblebeeMixer = null;
  anim.optimusActions = {};
  anim.bumblebeeActions = {};
}

function spawnObstacle(zPos) {
  const type = Math.random();
  let mesh;

  if (type < 0.35) {
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.8, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xa67a4d, roughness: 0.82 })
    );
    mesh.position.y = 0.9;
  } else if (type < 0.7) {
    mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({ color: 0x8b9eae, roughness: 0.75 })
    );
    mesh.position.y = 1.05;
  } else {
    mesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 1.85, 8),
      new THREE.MeshStandardMaterial({ color: 0xf19744, roughness: 0.72 })
    );
    mesh.position.y = 0.96;
  }

  mesh.position.x = THREE.MathUtils.randFloat(-3.8, 3.8);
  mesh.position.z = zPos;
  mesh.userData = {
    radius: 1.2,
    baseY: mesh.position.y,
    cleared: false,
    remove: false
  };
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  obstacleGroup.add(mesh);
  obstacles.push(mesh);
}

function spawnCitizen(zPos) {
  const g = new THREE.Group();
  const colors = [0x7ed6df, 0xffbe76, 0xf5a5c1, 0x95afc0];
  const bodyMat = new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)], roughness: 0.78 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.6, 4, 8), bodyMat);
  body.position.y = 0.86;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd8b5, roughness: 0.78 })
  );
  head.position.y = 1.62;
  g.add(head);

  g.position.set(THREE.MathUtils.randFloat(-3.5, 3.5), 0, zPos);
  g.userData = { saved: false };
  castShadowRecursive(g);

  citizenGroup.add(g);
  citizens.push(g);
}

function burst(position, color = 0xfff08a) {
  for (let i = 0; i < 12; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ color, transparent: true, opacity: 0.95 }));
    sprite.position.copy(position);
    sprite.position.x += THREE.MathUtils.randFloatSpread(1.4);
    sprite.position.y += THREE.MathUtils.randFloat(0.4, 1.7);
    sprite.position.z += THREE.MathUtils.randFloatSpread(1.4);
    sprite.scale.setScalar(0.35 + Math.random() * 0.45);
    sprite.userData = {
      v: new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.05),
        THREE.MathUtils.randFloat(0.02, 0.06),
        THREE.MathUtils.randFloatSpread(0.05)
      ),
      life: 50 + Math.random() * 16
    };
    particles.push(sprite);
    particleGroup.add(sprite);
  }
}

function clearLevel() {
  obstacles.forEach((o) => obstacleGroup.remove(o));
  citizens.forEach((c) => citizenGroup.remove(c));
  particles.forEach((p) => particleGroup.remove(p));
  obstacles.length = 0;
  citizens.length = 0;
  particles.length = 0;
}

function populateLevel() {
  clearLevel();
  for (let i = 0; i < 22; i++) {
    spawnObstacle(-20 - i * THREE.MathUtils.randFloat(10, 14));
  }
  for (let i = 0; i < state.targetSaved; i++) {
    spawnCitizen(-34 - i * 18);
  }
}

function setMode(mode) {
  state.mode = mode;
  if (anim.optimusModel && anim.truckModel) {
    anim.optimusModel.visible = mode === "robot";
    anim.truckModel.visible = mode === "truck";
  }

  if (mode === "robot") {
    activateAction(anim.optimusActions, "Running", 0.15);
  } else {
    Object.values(anim.optimusActions).forEach((a) => a.fadeOut(0.15));
  }

  updateHUD();
}

function toggleTransform() {
  if (!state.modelsReady || state.ended || state.transformCooldown > 0) {
    return;
  }

  if (!state.started) {
    startMission();
  }

  state.transformCooldown = 0.7;
  const next = state.mode === "robot" ? "truck" : "robot";
  setMode(next);

  if (next === "truck") {
    setStatus("Transformacija: Optimus je sada kamion.");
    playVoice("transformTruck", "Transformiram se u kamion.");
    tone(330, 0.09, "square", 0.03);
  } else {
    setStatus("Transformacija: Optimus je sada robot.");
    playVoice("transformRobot", "Vraćam se u robotski način.");
    tone(620, 0.09, "triangle", 0.03);
  }

  burst(heroRoot.position.clone().add(new THREE.Vector3(0, 2.1, 0)), 0x8fd9ff);
}

function startMission() {
  if (state.started || state.ended) {
    return;
  }
  unlockAudio();
  unlockSpeech();
  state.started = true;
  setStatus("Misija je krenula. Vodi Optimusa kroz grad.");
  playVoice("missionStart", "Krećemo. Bumblebee, prati me.");
  tone(520, 0.08, "triangle", 0.03);
}

function resetGame() {
  populateLevel();
  heroRoot.position.set(0, 0, 8);
  bumblebeeRoot.position.set(-3.3, 0, 10.8);

  state.started = false;
  state.ended = false;
  state.score = 0;
  state.saved = 0;
  state.leftDown = false;
  state.rightDown = false;
  state.laneTarget = 0;
  state.transformCooldown = 0;
  state.lastVoiceAt = 0;
  state.bumblebeeVoiceAt = 0;

  setMode("robot");
  updateHUD();
  setStatus(state.modelsReady ? "Dodirni ekran za početak misije" : "Učitavanje 3D modela...");
  restartBtn.classList.add("hidden");
}

function endGame(win) {
  state.ended = true;
  restartBtn.classList.remove("hidden");

  if (win) {
    setStatus("Bravo! Grad je spašen.", true);
    playVoice("victory", "Odlično. Grad je spašen.");
    tone(780, 0.15, "triangle", 0.04);
  } else {
    setStatus("Sudar. Pokušaj ponovno.");
    playVoice("retry", "Pokušaj ponovno. Uspjet ćemo.");
    tone(180, 0.12, "sawtooth", 0.03);
  }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function tryClearObstacle(clientX, clientY) {
  const x = (clientX / window.innerWidth) * 2 - 1;
  const y = -(clientY / window.innerHeight) * 2 + 1;
  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(obstacles, false);
  if (hits.length === 0) {
    return;
  }

  const obstacle = hits[0].object;
  if (obstacle.userData.cleared) {
    return;
  }

  obstacle.userData.cleared = true;
  state.score += 12;
  updateHUD();
  burst(obstacle.position.clone(), 0xffef97);
  tone(640, 0.06, "square", 0.025);
}

function bindMoveButton(button, dir) {
  const setDown = (isDown) => {
    if (dir === "left") {
      state.leftDown = isDown;
    } else {
      state.rightDown = isDown;
    }
  };

  const onDown = (event) => {
    event.preventDefault();
    startMission();
    setDown(true);
    state.laneTarget += dir === "left" ? -0.95 : 0.95;
    state.laneTarget = THREE.MathUtils.clamp(state.laneTarget, -4.9, 4.9);
  };

  const onUp = (event) => {
    event.preventDefault();
    setDown(false);
  };

  ["pointerdown", "touchstart", "mousedown"].forEach((evt) => {
    button.addEventListener(evt, onDown, { passive: false });
  });
  ["pointerup", "pointercancel", "pointerleave", "touchend", "touchcancel", "mouseup"].forEach((evt) => {
    button.addEventListener(evt, onUp, { passive: false });
  });
}

bindMoveButton(leftBtn, "left");
bindMoveButton(rightBtn, "right");

["click", "touchend", "pointerup"].forEach((evt) => {
  transformBtn.addEventListener(evt, (event) => {
    event.preventDefault();
    startMission();
    toggleTransform();
  }, { passive: false });
});

soundBtn.addEventListener("click", (event) => {
  event.preventDefault();
  unlockAudio();
  unlockSpeech();
  state.soundsEnabled = !state.soundsEnabled;
  updateHUD();
  if (state.soundsEnabled) {
    tone(590, 0.07, "triangle", 0.03);
    setStatus("Zvuk je uključen.");
  } else {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
    }
    setStatus("Zvuk je isključen.");
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    startMission();
    state.leftDown = true;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    startMission();
    state.rightDown = true;
  }
  if (event.key.toLowerCase() === "t") {
    startMission();
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

window.addEventListener("pointerdown", (event) => {
  if (event.target.closest("#controls") || event.target.closest("#utilityButtons") || event.target === restartBtn) {
    return;
  }

  unlockAudio();
  unlockSpeech();
  startMission();

  controlState.swipeId = event.pointerId;
  controlState.swipeStartX = event.clientX;
  tryClearObstacle(event.clientX, event.clientY);
});

window.addEventListener("pointermove", (event) => {
  if (controlState.swipeId !== event.pointerId || state.ended) {
    return;
  }

  const dx = event.clientX - controlState.swipeStartX;
  if (Math.abs(dx) > 30) {
    state.laneTarget += dx > 0 ? 0.9 : -0.9;
    state.laneTarget = THREE.MathUtils.clamp(state.laneTarget, -4.9, 4.9);
    controlState.swipeStartX = event.clientX;
  }
});

window.addEventListener("pointerup", (event) => {
  if (controlState.swipeId === event.pointerId) {
    controlState.swipeId = null;
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animateClouds(time) {
  clouds.children.forEach((cloud, idx) => {
    cloud.position.x += Math.sin(time * 0.1 + idx) * 0.003;
  });
}

function animateTraffic() {
  trafficGroup.children.forEach((car) => {
    car.position.z += car.userData.speed;
    if (car.position.z > heroRoot.position.z + 28) {
      car.position.z = heroRoot.position.z - 320 - Math.random() * 80;
    }
    car.position.x += (car.userData.laneX - car.position.x) * 0.05;
  });
}

function animateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.add(p.userData.v);
    p.userData.life -= 1;
    p.material.opacity = Math.max(0, p.userData.life / 65);
    if (p.userData.life <= 0) {
      particleGroup.remove(p);
      particles.splice(i, 1);
    }
  }
}

function animateGame(dt, time) {
  if (!state.started || state.ended || !state.modelsReady) {
    return;
  }

  if (state.transformCooldown > 0) {
    state.transformCooldown = Math.max(0, state.transformCooldown - dt);
  }

  const steerSpeed = state.mode === "robot" ? 5 : 6.2;
  if (state.leftDown) {
    state.laneTarget -= steerSpeed * dt;
  }
  if (state.rightDown) {
    state.laneTarget += steerSpeed * dt;
  }
  state.laneTarget = THREE.MathUtils.clamp(state.laneTarget, -4.9, 4.9);

  const speed = state.mode === "robot" ? state.speedRobot : state.speedTruck;
  heroRoot.position.z -= speed;
  heroRoot.position.x += (state.laneTarget - heroRoot.position.x) * 0.16;

  if (anim.truckModel && state.mode === "truck") {
    anim.truckModel.position.y = 0.03 + Math.sin(time * 20) * 0.028;
  }
  if (!anim.optimusMixer && anim.optimusModel && state.mode === "robot") {
    anim.optimusModel.position.y = 0.02 + Math.abs(Math.sin(time * 10)) * 0.08;
    anim.optimusModel.rotation.y = Math.sin(time * 4) * 0.06;
  }

  const bTargetX = heroRoot.position.x - 3.2;
  const bTargetZ = heroRoot.position.z + 2.7;
  bumblebeeRoot.position.x += (bTargetX - bumblebeeRoot.position.x) * 0.1;
  bumblebeeRoot.position.z += (bTargetZ - bumblebeeRoot.position.z) * 0.1;

  if (anim.bumblebeeActions.Walking) {
    anim.bumblebeeActions.Walking.setEffectiveTimeScale(1.1 + speed * 0.7);
  }
  if (!anim.bumblebeeMixer && anim.bumblebeeModel) {
    anim.bumblebeeModel.position.y = 0.02 + Math.abs(Math.sin(time * 11)) * 0.08;
    anim.bumblebeeModel.rotation.y = Math.sin(time * 5) * 0.08;
  }

  if (time - state.bumblebeeVoiceAt > 11) {
    state.bumblebeeVoiceAt = time;
    playVoice("bumblebeeAssist", "Bumblebee: Tu sam, Optimuse.");
  }

  const collisionRadius = state.mode === "robot" ? 0.82 : 1.02;

  for (const obs of obstacles) {
    if (obs.userData.cleared) {
      obs.rotation.x += dt * 5.5;
      obs.rotation.y += dt * 4.3;
      obs.position.y += dt * 6.4;
      obs.material.transparent = true;
      obs.material.opacity = Math.max(0, (obs.material.opacity ?? 1) - dt * 2.15);
      if (obs.position.y > 8) {
        obs.userData.remove = true;
        obstacleGroup.remove(obs);
      }
      continue;
    }

    obs.position.y = obs.userData.baseY + Math.sin(time * 2.7 + obs.position.z * 0.4) * 0.08;

    const dz = Math.abs(obs.position.z - heroRoot.position.z);
    const dx = Math.abs(obs.position.x - heroRoot.position.x);
    if (dz < collisionRadius + obs.userData.radius && dx < 1.45) {
      endGame(false);
      break;
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].userData.remove) {
      obstacles.splice(i, 1);
    }
  }

  for (const citizen of citizens) {
    if (citizen.userData.saved) {
      citizen.position.y = Math.sin(time * 8) * 0.08;
      continue;
    }

    const dz = Math.abs(citizen.position.z - heroRoot.position.z);
    const dx = Math.abs(citizen.position.x - heroRoot.position.x);
    if (dz < 1.9 && dx < 2.1) {
      citizen.userData.saved = true;
      state.saved += 1;
      state.score += 30;
      updateHUD();
      burst(citizen.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0x8ff5c0);
      tone(710, 0.08, "triangle", 0.03);
      playVoice("citizenSaved", "Građanin je spašen.");

      if (state.saved >= state.targetSaved) {
        endGame(true);
      }
    }
  }

  const camX = heroRoot.position.x * 0.44;
  const camY = state.mode === "robot" ? 8.1 : 7.2;
  const camZ = heroRoot.position.z + (state.mode === "robot" ? 16 : 14.4);
  const shake = state.mode === "truck" ? 0.06 : 0.03;
  camera.position.x += (camX - camera.position.x) * 0.07 + Math.sin(time * 18) * shake * 0.02;
  camera.position.y += (camY - camera.position.y) * 0.07 + Math.sin(time * 15) * shake * 0.015;
  camera.position.z += (camZ - camera.position.z) * 0.08;
}

function render() {
  const dt = Math.min(clock.getDelta(), 0.033);
  const time = performance.now() * 0.001;

  if (anim.optimusMixer) {
    anim.optimusMixer.update(dt);
    if (anim.optimusActions.Running) {
      anim.optimusActions.Running.setEffectiveTimeScale(1 + (state.mode === "robot" ? 0.5 : 0));
    }
  }
  if (anim.bumblebeeMixer) {
    anim.bumblebeeMixer.update(dt);
  }

  animateClouds(time);
  animateTraffic();
  animateGame(dt, time);
  animateParticles();
  renderer.toneMappingExposure = 1.15 + Math.sin(time * 0.08) * 0.04;

  camera.lookAt(heroRoot.position.x, 2.8, heroRoot.position.z - 8.8);
  composer.render();
  requestAnimationFrame(render);
}

async function init() {
  updateHUD();
  resetGame();

  await Promise.allSettled([addEnvironmentMap(), loadModels()]);

  if (!anim.optimusModel || !anim.truckModel || !anim.bumblebeeModel) {
    useFallbackModels();
    setStatus("Neki modeli nisu učitani, uključena je lokalna 3D zamjena.");
  }

  state.modelsReady = true;
  if (statusEl.textContent.includes("zamjena")) {
    setTimeout(() => {
      setStatus("Dodirni ekran za početak misije");
    }, 1500);
  } else {
    setStatus("Dodirni ekran za početak misije");
  }
  render();
}

init();
