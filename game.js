import * as THREE from "https://esm.sh/three@0.164.1";
import { GLTFLoader } from "https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader";
import { clone } from "https://esm.sh/three@0.164.1/examples/jsm/utils/SkeletonUtils";
import { EffectComposer } from "https://esm.sh/three@0.164.1/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "https://esm.sh/three@0.164.1/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "https://esm.sh/three@0.164.1/examples/jsm/postprocessing/UnrealBloomPass";

const repValue = document.getElementById("repValue");
const missionValue = document.getElementById("missionValue");
const activeIssue = document.getElementById("activeIssue");
const eventOverlay = document.getElementById("eventOverlay");
const loaderEl = document.getElementById("loader");
const canvas = document.getElementById("gameCanvas");

window.__jan3dReady = true;

const WORLD = 2200;
const ROAD_STEP = 210;
const ROAD_WIDTH = 54;
const HALF = WORLD / 2;
const clock = new THREE.Clock();
const keys = new Set();

const state = {
  reputation: 0,
  missions: 0,
  message: "Priprema ultra 3D grada...",
  messageUntil: 0,
  transformMode: "car",
  districtLevel: 1,
};

const issues = [
  "Masovni zastoj kod bolnice",
  "Kvar gradske rasvjete u centru",
  "Kritičan kvar semafora",
  "Hitna dostava lijekova",
  "Siguran prolaz školske djece",
  "Kvar autobusa na glavnoj ruti",
  "Opasnost za pješake na aveniji",
];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#9db7d0", 250, 1850);

const camera = new THREE.PerspectiveCamera(64, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
camera.position.set(0, 16, -30);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), 0.3, 0.6, 0.82);
composer.addPass(bloomPass);
composer.setSize(canvas.clientWidth, canvas.clientHeight);

const hemi = new THREE.HemisphereLight("#d8ecff", "#4f667a", 0.75);
scene.add(hemi);

const sun = new THREE.DirectionalLight("#ffe9c8", 1.35);
sun.position.set(-180, 240, 80);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -420;
sun.shadow.camera.right = 420;
sun.shadow.camera.top = 420;
sun.shadow.camera.bottom = -420;
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 1050;
scene.add(sun);

const bounce = new THREE.PointLight("#81c4ff", 0.55, 700, 2);
bounce.position.set(0, 65, 0);
scene.add(bounce);

