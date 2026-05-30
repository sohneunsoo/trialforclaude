import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { buildEnvironment, ROOM } from './environment.js';
import { buildArrow } from './mouse.js';
import { buildCharacter, CharacterWanderer } from './character.js';
import { buildCat, CatWanderer } from './cat.js';
import { initGuestbook, openGuestbook, closeGuestbook, isGuestbookOpen } from './guestbook.js';

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
scene.background = new THREE.Color('#7ab8d4'); // fallback until texture loads
scene.fog = new THREE.Fog('#a8cce0', 40, 90);

new THREE.TextureLoader().load('./bg.png', (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
});

const camera = new THREE.PerspectiveCamera(
  35, window.innerWidth / window.innerHeight, 0.1, 300
);
const HOME_CAM = { pos: new THREE.Vector3(-9, 25, 34), target: new THREE.Vector3(-2, 1.5, 2.0) };
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

const avoidZones = env.projectMounts.map(p => ({ x: p.position.x, z: p.position.z, r: 4.5 }));
// also avoid hero platform
avoidZones.push({ x: 0, z: -ROOM.depth / 2 + 5.3, r: 6 });

const wanderer = new CharacterWanderer(character, {
  bounds: { minX: -8, maxX: 8, minZ: -8, maxZ: 9 },
  avoidZones,
  speed: 0.55
});

// ----- Cat -----
const cat = buildCat();
cat.scale.setScalar(1.8);
cat.position.set(-3.5, 0, 2.0);
scene.add(cat);

const catWanderer = new CatWanderer(cat, {
  bounds: { minX: -8, maxX: 8, minZ: -8, maxZ: 9 },
  avoidZones,
  speed: 0.40
});

// ----- OrbitControls -----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(-2, 1.5, 2.0);
controls.minDistance = 10;
controls.maxDistance = 60;
controls.maxPolarAngle = Math.PI * 0.46; // can't go below horizon
controls.minPolarAngle = 0.05; // can go almost top-down
controls.panSpeed = 0.6;
controls.rotateSpeed = 0.7;
controls.update();

// ----- Input -----
const keys = new Set();
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // ESC layering: guestbook → embed → project overlay → room
    if (isGuestbookOpen()) { closeGuestbook(); return; }
    if (embedOverlay.classList.contains('open')) { closeEmbedOverlay(); return; }
    if (openProject) { closeProject(); return; }
    return;
  }
  if (e.key === 'Enter') { tryOpenProject(); return; }
  // When embed overlay is open, let the iframe handle all keys (arrows navigate slides)
  if (embedOverlay.classList.contains('open')) return;
  // arrow keys navigate gallery when overlay is open
  if (openProject && galleryImages.length) {
    if (e.key === 'ArrowLeft')  { moveGallery(-1); return; }
    if (e.key === 'ArrowRight') { moveGallery(1);  return; }
  }
  // prevent arrow keys from scrolling the page
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  keys.add(e.code); // use physical key code — works even with Korean IME active
});
window.addEventListener('keyup', (e) => { keys.delete(e.code); });

// ----- Proximity + project state -----
let inRangeOf = null; // projectMount
let nearGuestbook = false;
let openProject = null;
const promptEl = document.getElementById('prompt');
const promptNum = document.getElementById('p-num');
const promptTitle = document.getElementById('p-title');

function detectProximity() {
  let best = null;
  let bestDist = Infinity;
  for (const m of env.projectMounts) {
    if (m.project.wip) continue; // WIP slots are not interactive for now
    const dx = mouse.position.x - m.position.x;
    const dz = mouse.position.z - m.position.z;
    const d = Math.hypot(dx, dz);
    if (d < m.radius && d < bestDist) {
      best = m; bestDist = d;
    }
  }
  inRangeOf = best;

  // guestbook proximity
  const gbPos = env.guestbookPosition;
  const gbR   = env.guestbookRadius || 3.5;
  if (gbPos) {
    const gdx = mouse.position.x - gbPos.x;
    const gdz = mouse.position.z - gbPos.z;
    nearGuestbook = Math.hypot(gdx, gdz) < gbR;
  }

  if (!openProject) {
    if (best) {
      promptEl.classList.add('show');
      promptNum.textContent = best.project.code;
      promptTitle.textContent = best.project.titleEn;
      const hintEl = promptEl.querySelector('.keyhint');
      if (hintEl) hintEl.lastChild.textContent = '열기';
    } else if (nearGuestbook) {
      promptEl.classList.add('show');
      promptNum.textContent = '✉';
      promptTitle.textContent = '방명록';
      const hintEl = promptEl.querySelector('.keyhint');
      if (hintEl) hintEl.lastChild.textContent = '열기';
    } else {
      promptEl.classList.remove('show');
    }
  } else {
    promptEl.classList.remove('show');
  }

  // lift platforms in range
  for (const m of env.projectMounts) {
    const target = (m === best && !openProject) ? 0.18 : 0;
    m.platform.position.y = THREE.MathUtils.lerp(m.platform.position.y, 0.225 + target, 0.15);
  }
}

