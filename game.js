import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

const app = document.getElementById("app");
const scoreEl = document.getElementById("score");
const savedEl = document.getElementById("saved");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x9edfff, 35, 160);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 380);
camera.position.set(0, 8, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xdaf6ff, 0x4f646f, 0.95);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff6db, 1.3);
sun.position.set(14, 24, 10);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 80;
sun.shadow.camera.left = -24;
sun.shadow.camera.right = 24;
sun.shadow.camera.top = 24;
sun.shadow.camera.bottom = -24;
scene.add(sun);

const roadGroup = new THREE.Group();
scene.add(roadGroup);

const asphalt = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 260),
  new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.92 })
);
asphalt.rotation.x = -Math.PI / 2;
asphalt.position.z = -78;
asphalt.receiveShadow = true;
roadGroup.add(asphalt);

const laneLineMat = new THREE.MeshStandardMaterial({ color: 0xf9f09a, emissive: 0x998d37, emissiveIntensity: 0.3 });
for (let i = 0; i < 28; i++) {
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 4), laneLineMat);
  mark.position.set(0, 0.02, 7 - i * 9.5);
  mark.receiveShadow = true;
  roadGroup.add(mark);
}

const grass = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 300),
  new THREE.MeshStandardMaterial({ color: 0x65b46f, roughness: 1 })
);
grass.rotation.x = -Math.PI / 2;
grass.position.z = -78;
grass.position.y = -0.02;
grass.receiveShadow = true;
scene.add(grass);

const buildingGroup = new THREE.Group();
scene.add(buildingGroup);
const buildingPalette = [0xe76f51, 0xf4a261, 0x2a9d8f, 0x3a86ff, 0xef476f, 0x8d99ae];

for (let i = 0; i < 90; i++) {
  const w = THREE.MathUtils.randFloat(2.3, 4.8);
  const h = THREE.MathUtils.randFloat(4, 16);
  const d = THREE.MathUtils.randFloat(2.2, 5.5);
  const mat = new THREE.MeshStandardMaterial({
    color: buildingPalette[Math.floor(Math.random() * buildingPalette.length)],
    roughness: 0.68,
    metalness: 0.05
  });

  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  const side = Math.random() > 0.5 ? 1 : -1;
  b.position.x = side * THREE.MathUtils.randFloat(9.5, 22);
  b.position.z = THREE.MathUtils.randFloat(-230, 30);
  b.position.y = h / 2;
  b.castShadow = true;
  b.receiveShadow = true;
  buildingGroup.add(b);
}

const clouds = new THREE.Group();
scene.add(clouds);
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
for (let i = 0; i < 8; i++) {
  const cloud = new THREE.Group();
  for (let p = 0; p < 4; p++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random() * 1.2, 14, 12), cloudMat);
    puff.position.set((p - 1.5) * 1.7, Math.random() * 0.6, Math.random() * 0.8);
    cloud.add(puff);
  }
  cloud.position.set(THREE.MathUtils.randFloat(-26, 26), THREE.MathUtils.randFloat(14, 22), THREE.MathUtils.randFloat(-80, 30));
  clouds.add(cloud);
}

function createHeroTruck() {
  const g = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e4fbf, metalness: 0.5, roughness: 0.33 });
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xe63946, metalness: 0.45, roughness: 0.36 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.94, roughness: 0.2 });

  const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.1, 6.6), bodyMat);
  trailer.position.set(0, 1.45, -1.8);
  trailer.castShadow = true;
  g.add(trailer);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 2.7), cabMat);
  cab.position.set(0, 1.75, 2.3);
  cab.castShadow = true;
  g.add(cab);

  const grill = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.25), chromeMat);
  grill.position.set(0, 1.35, 3.7);
  grill.castShadow = true;
  g.add(grill);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.9, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x92dce5, transparent: true, opacity: 0.75, metalness: 0.12, roughness: 0.1 })
  );
  windshield.position.set(0, 2.2, 3.35);
  g.add(windshield);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.95 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x97a1a7, metalness: 0.85, roughness: 0.22 });

  const wheelZ = [3, 1.1, -1.2, -3.2];
  for (const z of wheelZ) {
    for (const x of [-1.5, 1.5]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.52, 24), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.55, z);
      wheel.castShadow = true;

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.56, 18), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);
      g.add(wheel);
    }
  }

  g.position.y = 0.05;
  return g;
}

