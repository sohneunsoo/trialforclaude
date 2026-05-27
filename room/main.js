import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { buildEnvironment, ROOM } from './environment.js';
import { buildArrow } from './mouse.js';
import { buildCharacter, CharacterWanderer } from './character.js';

// ----- Scene -----
const root = document.getElementById('scene-root');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9e5dd');
scene.fog = new THREE.Fog('#e9e5dd', 40, 90);

const camera = new THREE.PerspectiveCamera(
  35, window.innerWidth / window.innerHeight, 0.1, 300
);
const HOME_CAM = { pos: new THREE.Vector3(0, 30, 28), target: new THREE.Vector3(0, 1.5, 0) };
camera.position.copy(HOME_CAM.pos);
camera.lookAt(HOME_CAM.target);

// ----- Lights -----
scene.add(new THREE.AmbientLight('#ffffff', 0.55));
scene.add(new THREE.HemisphereLight('#fff6e0', '#cdc8be', 0.35));

const sun = new THREE.DirectionalLight('#fff5e0', 1.5);
sun.position.set(10, 26, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const s = 22;
sun.shadow.camera.left = -s;
sun.shadow.camera.right = s;
sun.shadow.camera.top = s;
sun.shadow.camera.bottom = -s;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 70;
sun.shadow.bias = -0.0004;
sun.shadow.radius = 6;
scene.add(sun);

// soft rim fill from the front-left
const fill = new THREE.DirectionalLight('#cfe0ff', 0.25);
fill.position.set(-12, 12, 12);
scene.add(fill);

// ----- Environment -----
const env = buildEnvironment(scene);

// ----- Cursor avatar (3D arrow) -----
const mouse = buildArrow();
mouse.scale.setScalar(1.4); // smaller — reads as a pointer, not a building
mouse.position.set(-2, 0.05, 3.0);
scene.add(mouse);

// ----- Character -----
const character = buildCharacter();
character.scale.setScalar(2.0);
character.position.set(4.5, 0, 4.5);
scene.add(character);

const avoidZones = env.projectMounts.map(p => ({ x: p.position.x, z: p.position.z, r: 2.8 }));
// also avoid hero platform
avoidZones.push({ x: 0, z: -ROOM.depth / 2 + 4.3, r: 6 });

const wanderer = new CharacterWanderer(character, {
  bounds: { minX: -10, maxX: 10, minZ: -6, maxZ: 7 },
  avoidZones,
  speed: 0.55
});

// ----- OrbitControls -----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 1.5, 0);
controls.minDistance = 10;
controls.maxDistance = 55;
controls.maxPolarAngle = Math.PI * 0.46; // can't go below horizon
controls.minPolarAngle = 0.05; // can go almost top-down
controls.panSpeed = 0.6;
controls.rotateSpeed = 0.7;
controls.update();

// ----- Input -----
const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeProject(); return; }
  if (e.key === 'Enter') { tryOpenProject(); return; }
  keys.add(e.key.toLowerCase());
});
window.addEventListener('keyup', (e) => { keys.delete(e.key.toLowerCase()); });

// ----- Proximity + project state -----
let inRangeOf = null; // projectMount
let openProject = null;
const promptEl = document.getElementById('prompt');
const promptNum = document.getElementById('p-num');
const promptTitle = document.getElementById('p-title');

function detectProximity() {
  let best = null;
  let bestDist = Infinity;
  for (const m of env.projectMounts) {
    const dx = mouse.position.x - m.position.x;
    const dz = mouse.position.z - m.position.z;
    const d = Math.hypot(dx, dz);
    if (d < m.radius && d < bestDist) {
      best = m; bestDist = d;
    }
  }
  inRangeOf = best;
  if (best && !openProject) {
    promptEl.classList.add('show');
    promptNum.textContent = best.project.code;
    promptTitle.textContent = best.project.titleEn;
  } else {
    promptEl.classList.remove('show');
  }
  // lift platforms in range
  for (const m of env.projectMounts) {
    const target = (m === best && !openProject) ? 0.18 : 0;
    m.platform.position.y = THREE.MathUtils.lerp(m.platform.position.y, 0.225 + target, 0.15);
  }
}