// ----- Embed iframe overlay -----
const embedOverlay = document.getElementById('embed-overlay');
const embedFrame = document.getElementById('embed-frame');
const embedLabel = document.getElementById('embed-label');
document.getElementById('embed-close').addEventListener('click', closeEmbedOverlay);

const embedMain = document.getElementById('embed-main');
const embedSide = document.getElementById('embed-side');
const embedQr   = document.getElementById('embed-qr');
const embedQrLink = document.getElementById('embed-qr-link');

let currentEmbedProject = null;

function openEmbedOverlay(project) {
  embedLabel.textContent = project.titleEn;

  // Only reload if it's a different project — avoids re-fetching Slides every open
  if (!currentEmbedProject || currentEmbedProject.url !== project.url) {
    embedFrame.src = project.url;
  }
  currentEmbedProject = project;

  // vertical video mode (e.g. YouTube Shorts)
  embedMain.classList.toggle('vertical', !!project.vertical);

  // QR code side panel
  if (project.qr) {
    const encoded = encodeURIComponent(project.qr);
    embedQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&margin=8`;
    embedQrLink.href = project.qr;
    embedSide.classList.add('show');
  } else {
    embedSide.classList.remove('show');
  }

  embedOverlay.classList.add('open');
  embedOverlay.setAttribute('aria-hidden', 'false');

  // Focus the iframe so arrow keys are forwarded to the slides
  setTimeout(() => embedFrame.focus(), 400);
}

function closeEmbedOverlay() {
  embedOverlay.classList.remove('open');
  embedOverlay.setAttribute('aria-hidden', 'true');
  // For video embeds (YouTube) clear src to stop playback; keep Slides loaded for next open
  if (currentEmbedProject && (currentEmbedProject.vertical || currentEmbedProject.qr)) {
    embedFrame.src = '';
    currentEmbedProject = null;
  }
  embedSide.classList.remove('show');
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
const ovVisit = document.getElementById('ov-visit');
document.getElementById('ov-close').addEventListener('click', closeProject);

let savedCam = null;
let camAnim = null; // { from, to, fromTarget, toTarget, t, duration, onDone }

const navFlash = document.getElementById('nav-flash');

function zoomToAlcove(m, duration, onDone) {
  controls.enabled = false;
  savedCam = { pos: camera.position.clone(), target: controls.target.clone() };
  const toTarget = new THREE.Vector3(m.position.x, 0.7, m.position.z - 0.2);
  const toPos = toTarget.clone().add(new THREE.Vector3(0, 3.6, 4.2));
  camAnim = {
    from: camera.position.clone(), to: toPos,
    fromTarget: controls.target.clone(), toTarget,
    t: 0, duration: duration || 0.75,
    onDone
  };
}

function zoomBack() {
  camAnim = {
    from: camera.position.clone(), to: savedCam.pos.clone(),
    fromTarget: controls.target.clone(), toTarget: savedCam.target.clone(),
    t: 0, duration: 0.9,
    onDone: () => { controls.enabled = true; }
  };
}

function tryOpenProject() {
  // guestbook takes priority if no project is near
  if (!inRangeOf && nearGuestbook && !openProject) {
    openGuestbook();
    return;
  }
  if (!inRangeOf || openProject) return;
  const m = inRangeOf;

  // ── Embed slots (아이돌 기획안, 파일럿 뮤직): zoom in → auto-open embed, then zoom back ──
  if (m.project.embed) {
    zoomToAlcove(m, 0.75, () => {
      openEmbedOverlay(m.project);
      setTimeout(() => zoomBack(), 150);
    });
    return;
  }

  // ── URL slots (가챠, 모노시안, AI pages, etc.): zoom in → flash → open new tab → zoom back ──
  if (m.project.url) {
    zoomToAlcove(m, 0.75, () => {
      navFlash.classList.add('on');
      setTimeout(() => {
        window.open(m.project.url, '_blank', 'noopener,noreferrer');
        setTimeout(() => {
          navFlash.classList.remove('on');
          zoomBack();
        }, 450);
      }, 320);
    });
    return;
  }

  // ── Normal overlay projects (wip & gallery): zoom in → show overlay ──
  openProject = m;
  zoomToAlcove(m, 0.85, () => {
    fillOverlay(m.project);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  });
}

function closeProject() {
  if (!openProject) return;
  // also shut embed overlay if it's layered on top
  if (embedOverlay.classList.contains('open')) closeEmbedOverlay();
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

let galleryIndex = 0;
let galleryImages = [];

function fillOverlay(p) {
  ovCrumb.textContent = '프로젝트 ' + p.code;
  ovNum.textContent = p.code + ' / 12';
  ovTitle.textContent = p.title;
  ovTags.textContent = p.tags;
  ovYear.textContent = p.year;
  ovRole.textContent = p.role;
  ovStatus.textContent = p.status;

  if (p.wip) {
    ovDesc1.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;background:#ffdd57;color:#111;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:700;letter-spacing:0.08em;">🚧 포폴 공사중</span>';
    ovDesc2.textContent = '곧 업데이트 예정입니다.';
  } else {
    ovDesc1.textContent = p.desc1;
    ovDesc2.textContent = p.desc2;
  }

  const artEl = ovArtBg.parentElement; // .ov-art

  if (p.gallery && p.gallery.length) {
    // --- Gallery mode ---
    artEl.classList.add('gallery-mode');
    ovArtBg.style.display = 'none';
    ovArtLabel.style.display = 'none';

    galleryImages = p.gallery;
    galleryIndex = 0;

    artEl.innerHTML = `
      <div class="gallery-track-wrap">
        <div class="gallery-track" id="gallery-track">
          ${galleryImages.map(src => `<img src="${src}" alt="" loading="lazy">`).join('')}
        </div>
      </div>
      <div class="gallery-nav">
        <button class="gallery-btn" id="gal-prev" aria-label="이전">&#8592;</button>
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="gallery-dots" id="gal-dots">
            ${galleryImages.map((_, i) => `<div class="gallery-dot${i===0?' active':''}" data-i="${i}"></div>`).join('')}
          </div>
          <span class="gallery-counter" id="gal-counter">1 / ${galleryImages.length}</span>
        </div>
        <button class="gallery-btn" id="gal-next" aria-label="다음">&#8594;</button>
      </div>`;

    document.getElementById('gal-prev').addEventListener('click', () => moveGallery(-1));
    document.getElementById('gal-next').addEventListener('click', () => moveGallery(1));
    document.getElementById('gal-dots').querySelectorAll('.gallery-dot').forEach(d => {
      d.addEventListener('click', () => setGallery(+d.dataset.i));
    });
    updateGalleryUI();

  } else {
    // --- Default mode: cover image or placeholder ---
    artEl.classList.remove('gallery-mode');
    if (p.cover) {
      artEl.style.backgroundImage = `url(${p.cover})`;
      artEl.style.backgroundSize = 'cover';
      artEl.style.backgroundPosition = 'center';
      ovArtBg.style.display = 'none';
      ovArtLabel.style.display = 'none';
    } else {
      artEl.style.backgroundImage = '';
      ovArtBg.style.display = '';
      ovArtLabel.style.display = '';
      ovArtBg.style.background = p.tone;
      ovArtLabel.textContent = '[ ' + p.titleEn + ' — 대표 이미지 ]';
    }
  }

  if (p.embed) {
    ovVisit.removeAttribute('href');
    ovVisit.innerHTML = '▶ &nbsp;열기';
    ovVisit.style.display = 'inline-flex';
    ovVisit.onclick = (e) => { e.preventDefault(); openEmbedOverlay(p); };
  } else if (p.url) {
    ovVisit.href = p.url;
    ovVisit.innerHTML = '사이트 방문 &nbsp;↗';
    ovVisit.style.display = 'inline-flex';
    ovVisit.onclick = null;
  } else {
    ovVisit.style.display = 'none';
    ovVisit.onclick = null;
  }
}

function moveGallery(dir) {
  setGallery(Math.max(0, Math.min(galleryImages.length - 1, galleryIndex + dir)));
}

function setGallery(i) {
  galleryIndex = i;
  updateGalleryUI();
}

function updateGalleryUI() {
  const track = document.getElementById('gallery-track');
  const counter = document.getElementById('gal-counter');
  const dots = document.getElementById('gal-dots');
  const prev = document.getElementById('gal-prev');
  const next = document.getElementById('gal-next');
  if (!track) return;
  track.style.transform = `translateX(-${galleryIndex * 100}%)`;
  if (counter) counter.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
  if (dots) dots.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === galleryIndex));
  if (prev) prev.disabled = galleryIndex === 0;
  if (next) next.disabled = galleryIndex === galleryImages.length - 1;
}

// ----- Movement -----
const MOVE_SPEED = 4.5;
const MOVE_DAMP = 8.0;
const vel = new THREE.Vector3();
let lastMoveDir = new THREE.Vector3(0, 0, 1);

function updateMouse(dt) {
  if (openProject || camAnim || embedOverlay.classList.contains('open') || isGuestbookOpen()) return;
  // input vector — relative to camera yaw so WASD always feels intuitive
  let ix = 0, iz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp'))    iz -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown'))  iz += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  ix -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
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
  // keep mouse out of the dark footer band; allow full back hero zone
  mouse.position.z = THREE.MathUtils.clamp(mouse.position.z, -halfD + 1.5, halfD - 2.0);

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
  catWanderer.update(dt, t);
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

// initialise guestbook form/handlers
initGuestbook();
