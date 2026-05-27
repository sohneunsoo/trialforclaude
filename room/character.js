import * as THREE from 'three';

// Chibi-proportioned roaming character based on the provided reference:
// - HUGE head (roughly 45% of total height), tiny body — toy / blind-box look
// - ASYMMETRIC hair: solid black on character's right (+X / viewer left),
//   white with black stripes on character's left (-X / viewer right)
// - Big shiny eyes with white catch-lights
// - Split coat: white on character's right (+X), black on character's left (-X)
//   (inverted from the hair — classic split-character look)
// - Diagonal chest strap with buckles
// - Mirrored armband stripes on the sleeves
// - Different earrings per side: bead-chain on right ear (+X / viewer left),
//   cross drop on left ear (-X / viewer right)
// - Chunky white platform boots with black soles
//
// At room scale (scaled 2.0× in main.js), the figure is ~2.5 units tall.

export function buildCharacter() {
  const root = new THREE.Group();

  const matWhite   = new THREE.MeshStandardMaterial({ color: '#f7f3ea', roughness: 0.55, metalness: 0.05 });
  const matBlack   = new THREE.MeshStandardMaterial({ color: '#1a1a1f', roughness: 0.5,  metalness: 0.05 });
  const matSkin    = new THREE.MeshStandardMaterial({ color: '#f3dccb', roughness: 0.78 });
  const matDark    = new THREE.MeshStandardMaterial({ color: '#1c1d22', roughness: 0.65 });
  const matBoot    = new THREE.MeshStandardMaterial({ color: '#fdfbf3', roughness: 0.3,  metalness: 0.18 });
  const matSole    = new THREE.MeshStandardMaterial({ color: '#15161a', roughness: 0.7 });
  const matBuckle  = new THREE.MeshStandardMaterial({ color: '#c8c4b5', roughness: 0.4,  metalness: 0.5 });
  const matEye     = new THREE.MeshStandardMaterial({ color: '#0a0a10', roughness: 0.35, metalness: 0.0 });
  const matCatch   = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.4, roughness: 0.25 });
  const matLip     = new THREE.MeshStandardMaterial({ color: '#d28a76', roughness: 0.6 });
  const matBlush   = new THREE.MeshStandardMaterial({ color: '#e7a497', roughness: 0.85, transparent: true, opacity: 0.55 });

  // =============== BOOTS (chunky white platform boots, black sole) ===============
  for (const x of [-0.10, 0.10]) {
    // platform sole — slightly wider than the boot
    const sole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.125, 0.06, 16),
      matSole
    );
    sole.position.set(x, 0.03, 0.012);
    sole.castShadow = true; sole.receiveShadow = true;
    root.add(sole);

    // boot upper — rounded, taller
    const boot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.108, 0.22, 16),
      matBoot
    );
    boot.position.set(x, 0.17, 0);
    boot.castShadow = true;
    root.add(boot);

    // boot toe-cap (small bump on the front)
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), matBoot);
    toe.scale.set(1, 0.5, 1.2);
    toe.position.set(x, 0.085, 0.06);
    root.add(toe);

    // buckle strap (small dark band with metallic buckle)
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.011, 6, 18),
      matBlack
    );
    strap.rotation.x = Math.PI / 2;
    strap.position.set(x, 0.22, 0);
    root.add(strap);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.024, 0.012), matBuckle);
    buckle.position.set(x, 0.22, 0.108);
    root.add(buckle);
  }

  // =============== PANTS (black, slightly tapered) ===============
  const pants = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.145, 0.30, 16),
    matBlack
  );
  pants.position.y = 0.43;
  pants.castShadow = true;
  root.add(pants);

  // pants strap (decorative, like the reference)
  const pantStrap = new THREE.Mesh(
    new THREE.TorusGeometry(0.135, 0.012, 6, 20),
    matWhite
  );
  pantStrap.rotation.x = Math.PI / 2;
  pantStrap.position.y = 0.46;
  root.add(pantStrap);

  // =============== COAT — split white (+X) / black (-X), wider at bottom ===============
  const coatTopY = 0.92;
  const coatH = 0.55;
  const coatTopR = 0.20;
  const coatBotR = 0.30;

  // White half (character's right = +X side)
  const halfW = new THREE.Mesh(
    new THREE.CylinderGeometry(coatTopR, coatBotR, coatH, 18, 1, false, -Math.PI / 2, Math.PI),
    matWhite
  );
  halfW.position.y = coatTopY - coatH / 2;
  halfW.castShadow = true; halfW.receiveShadow = true;
  root.add(halfW);

  // Black half (character's left = -X side)
  const halfB = new THREE.Mesh(
    new THREE.CylinderGeometry(coatTopR, coatBotR, coatH, 18, 1, false, Math.PI / 2, Math.PI),
    matBlack
  );
  halfB.position.y = coatTopY - coatH / 2;
  halfB.castShadow = true; halfB.receiveShadow = true;
  root.add(halfB);

  // Coat hem — thin disk extending down
  const hemY = coatTopY - coatH;
  const hemW = new THREE.Mesh(
    new THREE.CylinderGeometry(coatBotR + 0.01, coatBotR + 0.06, 0.12, 18, 1, false, -Math.PI / 2, Math.PI),
    matWhite
  );
  hemW.position.y = hemY - 0.06;
  hemW.castShadow = true;
  root.add(hemW);
  const hemB = new THREE.Mesh(
    new THREE.CylinderGeometry(coatBotR + 0.01, coatBotR + 0.06, 0.12, 18, 1, false, Math.PI / 2, Math.PI),
    matBlack
  );
  hemB.position.y = hemY - 0.06;
  hemB.castShadow = true;
  root.add(hemB);

  // Belt (dark, with center buckle)
  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.024, 6, 24),
    matDark
  );
  belt.rotation.x = Math.PI / 2;
  belt.position.y = coatTopY - coatH * 0.5;
  root.add(belt);
  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.024), matBuckle);
  beltBuckle.position.set(0, belt.position.y, 0.27);
  root.add(beltBuckle);

  // ----- DIAGONAL CHEST STRAP with buckles (from upper-left shoulder
  //       down to lower-right waist, like the reference) -----
  const strapY = coatTopY - coatH * 0.25;
  const strapGroup = new THREE.Group();
  const strapBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.46, 0.018),
    matBlack
  );
  strapBody.position.set(0, 0, 0.235); // pushed forward to wrap the chest
  strapGroup.add(strapBody);
  // 3 small white buckles along the strap
  for (const off of [-0.16, 0.0, 0.16]) {
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.045, 0.022),
      matWhite
    );
    buckle.position.set(0, off, 0.244);
    strapGroup.add(buckle);
    const buckleHole = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.020, 0.026),
      matBlack
    );
    buckleHole.position.set(0, off, 0.244);
    strapGroup.add(buckleHole);
  }
  strapGroup.position.y = strapY;
  strapGroup.rotation.z = 0.55; // diagonal across chest
  root.add(strapGroup);

  // Dark turtleneck collar
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.105, 0.12, 14),
    matDark
  );
  neck.position.y = coatTopY + 0.06;
  neck.castShadow = true;
  root.add(neck);

  // =============== ARMS — short and stubby, matching coat color ===============
  const armGeom = new THREE.CylinderGeometry(0.055, 0.05, 0.40, 10);
  // Right arm (+X) = white sleeve
  const armR = new THREE.Mesh(armGeom, matWhite);
  armR.position.set(0.27, coatTopY - 0.22, 0);
  armR.rotation.z = -0.06;
  armR.castShadow = true;
  armR.userData.side = +1;
  root.add(armR);

  // Right armband (black stripe on the white sleeve)
  const armBandR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.054, 0.04, 12),
    matBlack
  );
  armBandR.position.set(0.27, coatTopY - 0.32, 0);
  armBandR.rotation.z = -0.06;
  root.add(armBandR);

  // Right hand (small skin sphere)
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), matSkin);
  handR.position.set(0.30, coatTopY - 0.44, 0);
  handR.castShadow = true;
  root.add(handR);

  // Left arm (-X) = black sleeve
  const armL = new THREE.Mesh(armGeom, matBlack);
  armL.position.set(-0.27, coatTopY - 0.22, 0);
  armL.rotation.z = +0.06;
  armL.castShadow = true;
  armL.userData.side = -1;
  root.add(armL);

  // Left armband (white stripe on the black sleeve — mirrored)
  const armBandL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.054, 0.04, 12),
    matWhite
  );
  armBandL.position.set(-0.27, coatTopY - 0.32, 0);
  armBandL.rotation.z = +0.06;
  root.add(armBandL);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), matSkin);
  handL.position.set(-0.30, coatTopY - 0.44, 0);
  handL.castShadow = true;
  root.add(handL);

  root.userData.arms = [armR, armL];

  // =============== HEAD — large chibi head ===============
  const headR = 0.36;
  const headY = coatTopY + 0.16 + headR * 0.9;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(headR, 30, 24),
    matSkin
  );
  head.scale.set(0.95, 1.0, 0.98);
  head.position.y = headY;
  head.castShadow = true;
  root.add(head);

  // ----- helper to place a small mesh ON the head's actual spherical surface,
  // facing outward in the +Z direction. `outward` pushes the mesh slightly off
  // the surface so it isn't z-fighting with the head.
  function placeOnFace(mesh, localX, localY, outward = 0.012) {
    const r2 = headR * headR - localX * localX - localY * localY;
    const surfaceZ = Math.sqrt(Math.max(0.001, r2));
    mesh.position.set(
      head.position.x + localX,
      head.position.y + localY,
      head.position.z + surfaceZ + outward
    );
    root.add(mesh);
  }

  // ----- EYES (big chibi eyes — dark ovals with white sparkle) -----
  function makeEye(side) {
    const g = new THREE.Group();
    // sclera shadow (slightly larger, dark frame)
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.082, 14, 12), matEye);
    back.scale.set(0.85, 1.05, 0.35);
    g.add(back);
    // big highlight (upper-inner)
    const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), matCatch);
    highlight.position.set(side > 0 ? -0.018 : 0.018, 0.022, 0.03);
    g.add(highlight);
    // small highlight (lower-outer)
    const small = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 6), matCatch);
    small.position.set(side > 0 ? 0.022 : -0.022, -0.018, 0.03);
    g.add(small);
    return g;
  }
  const eyeL = makeEye(-1);
  placeOnFace(eyeL, -0.115, +0.005, 0.018);
  const eyeR = makeEye(+1);
  placeOnFace(eyeR, +0.115, +0.005, 0.018);

  // ----- NOSE — tiny dot bump -----
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), matSkin);
  nose.scale.set(0.9, 0.6, 0.6);
  placeOnFace(nose, 0, -0.06, 0.015);

  // ----- MOUTH — small soft pink smile -----
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.012), matLip);
  placeOnFace(mouth, 0, -0.13, 0.010);

  // ----- BLUSH (soft pink ovals on cheeks) -----
  const blushGeom = new THREE.SphereGeometry(0.05, 12, 10);
  const blushL = new THREE.Mesh(blushGeom, matBlush);
  blushL.scale.set(1, 0.45, 0.25);
  placeOnFace(blushL, -0.17, -0.10, 0.005);
  const blushR = new THREE.Mesh(blushGeom, matBlush);
  blushR.scale.set(1, 0.45, 0.25);
  placeOnFace(blushR, +0.17, -0.10, 0.005);

  // ----- EARS (small, on the sides) -----
  const earGeom = new THREE.SphereGeometry(0.055, 12, 10);
  const earL = new THREE.Mesh(earGeom, matSkin);
  earL.scale.set(0.35, 0.95, 0.7);
  earL.position.set(head.position.x - headR * 0.97, head.position.y - 0.03, head.position.z + 0.02);
  earL.castShadow = true;
  root.add(earL);
  const earR = new THREE.Mesh(earGeom, matSkin);
  earR.scale.set(0.35, 0.95, 0.7);
  earR.position.set(head.position.x + headR * 0.97, head.position.y - 0.03, head.position.z + 0.02);
  earR.castShadow = true;
  root.add(earR);

  // ----- EARRINGS — DIFFERENT per side (matching reference) -----
  // Character's RIGHT ear (+X / viewer's LEFT): a chain of small black bead drops
  {
    const x = +1 * (headR * 0.97 + 0.005);
    const z = head.position.z + 0.02;
    const yTop = head.position.y - 0.07;
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), matBlack);
    stud.position.set(x, yTop, z);
    root.add(stud);
    // 4 graduated black bead drops on a thin black chain
    const beadYs = [-0.045, -0.078, -0.108, -0.142];
    const beadRs = [0.016, 0.014, 0.013, 0.018];
    for (let i = 0; i < beadYs.length; i++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(beadRs[i], 10, 8), matBlack);
      // bottom bead is faceted diamond-ish (scaled down on Y)
      if (i === beadYs.length - 1) bead.scale.set(1.05, 1.5, 1.05);
      bead.position.set(x, yTop + beadYs[i], z);
      root.add(bead);
    }
  }
  // Character's LEFT ear (-X / viewer's RIGHT): vertical drop ending in a cross
  {
    const x = -1 * (headR * 0.97 + 0.005);
    const z = head.position.z + 0.02;
    const yTop = head.position.y - 0.07;
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), matBlack);
    stud.position.set(x, yTop, z);
    root.add(stud);
    // thin chain segment (a tall thin box)
    const chain = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.07, 0.008), matBlack);
    chain.position.set(x, yTop - 0.05, z);
    root.add(chain);
    // small connector bead just above the cross
    const connector = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 6), matBlack);
    connector.position.set(x, yTop - 0.095, z);
    root.add(connector);
    // CROSS at the bottom — vertical bar + horizontal bar with pointed tip
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.010), matBlack);
    crossV.position.set(x, yTop - 0.135, z);
    root.add(crossV);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.012, 0.010), matBlack);
    crossH.position.set(x, yTop - 0.125, z);
    root.add(crossH);
    // pointed tip below the cross
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.010, 0.022, 4), matBlack);
    tip.rotation.x = Math.PI; // point down
    tip.position.set(x, yTop - 0.172, z);
    root.add(tip);
  }

  // =============== HAIR — ASYMMETRIC split ===============
  // Reference: character's RIGHT half of hair (+X / viewer LEFT) is solid black.
  // Character's LEFT half of hair (-X / viewer RIGHT) is white with two thick
  // diagonal black stripes (skunk look).
  //
  // We build each half as a half-sphere cap. Three.js SphereGeometry:
  //   phi = 0 is +Z (front), increasing CCW from above. phi = +PI/2 is +X.

  const stripeTex = makeStripedHairTexture();
  const matHairBlack = matBlack; // solid black side
  const matHairStriped = new THREE.MeshStandardMaterial({
    map: stripeTex, roughness: 0.65, metalness: 0.0,
  });

  // --- BACK / SIDES cap, split into two halves ---
  // We leave a WIDE front wedge (~72° total) uncovered so the cap never wraps
  // onto the face. Eyes sit at ~±19° from the front — well inside the gap.
  // Right half (+X side, character right): solid black.
  const capR = new THREE.Mesh(
    new THREE.SphereGeometry(
      headR + 0.028, 24, 22,
      Math.PI * 0.20, Math.PI * 0.80,    // start 36° off-front, sweep around back
      0, Math.PI * 0.62
    ),
    matHairBlack
  );
  capR.position.copy(head.position);
  capR.scale.set(1.02, 1.08, 1.04);
  capR.castShadow = true;
  root.add(capR);

  // Left half (-X side, character left): striped white/black.
  const capL = new THREE.Mesh(
    new THREE.SphereGeometry(
      headR + 0.028, 24, 22,
      Math.PI * 1.00, Math.PI * 0.80,    // back-around-left, stopping 36° short of front
      0, Math.PI * 0.62
    ),
    matHairStriped
  );
  capL.position.copy(head.position);
  capL.scale.set(1.02, 1.08, 1.04);
  capL.castShadow = true;
  root.add(capL);

  // --- BANGS — restored to the longer, forehead-covering version, but kept
  //     just SHORT of the eyes. Eye phi ≈ 89° from crown; we stop at
  //     phi = 0.40π (=72°) which sits right at the brow line.
  const bangsR = new THREE.Mesh(
    new THREE.SphereGeometry(
      headR + 0.042, 20, 16,
      -Math.PI * 0.34, Math.PI * 0.38,   // front-right wedge (azimuth)
      0, Math.PI * 0.40                   // crown → brow
    ),
    matHairBlack
  );
  bangsR.position.copy(head.position);
  bangsR.scale.set(1.05, 0.95, 1.07);
  bangsR.castShadow = true;
  root.add(bangsR);

  // Left bangs (-X): striped
  const bangsL = new THREE.Mesh(
    new THREE.SphereGeometry(
      headR + 0.042, 20, 16,
      -Math.PI * 0.04, Math.PI * 0.38,
      0, Math.PI * 0.40
    ),
    matHairStriped
  );
  bangsL.position.copy(head.position);
  bangsL.scale.set(1.05, 0.95, 1.07);
  bangsL.castShadow = true;
  root.add(bangsL);

  // Chunky forelock SIDEBURNS — angular slabs that frame the temples (sides of
  // the forehead) without covering the eyes. They give the toy-like blocky
  // silhouette without dropping over the brow.
  function makeSidelock(material, side) {
    const lock = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.32, 0.10),
      material
    );
    lock.position.set(
      head.position.x + side * 0.28,
      head.position.y + 0.10,
      head.position.z + headR * 0.55
    );
    lock.rotation.x = -0.15;
    lock.rotation.z = side * 0.22;
    lock.castShadow = true;
    root.add(lock);
  }
  makeSidelock(matHairBlack,   +1); // character right, solid black
  makeSidelock(matHairStriped, -1); // character left, striped

  // A couple of messy lock tufts sticking up at the crown — color-matched per side
  const tuftLocs = [
    { x: -0.18, z: -0.05, angle: -0.25, color: matHairStriped, len: 0.18 },
    { x: -0.07, z: 0.05,  angle: -0.10, color: matHairStriped, len: 0.20 },
    { x:  0.05, z: 0.10,  angle:  0.05, color: matHairBlack,   len: 0.22 },
    { x:  0.16, z: 0.02,  angle:  0.18, color: matHairBlack,   len: 0.18 },
    { x:  0.22, z: -0.10, angle:  0.32, color: matHairBlack,   len: 0.14 },
    { x: -0.22, z: -0.15, angle: -0.40, color: matHairStriped, len: 0.13 },
  ];
  for (const t of tuftLocs) {
    const tuft = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, t.len, 8, 1, false),
      t.color
    );
    tuft.position.set(
      head.position.x + t.x,
      head.position.y + headR * 0.88,
      head.position.z + t.z
    );
    tuft.rotation.z = t.angle;
    tuft.rotation.x = -0.2;
    tuft.castShadow = true;
    root.add(tuft);
  }

  return root;
}