// ----- Project overlay logic -----
const overlay = document.getElementById('overlay');
const ovCrumb = document.getElementById('ov-crumb');
const ovNum = document.getElementById('ov-num');
const ovTitle = document.getElementById('ov-title');
const ovTags = document.getElementById('ov-tags');
const ovDesc1 = document.getElementById('ov-desc-1');
const ovDesc2 = document.getElementById('ov-desc-2');
const ovYear = document.getElementById('ov-year');
const ovRole = document.getElementById('ov-role');
const ovStatus = document.getElementById('ov-status');
const ovArtBg = document.getElementById('ov-art-bg');
const ovArtLabel = document.getElementById('ov-art-label');
document.getElementById('ov-close').addEventListener('click', closeProject);

let savedCam = null;
let camAnim = null; // { from, to, fromTarget, toTarget, t, duration, onDone }

function tryOpenProject() {
  if (!inRangeOf || openProject) return;
  const m = inRangeOf;
  openProject = m;
  // disable controls while focusing
  controls.enabled = false;
  savedCam = { pos: camera.position.clone(), target: controls.target.clone() };
  // dolly camera to a 3/4 close-up on the alcove
  const toTarget = new THREE.Vector3(m.position.x, 0.7, m.position.z - 0.2);
  const offset = new THREE.Vector3(0, 3.6, 4.2);
  const toPos = toTarget.clone().add(offset);
  camAnim = {
    from: camera.position.clone(),
    to: toPos,
    fromTarget: controls.target.clone(),
    toTarget,
    t: 0,
    duration: 0.85,
    onDone: () => {
      fillOverlay(m.project);
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  };
}

function closeProject() {
  if (!openProject) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  const m = openProject;
  openProject = null;
  camAnim = {
    from: camera.position.clone(),
    to: savedCam.pos.clone(),
    fromTarget: controls.target.clone(),
    toTarget: savedCam.target.clone(),
    t: 0,
    duration: 0.9,
    onDone: () => { controls.enabled = true; }
  };
}

function fillOverlay(p) {
  ovCrumb.textContent = 'PROJECT ' + p.code;
  ovNum.textContent = p.code + ' / 08';
  ovTitle.textContent = p.title;
  ovTags.textContent = p.tags;
  ovDesc1.textContent = p.desc1;
  ovDesc2.textContent = p.desc2;
  ovYear.textContent = p.year;
  ovRole.textContent = p.role;
  ovStatus.textContent = p.status;
  ovArtBg.style.background = p.tone;
  ovArtLabel.textContent = '[ ' + p.titleEn + ' — HERO IMAGE ]';
}

// ----- Movement -----
const MOVE_SPEED = 4.5;
const MOVE_DAMP = 8.0;
const vel = new THREE.Vector3();
let lastMoveDir = new THREE.Vector3(0, 0, 1);

function updateMouse(dt) {
  if (openProject || camAnim) return;
  // input vector — relative to camera yaw so WASD always feels intuitive
  let ix = 0, iz = 0;
  if (keys.has('w') || keys.has('arrowup'))    iz -= 1;
  if (keys.has('s') || keys.has('arrowdown'))  iz += 1;
  if (keys.has('a') || keys.has('arrowleft'))  ix -= 1;
  if (keys.has('d') || keys.has('arrowright')) ix += 1;
  const inLen = Math.hypot(ix, iz);
  if (inLen > 0) { ix /= inLen; iz /= inLen; }

  // align to camera yaw on XZ plane
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  camDir.y = 0; camDir.normalize();
  const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
  // forward (z- in screen space) is camDir
  const desired = new THREE.Vector3();
  desired.addScaledVector(camDir, -iz);
  desired.addScaledVector(camRight, ix);
  if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(MOVE_SPEED);

  // accelerate toward desired velocity
  vel.x += (desired.x - vel.x) * Math.min(1, dt * MOVE_DAMP);
  vel.z += (desired.z - vel.z) * Math.min(1, dt * MOVE_DAMP);

  // integrate
  mouse.position.x += vel.x * dt;
  mouse.position.z += vel.z * dt;

  // clamp to room bounds
  const halfW = ROOM.width / 2 - 1.2;
  const halfD = ROOM.depth / 2 - 1.2;
  mouse.position.x = THREE.MathUtils.clamp(mouse.position.x, -halfW, halfW);
  // keep mouse out of the dark footer band & hero platform
  mouse.position.z = THREE.MathUtils.clamp(mouse.position.z, -halfD + 8.6, halfD - 3.2);

  mouse.position.y = 0.05; // ride on the floor surface

  // Cursor does not rotate to face motion direction — like an OS cursor it stays
  // in the same orientation (tip pointing upper-left in screen space).
  if (vel.lengthSq() > 0.01) {
    lastMoveDir.set(vel.x, 0, vel.z).normalize();
  }
}

// ----- Camera animation tick -----
function tickCamAnim(dt) {
  if (!camAnim) return;
  camAnim.t += dt;
  const k = Math.min(1, camAnim.t / camAnim.duration);
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // easeInOutQuad
  camera.position.lerpVectors(camAnim.from, camAnim.to, e);
  controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, e);
  camera.lookAt(controls.target);
  if (k >= 1) {
    const done = camAnim.onDone;
    camAnim = null;
    if (done) done();
  }
}