function makeSky() {
  const geo = new THREE.SphereGeometry(3500, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      top: { value: new THREE.Color("#71a8d8") },
      bottom: { value: new THREE.Color("#d6eefc") },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 top;
      uniform vec3 bottom;
      void main() {
        float h = normalize(vPos).y * 0.5 + 0.5;
        vec3 c = mix(bottom, top, smoothstep(0.0, 1.0, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(geo, mat));
}

makeSky();

function makeNoiseTexture(size, baseColor, accentColor, density = 0.12) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * size * density; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = Math.random() * 0.22;
    ctx.fillStyle = `${accentColor}${Math.floor(alpha * 255)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const grassTexture = makeNoiseTexture(256, "#829f69", "#4f713f", 0.2);
grassTexture.repeat.set(40, 40);

const asphaltTexture = makeNoiseTexture(256, "#2a3039", "#49515f", 0.28);
asphaltTexture.repeat.set(22, 22);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD, WORLD),
  new THREE.MeshStandardMaterial({
    color: "#7d9966",
    map: grassTexture,
    roughness: 0.98,
    metalness: 0.01,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function laneMaterial() {
  return new THREE.MeshStandardMaterial({ color: "#eadca2", roughness: 0.3, metalness: 0.03 });
}

function addRoad(x, z, w, d) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(w, 1.2, d),
    new THREE.MeshPhysicalMaterial({
      color: "#252c34",
      map: asphaltTexture,
      roughness: 0.74,
      metalness: 0.1,
      clearcoat: 0.42,
      clearcoatRoughness: 0.6,
    })
  );
  road.position.set(x, 0.6, z);
  road.receiveShadow = true;
  scene.add(road);

  const sidewalkW = w > d ? w : d;
  const horizontal = w > d;
  const curbA = new THREE.Mesh(
    new THREE.BoxGeometry(horizontal ? sidewalkW : 4.5, 1.8, horizontal ? 4.5 : sidewalkW),
    new THREE.MeshStandardMaterial({ color: "#8a929b", roughness: 0.85 })
  );
  const curbB = curbA.clone();

  if (horizontal) {
    curbA.position.set(x, 0.9, z - d / 2 - 1.5);
    curbB.position.set(x, 0.9, z + d / 2 + 1.5);
  } else {
    curbA.position.set(x - w / 2 - 1.5, 0.9, z);
    curbB.position.set(x + w / 2 + 1.5, 0.9, z);
  }
  curbA.receiveShadow = true;
  curbB.receiveShadow = true;
  scene.add(curbA, curbB);

  const dashMat = laneMaterial();
  if (horizontal) {
    for (let dx = -w / 2 + 20; dx < w / 2 - 10; dx += 24) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 1.5), dashMat);
      dash.position.set(x + dx, 1.25, z);
      scene.add(dash);
    }
  } else {
    for (let dz = -d / 2 + 20; dz < d / 2 - 10; dz += 24) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 8), dashMat);
      dash.position.set(x, 1.25, z + dz);
      scene.add(dash);
    }
  }
}

function makeStreetLight(x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 16, 10),
    new THREE.MeshStandardMaterial({ color: "#626f7d", roughness: 0.7, metalness: 0.4 })
  );
  pole.position.set(x, 8, z);
  pole.castShadow = true;
  scene.add(pole);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 10, 10),
    new THREE.MeshStandardMaterial({ color: "#f6f3c7", emissive: "#ffe6a0", emissiveIntensity: 1.2 })
  );
  lamp.position.set(x, 16.2, z);
  scene.add(lamp);

  const light = new THREE.PointLight("#ffd79f", 0.28, 95, 2);
  light.position.set(x, 16, z);
  scene.add(light);
}

function makeCity() {
  const span = WORLD - 60;
  for (let i = -4; i <= 4; i += 1) {
    const p = i * ROAD_STEP;
    addRoad(0, p, span, ROAD_WIDTH);
    addRoad(p, 0, ROAD_WIDTH, span);
  }

  const towerMat = new THREE.MeshStandardMaterial({ color: "#798896", roughness: 0.78, metalness: 0.24 });
  for (let gx = -4; gx <= 4; gx += 1) {
    for (let gz = -4; gz <= 4; gz += 1) {
      if (gx === 0 || gz === 0) continue;
      const cx = gx * ROAD_STEP + (Math.random() - 0.5) * 42;
      const cz = gz * ROAD_STEP + (Math.random() - 0.5) * 42;
      const w = 58 + Math.random() * 65;
      const d = 58 + Math.random() * 65;
      const h = 90 + Math.random() * 280;

      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), towerMat.clone());
      body.material.color.offsetHSL((Math.random() - 0.5) * 0.07, 0.02, (Math.random() - 0.5) * 0.07);
      body.position.set(cx, h / 2 + 1, cz);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      const band = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.92, 4.4, d * 0.92),
        new THREE.MeshStandardMaterial({ color: "#b2dbff", emissive: "#3e93d0", emissiveIntensity: 0.38 })
      );
      band.position.set(0, h * (0.32 + Math.random() * 0.34), 0);
      body.add(band);

      if (Math.random() > 0.45) {
        const top = new THREE.Mesh(
          new THREE.CylinderGeometry(w * 0.16, w * 0.22, 16, 10),
          new THREE.MeshStandardMaterial({ color: "#94a0ac", roughness: 0.7, metalness: 0.3 })
        );
        top.position.set(0, h / 2 + 8, 0);
        top.castShadow = true;
        body.add(top);
      }
    }
  }

  for (let i = 0; i < 140; i += 1) {
    const x = (Math.random() - 0.5) * (WORLD - 120);
    const z = (Math.random() - 0.5) * (WORLD - 120);
    if (Math.abs((x % ROAD_STEP)) < ROAD_WIDTH || Math.abs((z % ROAD_STEP)) < ROAD_WIDTH) continue;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.3, 8, 8),
      new THREE.MeshStandardMaterial({ color: "#6a4a2f", roughness: 0.92 })
    );
    trunk.position.set(x, 4, z);
    trunk.castShadow = true;
    scene.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(4.4 + Math.random() * 2.4, 12, 12),
      new THREE.MeshStandardMaterial({ color: "#4f7c3d", roughness: 0.88 })
    );
    crown.position.set(x, 10.8, z);
    crown.castShadow = true;
    scene.add(crown);
  }

  for (let i = -4; i <= 4; i += 1) {
    for (let j = -4; j <= 4; j += 1) {
      if (i === 0 || j === 0) continue;
      if ((i + j) % 2 === 0) makeStreetLight(i * ROAD_STEP + 56, j * ROAD_STEP + 56);
    }
  }
}

makeCity();

function makeLabel(text) {
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = 90;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#06263d";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#59cbff";
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, c.width - 6, c.height - 6);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 48px Rajdhani";
  ctx.fillText(text, c.width / 2, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(14, 3.9, 1);
  return sprite;
}

function makeFallbackCar(color = "#2e9ef2") {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(6.3, 1.8, 12.4),
    new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.75 })
  );
  body.position.y = 2.6;
  body.castShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4.9, 1.6, 6.2),
    new THREE.MeshStandardMaterial({ color: "#d6e4ef", roughness: 0.2, metalness: 0.4 })
  );
  roof.position.set(0, 3.8, -0.4);
  roof.castShadow = true;
  g.add(roof);

  const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.9, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#22252c", roughness: 0.9 });
  [[-2.8, 1.2, -4.2], [2.8, 1.2, -4.2], [-2.8, 1.2, 4.2], [2.8, 1.2, 4.2]].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    g.add(w);
  });
  return g;
}

function makeFallbackRobot(color = "#32c6ff") {
  const g = new THREE.Group();
  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 5.4, 2.3),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.84 })
  );
  chest.position.y = 4.5;
  chest.castShadow = true;
  g.add(chest);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.8, 1.8),
    new THREE.MeshStandardMaterial({ color: "#f1f7ff", roughness: 0.3, metalness: 0.55 })
  );
  head.position.set(0, 8.2, 0);
  head.castShadow = true;
  g.add(head);

  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 3.6, 1.8),
    new THREE.MeshStandardMaterial({ color: "#19415e", roughness: 0.4, metalness: 0.75 })
  );
  legs.position.set(0, 1.8, 0);
  legs.castShadow = true;
  g.add(legs);
  return g;
}

const player = {
  root: new THREE.Group(),
  carMesh: makeFallbackCar("#248ee0"),
  robotMesh: makeFallbackRobot("#3bcfff"),
  mode: "car",
  speed: 0,
  heading: 0,
  maxForward: 120,
  maxReverse: -45,
  acceleration: 64,
  brake: 105,
  drag: 31,
  steer: 2.05,
  walkSpeed: 30,
  transformCooldown: 0,
};
player.root.position.set(0, 0, 0);
player.root.add(player.carMesh, player.robotMesh);
player.robotMesh.visible = false;
scene.add(player.root);

const janLabel = makeLabel("JAN");
janLabel.position.set(0, 10.8, 0);
player.root.add(janLabel);

const loader = new GLTFLoader();
let carModelTemplate = null;
let robotModelTemplate = null;
let citizenTemplate = null;

function loadModel(url, timeoutMs = 4500) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error(`Timeout: ${url}`));
    }, timeoutMs);

    loader.load(
      url,
      (gltf) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        resolve(gltf);
      },
      undefined,
      (err) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        reject(err);
      }
    );
  });
}

function tuneModel(obj) {
  obj.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      if (c.material?.map) c.material.map.anisotropy = 8;
    }
  });
}

function randomStreetPoint() {
  const lane = (-4 + Math.floor(Math.random() * 9)) * ROAD_STEP;
  const along = -HALF + Math.random() * WORLD;
  if (Math.random() > 0.5) return new THREE.Vector3(lane + (Math.random() - 0.5) * 18, 0, along);
  return new THREE.Vector3(along, 0, lane + (Math.random() - 0.5) * 18);
}

function makeCitizenFallback() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.25, 3.2, 8, 14),
    new THREE.MeshStandardMaterial({ color: "#efccab", roughness: 0.65 })
  );
  body.position.y = 3;
  body.castShadow = true;
  g.add(body);
  return g;
}

const citizens = [];
const incidents = [];

const incidentDefs = [
  { kind: "traffic", label: "Raščisti prometni kolaps", reward: 20, needMode: "car", color: "#ffb34d", radius: 16 },
  { kind: "grid", label: "Stabiliziraj energetsku mrežu", reward: 24, needMode: "robot", color: "#66c7ff", radius: 14 },
  { kind: "medical", label: "Hitna zona treba koridor", reward: 22, needMode: "any", color: "#ff5f7c", radius: 15 },
];

function spawnCitizen() {
  const root = citizenTemplate ? clone(citizenTemplate) : makeCitizenFallback();
  if (citizenTemplate) root.scale.setScalar(2.3);
  tuneModel(root);

  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(5.2, 0.52, 14, 48),
    new THREE.MeshBasicMaterial({ color: "#ff4f4f", transparent: true, opacity: 0.92 })
  );
  marker.rotation.x = Math.PI / 2;
  marker.position.y = 0.75;
  root.add(marker);

  root.position.copy(randomStreetPoint());
  scene.add(root);

  citizens.push({
    root,
    marker,
    issue: issues[Math.floor(Math.random() * issues.length)],
    solved: false,
    pulse: Math.random() * Math.PI * 2,
  });
}

function spawnIncident() {
  const def = incidentDefs[Math.floor(Math.random() * incidentDefs.length)];
  const root = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 2.6, 6, 10),
    new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.color,
      emissiveIntensity: 0.5,
      roughness: 0.35,
      metalness: 0.45,
    })
  );
  core.position.y = 3.2;
  core.castShadow = true;
  root.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(def.radius, 0.55, 14, 48),
    new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.78 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.7;
  root.add(ring);

  root.position.copy(randomStreetPoint());
  scene.add(root);

  incidents.push({
    root,
    core,
    ring,
    issue: def.label,
    reward: def.reward,
    needMode: def.needMode,
    solved: false,
    pulse: Math.random() * Math.PI * 2,
  });
}

function makeBot(colorCar, colorRobot) {
  const root = new THREE.Group();
  const car = makeFallbackCar(colorCar);
  const robot = makeFallbackRobot(colorRobot);
  robot.visible = false;
  root.add(car, robot);
  scene.add(root);
  return {
    root,
    car,
    robot,
    speed: 0,
    heading: 0,
  };
}

const bots = [makeBot("#f59f44", "#f1a640"), makeBot("#74e48d", "#66d984")];

function msg(text, duration = 2300) {
  state.message = text;
  state.messageUntil = performance.now() + duration;
}

function nearestCitizen() {
  let nearest = null;
  let dist = Infinity;
  for (const c of citizens) {
    if (c.solved) continue;
    const d = c.root.position.distanceTo(player.root.position);
    if (d < dist) {
      dist = d;
      nearest = c;
    }
  }
  return { nearest, dist };
}

function nearestIncident() {
  let nearest = null;
  let dist = Infinity;
  for (const inc of incidents) {
    if (inc.solved) continue;
    const d = inc.root.position.distanceTo(player.root.position);
    if (d < dist) {
      dist = d;
      nearest = inc;
    }
  }
  return { nearest, dist };
}

function nearestObjective() {
  const c = nearestCitizen();
  const i = nearestIncident();
  if (i.nearest && (!c.nearest || i.dist < c.dist)) {
    return { type: "incident", item: i.nearest, dist: i.dist };
  }
  if (c.nearest) return { type: "citizen", item: c.nearest, dist: c.dist };
  return { type: "none", item: null, dist: Infinity };
}

function solveIssue() {
  const target = nearestObjective();
  if (!target.item) {
    msg("Nema aktivnih ciljeva u blizini.", 1600);
    return;
  }

  if (target.type === "incident") {
    const inc = target.item;
    if (target.dist > inc.ring.geometry.parameters.radius + 2) {
      msg("Priđi incident zoni i pritisni E.", 1700);
      return;
    }
    if (inc.needMode !== "any" && player.mode !== inc.needMode) {
      msg(`Za ovu misiju prebaci u ${inc.needMode === "car" ? "AUTO" : "ROBOT"} mod (Space).`, 2100);
      return;
    }

    inc.solved = true;
    inc.root.visible = false;
    state.reputation += inc.reward;
    state.missions += 1;
    msg(`Misija riješena: ${inc.issue}`, 2300);
    setTimeout(() => {
      inc.root.position.copy(randomStreetPoint());
      inc.solved = false;
      inc.root.visible = true;
      inc.issue = incidentDefs[Math.floor(Math.random() * incidentDefs.length)].label;
    }, 2800);
    return;
  }

  const citizen = target.item;
  if (target.dist > (player.mode === "car" ? 13 : 9)) {
    msg("Priđi bliže građaninu pa pritisni E.", 1700);
    return;
  }

  citizen.solved = true;
  citizen.root.visible = false;
  state.reputation += 12;
  state.missions += 1;
  msg(`Riješeno: ${citizen.issue}`, 2400);

  setTimeout(() => {
    citizen.root.position.copy(randomStreetPoint());
    citizen.issue = issues[Math.floor(Math.random() * issues.length)];
    citizen.solved = false;
    citizen.root.visible = true;
  }, 2200);
}

function toggleTransform() {
  if (player.transformCooldown > 0) return;
  player.transformCooldown = 0.7;

  const next = player.mode === "car" ? "robot" : "car";
  player.mode = next;
  state.transformMode = next;

  player.carMesh.visible = next === "car";
  player.robotMesh.visible = next === "robot";

  bots.forEach((bot) => {
    bot.car.visible = next === "car";
    bot.robot.visible = next === "robot";
  });

  if (next === "robot") {
    player.speed = THREE.MathUtils.clamp(player.speed * 0.35, -8, 18);
    msg("TRANSFORM: Robot mode", 1500);
  } else {
    msg("TRANSFORM: Auto mode", 1500);
  }
}

const traffic = [];
function makeTraffic() {
  for (let i = 0; i < 54; i += 1) {
    const mesh = makeFallbackCar(`hsl(${(i * 23) % 360} 70% 55%)`);
    mesh.scale.setScalar(0.72);
    const horizontal = i % 2 === 0;
    const lane = (-4 + (i % 9)) * ROAD_STEP;
    if (horizontal) mesh.position.set(-HALF + (i * 63) % WORLD, 0, lane);
    else mesh.position.set(lane, 0, -HALF + (i * 87) % WORLD);
    mesh.rotation.y = horizontal ? Math.PI / 2 : 0;
    scene.add(mesh);
    traffic.push({ mesh, horizontal, speed: 32 + (i % 8) * 3.5, dir: i % 3 === 0 ? -1 : 1 });
  }
}
makeTraffic();

function updateTraffic(dt) {
  for (const t of traffic) {
    const delta = t.speed * dt * t.dir;
    if (t.horizontal) {
      t.mesh.position.x += delta;
      if (t.mesh.position.x > HALF) t.mesh.position.x = -HALF;
      if (t.mesh.position.x < -HALF) t.mesh.position.x = HALF;
      t.mesh.rotation.y = t.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      t.mesh.position.z += delta;
      if (t.mesh.position.z > HALF) t.mesh.position.z = -HALF;
      if (t.mesh.position.z < -HALF) t.mesh.position.z = HALF;
      t.mesh.rotation.y = t.dir > 0 ? 0 : Math.PI;
    }
  }
}

function updatePlayerCar(dt) {
  const throttle = Number(keys.has("w") || keys.has("arrowup"));
  const brake = Number(keys.has("s") || keys.has("arrowdown"));
  const left = Number(keys.has("a") || keys.has("arrowleft"));
  const right = Number(keys.has("d") || keys.has("arrowright"));
  const handbrake = keys.has("shift");

  if (throttle) player.speed += player.acceleration * dt;
  if (brake) player.speed -= player.brake * dt;

  if (!throttle && !brake) {
    if (player.speed > 0) player.speed = Math.max(0, player.speed - player.drag * dt);
    if (player.speed < 0) player.speed = Math.min(0, player.speed + player.drag * dt);
  }

  if (handbrake) player.speed *= 0.965;

  player.speed = THREE.MathUtils.clamp(player.speed, player.maxReverse, player.maxForward);

  const steerInput = right - left;
  if (steerInput !== 0) {
    const steerStrength = (0.2 + Math.min(Math.abs(player.speed) / player.maxForward, 1) * 0.8) * player.steer;
    const drift = handbrake ? 1.55 : 1;
    player.heading -= steerInput * steerStrength * dt * Math.sign(player.speed || 1) * drift;
  }

  player.root.rotation.y = player.heading;
  const dir = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  player.root.position.addScaledVector(dir, player.speed * dt);
}

function updatePlayerRobot(dt) {
  const fwd = Number(keys.has("w") || keys.has("arrowup")) - Number(keys.has("s") || keys.has("arrowdown"));
  const side = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));

  const move = new THREE.Vector3(side, 0, fwd);
  if (move.lengthSq() === 0) {
    player.speed *= 0.88;
    return;
  }

  move.normalize();
  const targetHeading = Math.atan2(move.x, move.z);
  player.heading = THREE.MathUtils.lerp(player.heading, targetHeading, 0.16);
  player.root.rotation.y = player.heading;

  const walk = player.walkSpeed * dt;
  player.root.position.x += move.x * walk;
  player.root.position.z += move.z * walk;
  player.speed = walk * 60;
}

function updatePlayer(dt) {
  if (player.transformCooldown > 0) player.transformCooldown -= dt;

  if (player.mode === "car") updatePlayerCar(dt);
  else updatePlayerRobot(dt);

  player.root.position.x = THREE.MathUtils.clamp(player.root.position.x, -HALF + 24, HALF - 24);
  player.root.position.z = THREE.MathUtils.clamp(player.root.position.z, -HALF + 24, HALF - 24);
}

function updateBots(dt, time) {
  bots.forEach((bot, i) => {
    const angleOffset = i === 0 ? -1.2 : 1.2;
    const forwardOffset = player.mode === "car" ? -16 : -9;
    const lateral = player.mode === "car" ? 8 : 6;

    const behind = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading)).multiplyScalar(forwardOffset);
    const side = new THREE.Vector3(Math.cos(player.heading), 0, -Math.sin(player.heading)).multiplyScalar(angleOffset * lateral);
    const orbit = new THREE.Vector3(Math.cos(time * 0.0015 + i * Math.PI) * 2.5, 0, Math.sin(time * 0.0015 + i * Math.PI) * 2.5);

    const target = player.root.position.clone().add(behind).add(side).add(orbit);
    const toTarget = target.clone().sub(bot.root.position);
    const dist = toTarget.length();

    if (dist > 0.01) {
      toTarget.normalize();
      const max = player.mode === "car" ? 70 : 35;
      bot.speed = THREE.MathUtils.lerp(bot.speed, Math.min(max, dist * 4.2), 0.08);
      bot.root.position.addScaledVector(toTarget, bot.speed * dt);
      bot.heading = Math.atan2(toTarget.x, toTarget.z);
      bot.root.rotation.y = bot.heading;
    }

    bot.root.position.x = THREE.MathUtils.clamp(bot.root.position.x, -HALF + 18, HALF - 18);
    bot.root.position.z = THREE.MathUtils.clamp(bot.root.position.z, -HALF + 18, HALF - 18);
  });
}

function updateCitizens(time) {
  citizens.forEach((c) => {
    if (c.solved) return;
    const pulse = (Math.sin(time * 0.005 + c.pulse) + 1) * 0.5;
    c.marker.scale.setScalar(0.92 + pulse * 0.55);
    c.marker.material.opacity = 0.45 + pulse * 0.5;
  });

  incidents.forEach((inc) => {
    if (inc.solved) return;
    const pulse = (Math.sin(time * 0.004 + inc.pulse) + 1) * 0.5;
    inc.ring.scale.setScalar(0.96 + pulse * 0.22);
    inc.ring.material.opacity = 0.4 + pulse * 0.45;
    inc.core.material.emissiveIntensity = 0.4 + pulse * 0.9;
    inc.core.rotation.y += 0.015;
  });
}

const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const tmpColorA = new THREE.Color();
const tmpColorB = new THREE.Color();
function updateCamera() {
  const dir = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  const side = new THREE.Vector3(Math.cos(player.heading), 0, -Math.sin(player.heading));

  if (player.mode === "car") {
    camPos.copy(player.root.position).addScaledVector(dir, -28).addScaledVector(side, 2.5).add(new THREE.Vector3(0, 13, 0));
    camLook.copy(player.root.position).addScaledVector(dir, 12).add(new THREE.Vector3(0, 4.5, 0));
  } else {
    camPos.copy(player.root.position).addScaledVector(dir, -16).addScaledVector(side, 1.5).add(new THREE.Vector3(0, 16, 0));
    camLook.copy(player.root.position).addScaledVector(dir, 9).add(new THREE.Vector3(0, 7.5, 0));
  }

  camera.position.lerp(camPos, 0.12);
  camera.lookAt(camLook);
}

function updateEnvironment(time) {
  const phase = (Math.sin(time * 0.00004) + 1) * 0.5;
  const warm = 0.6 + phase * 0.55;
  sun.intensity = 0.88 + phase * 0.8;
  sun.position.set(-180 + phase * 110, 170 + phase * 95, 70 + phase * 55);
  bounce.intensity = 0.36 + phase * 0.3;

  tmpColorA.setHSL(0.57 + phase * 0.06, 0.45, 0.66 + phase * 0.12);
  tmpColorB.setHSL(0.58 + phase * 0.03, 0.22, 0.42 + phase * 0.16);
  scene.fog.color.copy(tmpColorB);
  renderer.setClearColor(tmpColorA, 1);

  bloomPass.strength = 0.22 + phase * 0.28 * warm;
}

function updateUI(time) {
  repValue.textContent = String(state.reputation);
  missionValue.textContent = String(state.missions);
  state.districtLevel = Math.max(1, Math.floor(state.missions / 6) + 1);

  const target = nearestObjective();
  activeIssue.textContent = target.item ? target.item.issue : "Nema aktivnih problema";

  if (time > state.messageUntil) {
    state.message = target.item ? `Cilj: ${target.item.issue}` : "Grad je stabilan, nastavi patrolu.";
  }

  const speed = Math.max(0, Math.round(Math.abs(player.speed)));
  eventOverlay.textContent = `${state.message} | Zona Lv.${state.districtLevel} | MODE: ${state.transformMode.toUpperCase()} | ${speed} km/h`;
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  keys.add(key);
  if (key === "e") solveIssue();
  if (key === " ") {
    e.preventDefault();
    toggleTransform();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

window.addEventListener("resize", () => {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  composer.setSize(canvas.clientWidth, canvas.clientHeight);
  bloomPass.setSize(canvas.clientWidth, canvas.clientHeight);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
});

let started = false;
function startGame() {
  if (started) return;
  started = true;
  loaderEl.classList.add("hidden");
  msg("JAN i Autoboti spremni. SPACE za transformaciju svih.", 2800);
  requestAnimationFrame(loop);
}

function loop() {
  const dt = Math.min(0.033, clock.getDelta());
  const time = performance.now();

  updatePlayer(dt);
  updateBots(dt, time);
  updateTraffic(dt);
  updateCitizens(time);
  updateEnvironment(time);
  updateCamera();
  updateUI(time);

  composer.render();
  requestAnimationFrame(loop);
}

async function loadVisualModels() {
  const [carRes, robotRes, citizenRes] = await Promise.allSettled([
    loadModel("https://threejs.org/examples/models/gltf/ferrari.glb"),
    loadModel("https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb"),
    loadModel("https://threejs.org/examples/models/gltf/Soldier.glb"),
  ]);

  if (carRes.status === "fulfilled") {
    carModelTemplate = carRes.value.scene;
    tuneModel(carModelTemplate);

    player.carMesh.visible = false;
    const pCar = clone(carModelTemplate);
    pCar.scale.set(0.03, 0.03, 0.03);
    pCar.rotation.y = Math.PI;
    pCar.position.y = 0.8;
    tuneModel(pCar);
    player.carMesh.add(pCar);

    bots.forEach((b, i) => {
      b.car.visible = false;
      const c = clone(carModelTemplate);
      c.scale.set(0.027, 0.027, 0.027);
      c.rotation.y = Math.PI;
      c.position.y = 0.8;
      tuneModel(c);
      c.traverse((obj) => {
        if (obj.isMesh && obj.material?.color) {
          obj.material = obj.material.clone();
          obj.material.color.offsetHSL(i === 0 ? 0.05 : -0.2, 0.05, 0.02);
        }
      });
      b.car.add(c);
    });
  } else {
    msg("Neki auto modeli nisu učitani, aktivan je fallback.", 2100);
  }

  if (robotRes.status === "fulfilled") {
    robotModelTemplate = robotRes.value.scene;
    tuneModel(robotModelTemplate);

    player.robotMesh.visible = false;
    const pRobot = clone(robotModelTemplate);
    pRobot.scale.setScalar(1.9);
    tuneModel(pRobot);
    player.robotMesh.add(pRobot);

    bots.forEach((b, i) => {
      b.robot.visible = false;
      const r = clone(robotModelTemplate);
      r.scale.setScalar(1.65);
      tuneModel(r);
      r.traverse((obj) => {
        if (obj.isMesh && obj.material?.color) {
          obj.material = obj.material.clone();
          obj.material.color.offsetHSL(i === 0 ? 0.07 : 0.28, 0.1, 0.02);
        }
      });
      b.robot.add(r);
    });
  } else {
    msg("Robot modeli nisu učitani, fallback je aktivan.", 2100);
  }

  if (citizenRes.status === "fulfilled") {
    citizenTemplate = citizenRes.value.scene;
    tuneModel(citizenTemplate);
  }
}

async function init() {
  try {
    await loadVisualModels();
  } catch (_err) {
    msg("Dio modela nije dostupan. Pokrećem fallback prikaz.", 2500);
  }

  for (let i = 0; i < 14; i += 1) spawnCitizen();
  for (let i = 0; i < 8; i += 1) spawnIncident();
  startGame();
}

setTimeout(() => {
  if (started) return;
  msg("Modeli kasne. Start s fallback prikazom.", 2500);
  if (!citizens.length) for (let i = 0; i < 10; i += 1) spawnCitizen();
  if (!incidents.length) for (let i = 0; i < 5; i += 1) spawnIncident();
  startGame();
}, 7000);

init();