// ----- Generate a striped hair texture: WHITE base, two thick BLACK diagonal
// stripes — to match the "skunk stripe" half of the reference character's hair.
function makeStripedHairTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  // white base
  g.fillStyle = '#f7f3ea';
  g.fillRect(0, 0, c.width, c.height);

  // 2 thick black diagonal stripes (rotated for a slanted look)
  g.save();
  g.translate(c.width / 2, c.height / 2);
  g.rotate(0.32);
  g.translate(-c.width, -c.height);
  const stripes = [
    { y: 280, h: 90,  color: '#1a1a1f' },
    { y: 540, h: 110, color: '#1a1a1f' },
    { y: 780, h: 70,  color: '#1a1a1f' },
  ];
  for (const s of stripes) {
    g.fillStyle = s.color;
    g.fillRect(0, s.y, c.width * 2, s.h);
  }
  g.restore();

  // very subtle strand noise
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'}, ${0.03 + Math.random() * 0.07})`;
    g.fillRect(x, y, 3, 14);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.0, 1.0);
  return tex;
}

// Wandering controller — picks random targets, walks there, occasionally pauses.
export class CharacterWanderer {
  constructor(charObj, opts = {}) {
    this.obj = charObj;
    this.bounds = opts.bounds || { minX: -10, maxX: 10, minZ: -6, maxZ: 7 };
    this.avoidZones = opts.avoidZones || [];
    this.speed = opts.speed ?? 0.6;
    this.target = new THREE.Vector3();
    this.state = 'walking';
    this.pauseUntil = 0;
    this.baseY = charObj.position.y;
    this.pickTarget();
  }

