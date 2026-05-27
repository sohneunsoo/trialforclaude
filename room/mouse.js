import * as THREE from 'three';

// Classic OS arrow cursor, extruded as a thin 3D shape that lies flat on the floor.
// Tip points in -Z (forward / "screen-up" from the overhead camera).
export function buildArrow() {
  const root = new THREE.Group();

  // Outline traced as a Shape — classic cursor: tip top-left, body extends down-right.
  // Coordinates roughly fit in a 1.4 (X) × 1.8 (Z) bounding box; tip near origin.
  const s = new THREE.Shape();
  // tip → left-edge-down → inner notch → tail-left → tail-right → notch-right → shoulder → close
  s.moveTo(0.00, 0.00);          // tip
  s.lineTo(0.00, -1.20);         // left edge straight down
  s.lineTo(0.32, -0.92);         // inner notch
  s.lineTo(0.58, -1.55);         // tail bottom-left
  s.lineTo(0.78, -1.48);         // tail bottom-right
  s.lineTo(0.52, -0.82);         // inner notch right
  s.lineTo(0.92, -0.78);         // right shoulder
  s.closePath();

  // black outer shell (slightly larger) for the OS cursor's dark border
  const outline = new THREE.Shape();
  const off = 0.06;
  outline.moveTo(-off, off);
  outline.lineTo(-off, -1.20 - off);
  outline.lineTo(0.32 + off * 0.2, -0.92);
  outline.lineTo(0.58 + off * 0.2, -1.55 - off);
  outline.lineTo(0.78 + off, -1.48 - off);
  outline.lineTo(0.52, -0.82 + off * 0.2);
  outline.lineTo(0.92 + off, -0.78 + off);
  outline.closePath();

  const extrudeOpts = {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 4
  };

  // outer (dark) shell
  const outerGeom = new THREE.ExtrudeGeometry(outline, { ...extrudeOpts, depth: 0.14 });
  outerGeom.rotateX(-Math.PI / 2);
  outerGeom.translate(0, 0.001, 0);
  const outerMat = new THREE.MeshStandardMaterial({
    color: '#15161a', roughness: 0.45, metalness: 0.05,
    depthTest: false   // <- always pass depth, so panels can't occlude the cursor
  });
  const outerMesh = new THREE.Mesh(outerGeom, outerMat);
  outerMesh.castShadow = true;
  outerMesh.receiveShadow = true;
  outerMesh.renderOrder = 999;
  root.add(outerMesh);

  // inner (white) fill, slightly raised
  const innerGeom = new THREE.ExtrudeGeometry(s, extrudeOpts);
  innerGeom.rotateX(-Math.PI / 2);
  innerGeom.translate(0, 0.04, 0);
  const innerMat = new THREE.MeshStandardMaterial({
    color: '#fafaf6', roughness: 0.32, metalness: 0.05,
    depthTest: false   // <- same: always on top
  });
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  innerMesh.castShadow = true;
  innerMesh.receiveShadow = true;
  innerMesh.renderOrder = 1000; // above the outer shell
  root.add(innerMesh);

  // Tail anchor (kept for compatibility; we won't render a cable for the arrow)
  const cableAnchor = new THREE.Object3D();
  cableAnchor.position.set(0.7, 0.04, -1.4);
  root.add(cableAnchor);
  root.userData.cableAnchor = cableAnchor;

  // Tip offset — for camera centering / debug
  root.userData.tipLocal = new THREE.Vector3(0, 0.06, 0);
  // Body center for facing math
  root.userData.bodyCenterLocal = new THREE.Vector3(0.4, 0.06, -0.7);

  return root;
}

