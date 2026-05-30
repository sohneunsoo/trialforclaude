import * as THREE from 'three';

// ──────────────────────────────────────────────────────────────────────────────
//  buildCat()  — a cute low-poly roaming cat
//
//  Body at base scale: ~0.7 units tall.
//  In main.js, scale 1.8× → about 1.25 units tall (nicely smaller than the
//  2.0×-scaled human character).
// ──────────────────────────────────────────────────────────────────────────────
export function buildCat() {
  const root = new THREE.Group();

  // ── Materials ──────────────────────────────────────────────────────────────
  const matFur    = new THREE.MeshStandardMaterial({ color: '#c47a3a', roughness: 0.85 }); // warm orange
  const matLight  = new THREE.MeshStandardMaterial({ color: '#f0c887', roughness: 0.85 }); // cream belly
  const matStripe = new THREE.MeshStandardMaterial({ color: '#8b4a18', roughness: 0.85 }); // dark stripe
  const matEye    = new THREE.MeshStandardMaterial({ color: '#aacc44', roughness: 0.30 }); // lime-green iris
  const matPupil  = new THREE.MeshStandardMaterial({ color: '#080808', roughness: 0.25 });
  const matCatch  = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.5, roughness: 0.2 });
  const matNose   = new THREE.MeshStandardMaterial({ color: '#e87878', roughness: 0.75 });
  const matInner  = new THREE.MeshStandardMaterial({ color: '#ffbaba', roughness: 0.80 });
  const matPad    = new THREE.MeshStandardMaterial({ color: '#d4845a', roughness: 0.85 });

  // ── 4 LEGS ─────────────────────────────────────────────────────────────────
  const legLocs = [
    { x: -0.145, z:  0.155, side: -1 },
    { x:  0.145, z:  0.155, side:  1 },
    { x: -0.145, z: -0.155, side: -1 },
    { x:  0.145, z: -0.155, side:  1 },
  ];
  const legGeom = new THREE.CylinderGeometry(0.052, 0.062, 0.20, 10);
  const legs = [];
  for (const lp of legLocs) {
    const leg = new THREE.Mesh(legGeom, matFur);
    leg.position.set(lp.x, 0.10, lp.z);
    leg.castShadow = true;
    leg.userData.side = lp.side;
    root.add(leg);
    legs.push(leg);

    // paw pad
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), matPad);
    paw.scale.set(1.0, 0.42, 1.05);
    paw.position.set(lp.x, 0.035, lp.z + (lp.z > 0 ? 0.018 : -0.018));
    paw.castShadow = true;
    root.add(paw);
  }
  root.userData.legs = legs;

  // ── BODY ───────────────────────────────────────────────────────────────────
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 18, 14),
    matFur
  );
  body.scale.set(1.05, 0.78, 1.35);
  body.position.y = 0.27;
  body.castShadow = true;
  root.add(body);

  // cream belly patch
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 14, 10),
    matLight
  );
  belly.scale.set(0.78, 0.55, 0.30);
  belly.position.set(0, 0.25, 0.24);
  root.add(belly);

  // ── NECK ───────────────────────────────────────────────────────────────────
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.12, 0.14, 12),
    matFur
  );
  neck.position.set(0, 0.48, 0.06);
  root.add(neck);

  // ── HEAD ───────────────────────────────────────────────────────────────────
  const headR = 0.21;
  const headCx = 0, headCy = 0.655, headCz = 0.10;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(headR, 20, 16),
    matFur
  );
  head.scale.set(1.02, 0.97, 0.95);
  head.position.set(headCx, headCy, headCz);
  head.castShadow = true;
  root.add(head);

  // muzzle
  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    matLight
  );
  muzzle.scale.set(0.82, 0.55, 0.38);
  muzzle.position.set(0, headCy - 0.045, headCz + headR * 0.88);
  root.add(muzzle);

  // ── EARS ───────────────────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    // outer ear (triangular cone)
    const earOut = new THREE.Mesh(
      new THREE.ConeGeometry(0.082, 0.155, 4),
      matFur
    );
    earOut.position.set(side * 0.135, headCy + headR * 0.80, headCz - 0.025);
    earOut.rotation.z = side * 0.18;
    earOut.rotation.x = -0.12;
    earOut.castShadow = true;
    root.add(earOut);

    // inner ear (pink)
    const earIn = new THREE.Mesh(
      new THREE.ConeGeometry(0.050, 0.096, 4),
      matInner
    );
    earIn.position.set(side * 0.135, headCy + headR * 0.80, headCz - 0.008);
    earIn.rotation.z = side * 0.18;
    earIn.rotation.x = -0.12;
    root.add(earIn);
  }

  // ── EYES ───────────────────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const ex = headCx + side * 0.082;
    const ey = headCy + 0.032;
    const ez = headCz + headR * 0.87;

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 10), matEye);
    iris.scale.set(0.78, 1.0, 0.32);
    iris.position.set(ex, ey, ez);
    root.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), matPupil);
    pupil.scale.set(0.30, 0.90, 0.28);
    pupil.position.set(ex, ey, ez + 0.005);
    root.add(pupil);

    const catchLight = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), matCatch);
    catchLight.position.set(ex + side * 0.008, ey + 0.018, ez + 0.012);
    root.add(catchLight);
  }

  // ── NOSE ───────────────────────────────────────────────────────────────────
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.020, 8, 6), matNose);
  nose.scale.set(1.3, 0.80, 0.55);
  nose.position.set(0, headCy - 0.022, headCz + headR * 0.94);
  root.add(nose);

  // ── WHISKERS ───────────────────────────────────────────────────────────────
  const matWhisker = new THREE.MeshStandardMaterial({ color: '#f5f0e8', roughness: 0.9 });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.003, 0.26, 4),
        matWhisker
      );
      w.rotation.z = Math.PI / 2;
      w.rotation.x = (i - 1) * 0.18;
      w.position.set(
        side * 0.13,
        headCy - 0.035 + (i - 1) * 0.022,
        headCz + headR * 0.82
      );
      root.add(w);
    }
  }

  // ── TAIL ───────────────────────────────────────────────────────────────────
  // Tail root pivots at the base of the rump for wagging animation
  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, 0.30, -0.32);
  root.add(tailRoot);
  root.userData.tailRoot = tailRoot;

  // Build tail as a chain of 9 spherical segments curling up and forward
  const tailSegs = 9;
  let parentNode = tailRoot;
  for (let i = 0; i < tailSegs; i++) {
    const t = i / (tailSegs - 1);
    const r = 0.075 - t * 0.038;
    const segMat = t > 0.80 ? matLight : matFur;
    const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), segMat);
    const angle = t * Math.PI * 0.85 - Math.PI * 0.05;
    const radius = 0.32;
    seg.position.set(
      0,
      Math.sin(angle) * radius + 0.06,
      -Math.cos(angle) * radius
    );
    seg.castShadow = true;
    parentNode.add(seg);
    if (i === 0) parentNode = seg; // wag rotates the whole chain via the first seg
  }
  root.userData.tailBase = tailRoot.children[0]; // first segment for wagging

  // expose for CharacterWanderer compat (no arms, but avoids crash)
  root.userData.arms = [];

  return root;
}