const hero = createHeroTruck();
hero.position.z = 6;
scene.add(hero);

const obstacleGroup = new THREE.Group();
scene.add(obstacleGroup);
const obstacles = [];

function spawnObstacle(zPos) {
  const type = Math.random();
  let mesh;

  if (type < 0.5) {
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.8, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xa66c3f, roughness: 0.9 })
    );
    mesh.position.y = 0.95;
  } else {
    mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({ color: 0x8e9aaf, roughness: 0.86 })
    );
    mesh.position.y = 1.1;
  }

  mesh.position.x = THREE.MathUtils.randFloat(-2.8, 2.8);
  mesh.position.z = zPos;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData.radius = 1.25;
  mesh.userData.cleared = false;
  mesh.userData.baseY = mesh.position.y;

  obstacles.push(mesh);
  obstacleGroup.add(mesh);
}

for (let i = 0; i < 26; i++) {
  spawnObstacle(-12 - i * THREE.MathUtils.randFloat(8, 13));
}

const citizenGroup = new THREE.Group();
scene.add(citizenGroup);
const citizens = [];

function spawnCitizen(zPos) {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.36, 0.65, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xffbe0b, roughness: 0.78 })
  );
  body.position.y = 0.9;
  body.castShadow = true;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd6a5, roughness: 0.75 })
  );
  head.position.y = 1.65;
  head.castShadow = true;

  g.add(body);
  g.add(head);
  g.position.set(THREE.MathUtils.randFloat(-2.6, 2.6), 0, zPos);
  g.userData.saved = false;

  citizens.push(g);
  citizenGroup.add(g);
}

for (let i = 0; i < 8; i++) {
  spawnCitizen(-35 - i * 20);
}

const sparkleMat = new THREE.SpriteMaterial({ color: 0xfff08a, transparent: true, opacity: 0.95 });
const sparkles = [];

function makeSparkle(position) {
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Sprite(sparkleMat.clone());
    s.position.copy(position);
    s.position.x += THREE.MathUtils.randFloatSpread(1.3);
    s.position.y += THREE.MathUtils.randFloat(0.4, 1.8);
    s.position.z += THREE.MathUtils.randFloatSpread(1.3);
    s.scale.setScalar(0.35 + Math.random() * 0.38);
    s.userData.v = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(0.04),
      THREE.MathUtils.randFloat(0.015, 0.05),
      THREE.MathUtils.randFloatSpread(0.04)
    );
    s.userData.life = 45 + Math.random() * 18;
    sparkles.push(s);
    scene.add(s);
  }
}

let pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

const state = {
  started: false,
  ended: false,
  speed: 0.14,
  score: 0,
  saved: 0,
  targetSaved: 8
};

function setStatus(text, ok = false) {
  statusEl.textContent = text;
  statusEl.style.borderColor = ok ? "rgba(126, 242, 154, 0.65)" : "rgba(255,255,255,0.16)";
  statusEl.style.color = ok ? "var(--ok)" : "var(--text)";
}

function updateHUD() {
  scoreEl.textContent = String(state.score);
  savedEl.textContent = String(state.saved);
}