// Apple Magic Mouse–style avatar with a trailing cable (kept for reference).
export function buildMouse() {
  const root = new THREE.Group();

  // body — flat oval-ish hump
  const bodyGeom = new THREE.SphereGeometry(0.5, 48, 32);
  // squash into a mouse-like form
  const pos = bodyGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // elongated front-to-back
    z *= 1.45;
    // flatter on top, even flatter on bottom
    if (y > 0) y *= 0.42;
    else y *= 0.04;
    // narrow front, slightly wider back
    const taper = THREE.MathUtils.lerp(0.88, 1.05, (z + 0.7) / 1.4);
    x *= taper;
    pos.setXYZ(i, x, y, z);
  }
  bodyGeom.computeVertexNormals();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#fafaf6',
    roughness: 0.32,
    metalness: 0.05,
    envMapIntensity: 1.0
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // touch-surface seam — a subtle dark line near the bottom edge
  {
    const seamGeom = new THREE.TorusGeometry(0.49, 0.012, 8, 96);
    const seamMat = new THREE.MeshStandardMaterial({ color: '#dad6cd', roughness: 0.7 });
    const seam = new THREE.Mesh(seamGeom, seamMat);
    seam.rotation.x = Math.PI / 2;
    seam.scale.set(1.0, 1.44, 1.0); // match body squish in z
    seam.position.y = 0.005;
    root.add(seam);
  }

  // tiny LED indicator at the back (red dot, very small)
  {
    const led = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 16),
      new THREE.MeshStandardMaterial({ color: '#ff5b5b', emissive: '#ff3a3a', emissiveIntensity: 1.0 })
    );
    led.rotation.x = -Math.PI / 2;
    led.position.set(0, 0.21, 0.62);
    root.add(led);
  }

  // bottom plate (visible if camera tilts low)
  {
    const bot = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 48),
      new THREE.MeshStandardMaterial({ color: '#e8e3d8', roughness: 0.85 })
    );
    bot.rotation.x = Math.PI / 2;
    bot.scale.set(1, 1.44, 1);
    bot.position.y = -0.001;
    root.add(bot);
  }

  // back of mouse: small attachment point for cable
  const cableAnchor = new THREE.Object3D();
  cableAnchor.position.set(0, 0.04, 0.72);
  root.add(cableAnchor);

  // direction arrow (very faint indicator on top, like a maker's mark)
  // actually skip — keep clean

  root.userData.cableAnchor = cableAnchor;
  return root;
}

// Trailing cable: chain of points that lazily follows the mouse, rendered as a tube.
export class MouseCable {
  constructor(mouseObj, scene, opts = {}) {
    this.mouseObj = mouseObj;
    this.scene = scene;
    this.segments = opts.segments ?? 22;
    this.spacing = opts.spacing ?? 0.18;
    this.points = [];
    this.mat = new THREE.MeshStandardMaterial({
      color: '#fafaf6', roughness: 0.5, metalness: 0
    });

    // start all points behind mouse along +Z
    const start = new THREE.Vector3();
    mouseObj.userData.cableAnchor.getWorldPosition(start);
    for (let i = 0; i < this.segments; i++) {
      this.points.push(start.clone().add(new THREE.Vector3(0, 0, i * this.spacing)));
    }

    // initial tube
    this.curve = new THREE.CatmullRomCurve3(this.points, false, 'catmullrom', 0.5);
    this.tube = new THREE.Mesh(
      new THREE.TubeGeometry(this.curve, 64, 0.025, 8, false),
      this.mat
    );
    this.tube.castShadow = false; // small object — soft shadow optional
    this.tube.receiveShadow = false;
    scene.add(this.tube);

    // little USB plug at the tail
    const plug = new THREE.Group();
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.05, 0.16),
      new THREE.MeshStandardMaterial({ color: '#dcd6c9', roughness: 0.7 })
    );
    shell.position.y = 0.025;
    const tip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.025, 0.08),
      new THREE.MeshStandardMaterial({ color: '#b8b1a3', roughness: 0.5, metalness: 0.4 })
    );
    tip.position.set(0, 0.025, 0.10);
    plug.add(shell); plug.add(tip);
    plug.castShadow = true;
    scene.add(plug);
    this.plug = plug;
  }

  update() {
    // anchor first point to the mouse cable anchor (in world space)
    const anchor = new THREE.Vector3();
    this.mouseObj.userData.cableAnchor.getWorldPosition(anchor);
    this.points[0].copy(anchor);

    // each successive point follows the previous with the desired spacing.
    for (let i = 1; i < this.points.length; i++) {
      const prev = this.points[i - 1];
      const cur = this.points[i];
      const dir = cur.clone().sub(prev);
      const dist = dir.length();
      if (dist > 0.0001) {
        dir.multiplyScalar((dist - this.spacing) / dist);
        cur.sub(dir);
      }
      // gentle gravity drop so cable lays on floor
      cur.y = Math.max(0.025, cur.y - 0.04);
    }

    // rebuild tube
    this.curve.points = this.points;
    const newGeom = new THREE.TubeGeometry(this.curve, 64, 0.025, 8, false);
    this.tube.geometry.dispose();
    this.tube.geometry = newGeom;

    // plug at tail
    const last = this.points[this.points.length - 1];
    const beforeLast = this.points[this.points.length - 2];
    this.plug.position.copy(last);
    this.plug.position.y = 0.02;
    const dir = last.clone().sub(beforeLast);
    dir.y = 0; dir.normalize();
    this.plug.rotation.y = Math.atan2(dir.x, dir.z);
  }
}