// ----- Coords HUD + compass (3D depth scrollbar is in the scene now) -----
const coordEl = document.getElementById('coord');
const needle = document.getElementById('needle');
const Z_FRONT = +ROOM.depth / 2;
const Z_BACK  = -ROOM.depth / 2;
function updateHud() {
  const x = mouse.position.x, z = mouse.position.z;
  coordEl.textContent = `x ${x >= 0 ? '+' : ''}${x.toFixed(1)}  z ${z >= 0 ? '+' : ''}${z.toFixed(1)}`;
  // compass needle reflects camera yaw
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const yaw = Math.atan2(camDir.x, camDir.z);
  needle.style.transform = `translate(-50%, -100%) rotate(${(-yaw * 180 / Math.PI).toFixed(1)}deg)`;

  // Drive the 3D scrollbar thumb from the CHARACTER's z position.
  // 0 = front of room, 1 = back of room.
  if (env.scrollbar) {
    const cz = character.position.z;
    const frac = THREE.MathUtils.clamp((Z_FRONT - cz) / (Z_FRONT - Z_BACK), 0, 1);
    env.scrollbar.setProgress(1 - frac); // invert so back→back end of rail
  }
}

// ----- Resize -----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----- Loop -----
const clock = new THREE.Clock();
function step() {
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  updateMouse(dt);
  wanderer.update(dt, t);
  tickCamAnim(dt);
  detectProximity();
  updateHud();

  // animated digital billboard cycles its slides over time
  if (env.billboard) env.billboard.update(t);

  if (!camAnim && !openProject) controls.update();

  renderer.render(scene, camera);
}
// initial render so the canvas isn't blank if rAF is throttled
step();

// Run via rAF when the tab is visible — fall back to setTimeout when hidden
// (preview iframes that are off-screen pause rAF entirely).
let lastTick = performance.now();
function rafLoop() {
  step();
  lastTick = performance.now();
  requestAnimationFrame(rafLoop);
}
requestAnimationFrame(rafLoop);

// Expose for in-page debugging / camera probes
window.__room = { scene, camera, controls, mouse, character, renderer, step };

setInterval(() => {
  // if rAF hasn't fired in 200ms, run a manual step
  if (performance.now() - lastTick > 200) {
    step();
    lastTick = performance.now();
  }
}, 100);

// ----- Hide boot -----
let bootHidden = false;
function hideBoot() {
  if (bootHidden) return;
  bootHidden = true;
  const b = document.getElementById('boot');
  if (b) {
    b.classList.add('gone');
    setTimeout(() => { if (b.parentNode) b.parentNode.removeChild(b); }, 700);
  }
}
// hide after a tick — use setTimeout so it fires even if rAF is throttled
setTimeout(hideBoot, 50);