function resetGame() {
  for (const o of obstacles) {
    obstacleGroup.remove(o);
  }
  obstacles.length = 0;

  for (const c of citizens) {
    citizenGroup.remove(c);
  }
  citizens.length = 0;

  for (const s of sparkles) {
    scene.remove(s);
  }
  sparkles.length = 0;

  for (let i = 0; i < 26; i++) {
    spawnObstacle(-12 - i * THREE.MathUtils.randFloat(8, 13));
  }
  for (let i = 0; i < 8; i++) {
    spawnCitizen(-35 - i * 20);
  }

  hero.position.set(0, 0.05, 6);
  state.started = false;
  state.ended = false;
  state.speed = 0.14;
  state.score = 0;
  state.saved = 0;
  updateHUD();
  setStatus("Dodirni ekran za početak vožnje");
  restartBtn.classList.add("hidden");
}

function endGame(win) {
  state.ended = true;
  restartBtn.classList.remove("hidden");

  if (win) {
    setStatus("Bravo! Grad je spašen!", true);
  } else {
    setStatus("Ups! Pokušaj opet.");
  }
}

function handlePointerDown(event) {
  if (!state.started && !state.ended) {
    state.started = true;
    setStatus("Odlično! Čisti put i spašavaj građane.");
  }

  if (state.ended) {
    return;
  }

  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(obstacles, false);
  if (hits.length === 0) {
    return;
  }

  const target = hits[0].object;
  if (target.userData.cleared) {
    return;
  }

  target.userData.cleared = true;
  state.score += 10;
  updateHUD();
  makeSparkle(target.position.clone());
}

window.addEventListener("pointerdown", handlePointerDown);

restartBtn.addEventListener("click", () => {
  resetGame();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const truckBounds = { radius: 1.2 };
const clock = new THREE.Clock();

function loop() {
  const dt = Math.min(clock.getDelta(), 0.033);

  const t = performance.now() * 0.001;
  clouds.children.forEach((c, i) => {
    c.position.x += Math.sin(t * 0.09 + i) * 0.002;
  });

  if (state.started && !state.ended) {
    hero.position.z -= state.speed;
    state.speed += dt * 0.002;

    hero.position.y = 0.05 + Math.sin(t * 20) * 0.03;

    const camTargetX = hero.position.x * 0.45;
    camera.position.x += (camTargetX - camera.position.x) * 0.05;
    camera.position.z += ((hero.position.z + 12.8) - camera.position.z) * 0.06;

    for (const o of obstacles) {
      if (o.userData.cleared) {
        o.rotation.x += dt * 7;
        o.rotation.z += dt * 6;
        o.position.y += dt * 6;
        o.material.opacity = Math.max(0, (o.material.opacity ?? 1) - dt * 2.2);
        o.material.transparent = true;

        if (o.position.y > 7) {
          obstacleGroup.remove(o);
          o.userData.remove = true;
        }
        continue;
      }

      o.position.y = o.userData.baseY + Math.sin(t * 3 + o.position.z) * 0.08;

      const dz = Math.abs(o.position.z - hero.position.z);
      const dx = Math.abs(o.position.x - hero.position.x);
      if (dz < truckBounds.radius + o.userData.radius && dx < 1.95) {
        endGame(false);
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].userData.remove) {
        obstacles.splice(i, 1);
      }
    }

    for (const c of citizens) {
      if (c.userData.saved) {
        c.position.y = Math.sin(t * 8) * 0.08;
        continue;
      }

      const dz = Math.abs(c.position.z - hero.position.z);
      const dx = Math.abs(c.position.x - hero.position.x);

      if (dz < 2 && dx < 2.4) {
        c.userData.saved = true;
        c.position.y = 0;
        state.saved += 1;
        state.score += 25;
        updateHUD();
        makeSparkle(c.position.clone().add(new THREE.Vector3(0, 1.2, 0)));

        if (state.saved >= state.targetSaved) {
          endGame(true);
        }
      }
    }

    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.position.add(s.userData.v);
      s.userData.life -= 1;
      s.material.opacity = Math.max(0, s.userData.life / 60);

      if (s.userData.life <= 0) {
        scene.remove(s);
        sparkles.splice(i, 1);
      }
    }
  }

  camera.lookAt(hero.position.x, 2.2, hero.position.z - 8);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

resetGame();
loop();