// ──────────────────────────────────────────────────────────────────────────────
//  CatWanderer — same wander logic as CharacterWanderer but with:
//   • tail wag when walking
//   • gentle leg animation (front/back pairs)
//   • idle sitting pose (tail curls, occasional head-tilt)
// ──────────────────────────────────────────────────────────────────────────────
export class CatWanderer {
  constructor(catObj, opts = {}) {
    this.obj    = catObj;
    this.bounds = opts.bounds || { minX: -10, maxX: 10, minZ: -6, maxZ: 7 };
    this.avoidZones = opts.avoidZones || [];
    this.speed  = opts.speed ?? 0.42;
    this.target = new THREE.Vector3();
    this.state  = 'walking';
    this.pauseUntil = 0;
    this.baseY  = catObj.position.y;
    this._pickTarget();
  }

  _pickTarget() {
    for (let attempt = 0; attempt < 14; attempt++) {
      const x = THREE.MathUtils.randFloat(this.bounds.minX, this.bounds.maxX);
      const z = THREE.MathUtils.randFloat(this.bounds.minZ, this.bounds.maxZ);
      let ok = true;
      for (const a of this.avoidZones) {
        if (Math.hypot(x - a.x, z - a.z) < a.r) { ok = false; break; }
      }
      if (ok) { this.target.set(x, this.baseY, z); return; }
    }
    this.target.set(0, this.baseY, 2);
  }

  update(dt, t) {
    const pos = this.obj.position;
    const tail = this.obj.userData.tailRoot;
    const tailBase = this.obj.userData.tailBase;

    if (this.state === 'walking') {
      const dir = this.target.clone().sub(pos);
      dir.y = 0;
      const dist = dir.length();

      if (dist < 0.18) {
        this.state = 'paused';
        this.pauseUntil = t + 1.2 + Math.random() * 3.0;
      } else {
        dir.normalize();
        pos.x += dir.x * this.speed * dt;
        pos.z += dir.z * this.speed * dt;

        // face direction of travel
        const targetY = Math.atan2(dir.x, dir.z);
        const cur = this.obj.rotation.y;
        const da = ((targetY - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        this.obj.rotation.y += da * Math.min(1, dt * 5.5);

        // gentle body bob
        this.obj.position.y = this.baseY + Math.abs(Math.sin(t * 6.5)) * 0.022;

        // leg trot — front-left & back-right vs front-right & back-left
        const legs = this.obj.userData.legs;
        if (legs && legs.length === 4) {
          const trot = Math.sin(t * 7.0) * 0.28;
          legs[0].rotation.x =  trot;  // front-left
          legs[3].rotation.x =  trot;  // back-right  (same pair)
          legs[1].rotation.x = -trot;  // front-right
          legs[2].rotation.x = -trot;  // back-left
        }

        // tail wags side-to-side while walking
        if (tail) {
          tail.rotation.z = Math.sin(t * 4.5) * 0.45;
          tail.rotation.x = -0.15; // slight up-curl while walking
        }
      }
    } else if (this.state === 'paused') {
      // settle legs back to rest
      const legs = this.obj.userData.legs;
      if (legs) for (const l of legs) l.rotation.x *= 0.88;
      this.obj.position.y = THREE.MathUtils.lerp(this.obj.position.y, this.baseY, 0.12);

      // tail curls up slowly while sitting
      if (tail) {
        tail.rotation.z = THREE.MathUtils.lerp(tail.rotation.z, Math.sin(t * 1.2) * 0.14, 0.05);
        tail.rotation.x = THREE.MathUtils.lerp(tail.rotation.x, 0.35, 0.04);
      }

      // occasional slow head-look side-to-side
      if (t < this.pauseUntil - 0.5) {
        this.obj.rotation.y += Math.sin(t * 0.9) * dt * 0.25;
      }

      if (t >= this.pauseUntil) {
        this._pickTarget();
        this.state = 'walking';
      }
    }
  }
}