  pickTarget() {
    for (let attempt = 0; attempt < 12; attempt++) {
      const x = THREE.MathUtils.randFloat(this.bounds.minX, this.bounds.maxX);
      const z = THREE.MathUtils.randFloat(this.bounds.minZ, this.bounds.maxZ);
      let ok = true;
      for (const a of this.avoidZones) {
        const d = Math.hypot(x - a.x, z - a.z);
        if (d < a.r) { ok = false; break; }
      }
      if (ok) {
        this.target.set(x, this.baseY, z);
        return;
      }
    }
    this.target.set(0, this.baseY, 0);
  }

  update(dt, t) {
    const pos = this.obj.position;
    if (this.state === 'walking') {
      const dir = this.target.clone().sub(pos);
      dir.y = 0;
      const dist = dir.length();
      if (dist < 0.15) {
        this.state = 'paused';
        this.pauseUntil = t + 0.8 + Math.random() * 2.2;
      } else {
        dir.normalize();
        pos.x += dir.x * this.speed * dt;
        pos.z += dir.z * this.speed * dt;
        const targetY = Math.atan2(dir.x, dir.z);
        let cur = this.obj.rotation.y;
        const da = ((targetY - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        this.obj.rotation.y += da * Math.min(1, dt * 6);

        const swing = Math.sin(t * 5.5) * 0.45;
        for (const arm of this.obj.userData.arms) {
          arm.rotation.x = swing * arm.userData.side;
        }
        this.obj.position.y = this.baseY + Math.abs(Math.sin(t * 5.5)) * 0.025;
      }
    } else if (this.state === 'paused') {
      for (const arm of this.obj.userData.arms) {
        arm.rotation.x *= 0.92;
      }
      this.obj.position.y = THREE.MathUtils.lerp(this.obj.position.y, this.baseY, 0.15);
      if (t >= this.pauseUntil) {
        this.pickTarget();
        this.state = 'walking';
      }
    }
  }
}
