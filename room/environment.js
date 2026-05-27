import * as THREE from 'three';
import { PROJECTS } from './projects.js';
import {
  whiteMatte, darkMatte,
  makePlaceholderTexture, makeLabelTexture,
  makeHeroPlateTexture, makeArtworkTexture, makeFooterTexture,
  makeBillboardTexture
} from './textures.js';

// Room dimensions (units = ~decimeters; ~28 x 28)
export const ROOM = {
  width: 28,
  depth: 28,
  wallH: 3.6,
  outerThick: 0.5,
  chromeH: 1.6 // title bar height (sits above the back wall)
};

// 2 rows x 4 cols of project alcoves, sunken into floor
const COLS = 4;
const ROWS = 2;
const ALCOVE_W = 4.4;
const ALCOVE_D = 4.4;
const ALCOVE_GAP_X = 0.55;
const ALCOVE_GAP_Z = 0.6;

// z layout (back -> front)
//   -11   back wall
//   -11..-3.5    hero zone (height stuff against back wall)
//   -3.2..1.0    project row 1
//    1.6..5.8    project row 2
//    6.0..8.5    footer (dark)
//    9.0    front edge

export function buildEnvironment(scene) {
  const group = new THREE.Group();
  const projectMounts = []; // { mesh, position, project }

  // --- base plinth (the whole model sits on this) ---
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width + 1.2, 0.6, ROOM.depth + 1.2),
    whiteMatte({ color: '#efece4' })
  );
  plinth.position.y = -0.6;
  plinth.receiveShadow = true;
  group.add(plinth);

  // --- floor ---
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width, 0.3, ROOM.depth),
    whiteMatte({ color: '#f6f3ec' })
  );
  floor.position.y = -0.15;
  floor.receiveShadow = true;
  group.add(floor);

  // --- outer walls (low, like an architectural model — not full-height) ---
  const wMat = whiteMatte({ color: '#faf7f0' });
  const halfW = ROOM.width / 2;
  const halfD = ROOM.depth / 2;

  // outer window frame (the rounded macOS-style border that surrounds the whole "page")
  buildWindowFrame(group, halfW, halfD);

  // browser chrome — title bar at the BACK of the room (= top of the original 2D window)
  buildChrome(group, halfW, halfD);

  // back wall (full height)
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width, ROOM.wallH, ROOM.outerThick),
    wMat
  );
  backWall.position.set(0, ROOM.wallH / 2, -halfD - ROOM.outerThick / 2 + 0.001);
  backWall.castShadow = true; backWall.receiveShadow = true;
  group.add(backWall);

  // side walls (sloped down toward the front — diorama wedge)
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(ROOM.depth, 0);
    shape.lineTo(ROOM.depth, 0.6); // front edge low
    shape.lineTo(0, ROOM.wallH);   // back edge tall
    shape.lineTo(0, 0);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: ROOM.outerThick, bevelEnabled: false });
    const mesh = new THREE.Mesh(geom, wMat);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(side * (halfW + ROOM.outerThick / 2 - 0.001), 0, -halfD);
    mesh.scale.x = side; // flip so the inside face is inward
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  }

  // --- HERO ZONE (back band, contains title plate + big artwork) ---
  // raised platform behind alcoves
  const heroPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width - 0.6, 0.6, 8.0),
    whiteMatte({ color: '#f3efe6' })
  );
  heroPlatform.position.set(0, 0.30, -halfD + 4.0 + 0.3);
  heroPlatform.receiveShadow = true; heroPlatform.castShadow = true;
  group.add(heroPlatform);

  // hero title plate — FREE-STANDING board pulled forward off the back wall
  // so it no longer occludes the 3D window chrome / title bar behind it.
  // Mounted on a slim white backboard + two short legs (like a sandwich board).
  {
    const tex = makeHeroPlateTexture();
    const plateW = 6.0, plateH = 6.0;
    const standX = -halfW / 2 - 1.6;
    const standY = plateH / 2 + 0.55;     // floats above floor
    const standZ = -halfD + 3.2;          // pulled FORWARD ~3 units off the back wall

    // backboard slab (white) — slightly larger than the printed face
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(plateW + 0.22, plateH + 0.22, 0.12),
      whiteMatte({ color: '#fefcf6' })
    );
    back.position.set(standX, standY, standZ);
    back.castShadow = true; back.receiveShadow = true;
    group.add(back);

    // printed face
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(plateW, plateH),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 })
    );
    plate.position.set(standX, standY, standZ + 0.07);
    plate.receiveShadow = true;
    group.add(plate);

    // two short black legs anchoring it to the hero platform
    for (const dx of [-plateW * 0.35, plateW * 0.35]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.55, 0.10),
        darkMatte({ color: '#1a1a1a' })
      );
      leg.position.set(standX + dx, 0.55 / 2 + 0.30, standZ);
      leg.castShadow = true; leg.receiveShadow = true;
      group.add(leg);
    }
  }

  // hero DIGITAL BILLBOARD — replaces the old painted tree artwork.
  // A freestanding LED-style screen pulled FORWARD into the room with a
  // chunky black bezel, side support struts, and a small power-strip base.
  // The screen contents (kicker / headline / channel ID) auto-cycle every
  // few seconds via billboard.update(t) called from the main render loop.
  let billboard = null;
  {
    const bb = makeBillboardTexture();
    billboard = bb;
    const w = 9.6, h = 5.6;
    const bezelT = 0.32;

    const xCenter = halfW / 2 + 0.4;
    const yCenter = h / 2 + 1.5;
    const zCenter = -halfD + 3.6; // pulled FORWARD off the back wall

    // black bezel/frame
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(w + bezelT * 2, h + bezelT * 2, 0.30),
      darkMatte({ color: '#0c0c10', roughness: 0.55 })
    );
    bezel.position.set(xCenter, yCenter, zCenter);
    bezel.castShadow = true; bezel.receiveShadow = true;
    group.add(bezel);

    // the actual screen surface — emissive so it glows like an LED panel
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map: bb.texture,
        emissiveMap: bb.texture,
        emissive: '#ffffff',
        emissiveIntensity: 0.85,
        roughness: 0.35,
        metalness: 0
      })
    );
    screen.position.set(xCenter, yCenter, zCenter + 0.16);
    group.add(screen);

    // soft glow plane behind the bezel (faint colored light spill)
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 2.0, h + 1.6),
      new THREE.MeshBasicMaterial({
        color: '#7ab7ff',
        transparent: true, opacity: 0.10,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    glow.position.set(xCenter, yCenter, zCenter - 0.20);
    group.add(glow);

    // two side support struts
    for (const dx of [-w / 2 - bezelT - 0.18, w / 2 + bezelT + 0.18]) {
      const strut = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, h + bezelT * 2 + 0.6, 0.14),
        darkMatte({ color: '#1a1a1f' })
      );
      strut.position.set(xCenter + dx, yCenter - 0.2, zCenter - 0.05);
      strut.castShadow = true; strut.receiveShadow = true;
      group.add(strut);
    }

    // base power strip under the screen
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(w + bezelT * 2 + 0.8, 0.34, 0.7),
      darkMatte({ color: '#0e0e12' })
    );
    base.position.set(xCenter, 0.5, zCenter - 0.05);
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);

    // tiny red power indicator
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 6),
      new THREE.MeshStandardMaterial({
        color: '#ff3a3a', emissive: '#ff3a3a', emissiveIntensity: 1.2
      })
    );
    led.position.set(xCenter + (w / 2 + bezelT) - 0.1, 0.5, zCenter + 0.30);
    group.add(led);
  }
  // expose billboard's update fn for the render loop
  group.userData.billboard = billboard;

  // (Removed: vertical "Borisusu" sidewall sign — redundant with the hero plate.)

  // --- PROJECT ALCOVES ---
  // grid starts under the hero platform (z = -halfD + 8.6 = ~ -2.4 + something)
  const alcoveBandZ0 = -halfD + 8.8; // top edge of row 1 (back-most)
  const totalGridW = COLS * ALCOVE_W + (COLS - 1) * ALCOVE_GAP_X;
  const startX = -totalGridW / 2 + ALCOVE_W / 2;

  // small left-side "SELECTED WORK" label panel
  {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#f6f3ec'; g.fillRect(0,0,c.width,c.height);
    g.fillStyle = '#5b5b5b';
    g.font = '600 28px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.fillText('SELECTED WORK', 30, 80);
    g.fillStyle = '#0d0d0d';
    g.font = '600 96px "Cormorant Garamond", serif';
    g.fillText('프로젝트', 26, 190);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 2.2),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
    );
    plate.position.set(-halfW + 3.4, 0.62, alcoveBandZ0 - 0.5);
    plate.rotation.x = -Math.PI / 2;
    plate.receiveShadow = true;
    group.add(plate);
  }

  // Build alcoves
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const project = PROJECTS[idx];
      const cx = startX + c * (ALCOVE_W + ALCOVE_GAP_X);
      const cz = alcoveBandZ0 + ALCOVE_D / 2 + r * (ALCOVE_D + ALCOVE_GAP_Z);

      const alcove = buildAlcove(project);
      alcove.position.set(cx, 0, cz);
      group.add(alcove);

      projectMounts.push({
        project,
        position: new THREE.Vector3(cx, 0, cz),
        radius: 2.4,
        platform: alcove.userData.platform
      });
    }
  }

  // --- FOOTER (dark band at front) ---
  {
    const tex = makeFooterTexture();
    const footerH = 0.5;
    const footer = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM.width, footerH, 2.6),
      darkMatte({ color: '#0d0d10' })
    );
    footer.position.set(0, footerH / 2, halfD - 1.5);
    footer.receiveShadow = true; footer.castShadow = true;
    group.add(footer);

    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width - 0.04, 2.58),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })
    );
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, footerH + 0.001, halfD - 1.5);
    group.add(top);
  }

  // ============== 3D SCROLLBAR (right inside-wall) ==============
  // A real browser-scrollbar built into the room. Sits on the inside face
  // of the right wall, running back-to-front, with a chunky pill-shaped
  // thumb that the main loop slides up/down to track the character's
  // depth (Z) position. Exposed via group.userData.scrollbar.
  let scrollbar = null;
  {
    const sbX = halfW - 0.32;           // inset slightly off the inner wall face
    const sbZBack  = -halfD + 1.4;      // top of track (back of room)
    const sbZFront = +halfD - 3.4;      // bottom of track (in front of footer band)
    const sbY = 1.2;                    // mid-height
    const trackLen = sbZFront - sbZBack;
    const trackW = 0.45;                // visible width of the gutter
    const trackThick = 0.05;

    // recessed gutter (slightly inset, light tone) — runs along right wall
    const gutter = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, trackW, trackLen + 0.4),
      whiteMatte({ color: '#ece8de', roughness: 0.9 })
    );
    gutter.rotation.x = 0; // flat against wall, long axis = Z
    gutter.position.set(sbX, sbY, (sbZBack + sbZFront) / 2);
    gutter.receiveShadow = true;
    group.add(gutter);

    // arrow caps at each end
    function makeCap(zPos, pointForward) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, trackW + 0.05, 0.45),
        whiteMatte({ color: '#dcd6c8' })
      );
      cap.position.set(sbX, sbY, zPos);
      group.add(cap);
      // arrow indicator (small dark triangle, drawn as canvas plane)
      const ac = document.createElement('canvas');
      ac.width = 64; ac.height = 64;
      const ag = ac.getContext('2d');
      ag.fillStyle = '#444';
      ag.beginPath();
      if (pointForward) {
        ag.moveTo(20, 18); ag.lineTo(44, 32); ag.lineTo(20, 46);
      } else {
        ag.moveTo(44, 18); ag.lineTo(20, 32); ag.lineTo(44, 46);
      }
      ag.closePath(); ag.fill();
      const at = new THREE.CanvasTexture(ac);
      at.colorSpace = THREE.SRGBColorSpace;
      const arrow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.28),
        new THREE.MeshStandardMaterial({ map: at, transparent: true, roughness: 0.9 })
      );
      arrow.rotation.y = -Math.PI / 2; // face into the room (-X)
      arrow.position.set(sbX - 0.10, sbY, zPos);
      group.add(arrow);
    }
    makeCap(sbZBack  - 0.30, false); // back cap, arrow points back
    makeCap(sbZFront + 0.30, true);  // front cap, arrow points forward

    // tick marks every ~25% along the track
    for (let k = 1; k <= 3; k++) {
      const tz = sbZBack + (trackLen * k / 4);
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.20, 0.015, 0.04),
        darkMatte({ color: '#aaa', roughness: 0.9 })
      );
      tick.position.set(sbX - 0.001, sbY + trackW / 2 - 0.04, tz);
      group.add(tick);
    }

    // THUMB — chunky dark pill that rides along the gutter on Z
    const thumbLen = 2.6;
    const thumb = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, trackW - 0.10, thumbLen),
      new THREE.MeshStandardMaterial({
        color: '#1a1a1a', roughness: 0.55, metalness: 0.05
      })
    );
    thumb.castShadow = true;
    thumb.position.set(sbX - 0.05, sbY, (sbZBack + sbZFront) / 2);
    group.add(thumb);

    // a thin white inset stripe on the thumb (gives it a grip look)
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.012, thumbLen * 0.6),
      whiteMatte({ color: '#bbb6a8' })
    );
    grip.position.set(sbX - 0.14, sbY, thumb.position.z);
    group.add(grip);

    // vertical "DEPTH" label etched onto the wall above the back cap
    {
      const lc = document.createElement('canvas');
      lc.width = 256; lc.height = 64;
      const lg = lc.getContext('2d');
      lg.fillStyle = '#f6f3ec'; lg.fillRect(0, 0, 256, 64);
      lg.fillStyle = '#555';
      lg.font = '500 28px ui-monospace, "SF Mono", Menlo, monospace';
      lg.textBaseline = 'middle';
      lg.fillText('DEPTH · SCROLL', 16, 36);
      const lt = new THREE.CanvasTexture(lc);
      lt.colorSpace = THREE.SRGBColorSpace;
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 0.5),
        new THREE.MeshStandardMaterial({ map: lt, roughness: 0.92 })
      );
      label.rotation.y = -Math.PI / 2;
      label.position.set(sbX - 0.04, sbY + trackW + 0.5, sbZBack + 0.4);
      group.add(label);
    }

    // expose for main.js to drive
    scrollbar = {
      setProgress(frac) {
        // frac 0 = front of room (top of viewport), 1 = back (bottom)
        // In real browser scrollbars: top = back content; our world: -Z = back.
        // We want: character at -Z (back) → thumb at back end (sbZBack).
        //          character at +Z (front) → thumb at front end (sbZFront).
        const f = THREE.MathUtils.clamp(frac, 0, 1);
        const z = sbZBack + f * trackLen;
        thumb.position.z = z;
        grip.position.z = z;
      },
      sbZBack, sbZFront, trackLen
    };
  }
  group.userData.scrollbar = scrollbar;

  // small "전체보기" sidewalk on the right

  // tiny "→" arrow plate (relocated to the floor near the front-right)
  {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#efece4'; g.fillRect(0,0,c.width,c.height);
    g.fillStyle = '#1a1a1a';
    g.font = '600 28px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.fillText('전체보기  →', 36, 78);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.9),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
    );
    plate.position.set(halfW - 2.6, 0.02, 4.0);
    plate.rotation.x = -Math.PI / 2;
    group.add(plate);
  }

  scene.add(group);
  return { group, projectMounts, billboard: group.userData.billboard, scrollbar: group.userData.scrollbar };
}

// One alcove: a sunken display case with a small framed image inside.
function buildAlcove(project) {
  const g = new THREE.Group();

  // base platform (raised slightly above floor)
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(ALCOVE_W, 0.45, ALCOVE_D),
    whiteMatte({ color: '#f7f3ea' })
  );
  platform.position.y = 0.225;
  platform.receiveShadow = true; platform.castShadow = true;
  g.add(platform);

  // sunken inset (the "well" inside)
  const wellW = ALCOVE_W - 0.7;
  const wellD = ALCOVE_D * 0.55;
  const well = new THREE.Mesh(
    new THREE.BoxGeometry(wellW, 0.32, wellD),
    whiteMatte({ color: '#ece8de' })
  );
  well.position.set(0, 0.225 + 0.45 / 2 - 0.32 / 2 + 0.001, -ALCOVE_D * 0.05);
  // actually simulate "sinking": raise platform with inner walls; easier to drop the floor
  well.position.set(0, 0.225 - 0.16, -ALCOVE_D * 0.05);
  well.receiveShadow = true;
  g.add(well);

  // raised inner walls forming the well rim
  const rimMat = whiteMatte({ color: '#f7f3ea' });
  const rimT = 0.06;
  const wellH = 0.36;
  // back rim
  const rb = new THREE.Mesh(
    new THREE.BoxGeometry(wellW + rimT * 2, wellH, rimT),
    rimMat
  );
  rb.position.set(0, 0.45 + wellH / 2 - 0.001, -ALCOVE_D * 0.05 - wellD / 2);
  g.add(rb);
  // front rim
  const rf = rb.clone();
  rf.position.z = -ALCOVE_D * 0.05 + wellD / 2;
  g.add(rf);
  // left rim
  const rl = new THREE.Mesh(
    new THREE.BoxGeometry(rimT, wellH, wellD + rimT * 2),
    rimMat
  );
  rl.position.set(-wellW / 2 - rimT / 2, 0.45 + wellH / 2 - 0.001, -ALCOVE_D * 0.05);
  g.add(rl);
  const rr = rl.clone(); rr.position.x = wellW / 2 + rimT / 2; g.add(rr);

  // artwork standing inside the well (small framed plane)
  const artTex = makePlaceholderTexture('[ ' + project.titleEn + ' ]', project.tone, project.accent);
  const artW = wellW * 0.78;
  const artH = artW * 0.78;
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(artW, artH),
    new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.6 })
  );
  // tilt slightly back, sit on well floor
  art.position.set(0, 0.225 - 0.32 + artH / 2 + 0.05, -ALCOVE_D * 0.05);
  art.rotation.x = -0.06;
  art.castShadow = true;
  g.add(art);

  // little back board behind the art
  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(artW + 0.12, artH + 0.12, 0.04),
    whiteMatte({ color: '#fafaf3' })
  );
  backboard.position.set(0, art.position.y, art.position.z - 0.03);
  backboard.rotation.x = art.rotation.x;
  backboard.castShadow = true;
  g.add(backboard);

  // label plate on the platform (front face) — printed in the "lip" area
  const lblTex = makeLabelTexture(project.code, project.title, project.tags, 720, 240);
  const labelMat = new THREE.MeshStandardMaterial({ map: lblTex, roughness: 0.92 });
  const labelW = ALCOVE_W - 0.4;
  const labelH = labelW * (240 / 720);
  const labelPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(labelW, labelH),
    labelMat
  );
  // sit on the platform-top, front portion
  labelPlate.position.set(0, 0.451, ALCOVE_D / 2 - labelH / 2 - 0.15);
  labelPlate.rotation.x = -Math.PI / 2;
  g.add(labelPlate);

  g.userData.platform = platform;
  return g;
}

// ----------------- Browser window chrome -----------------

// The whole model sits inside a rounded outer frame — like a macOS window border.
function buildWindowFrame(group, halfW, halfD) {
  const frameThickness = 0.6;
  const frameRise = 0.4;
  const frameY = -0.15;
  const mat = whiteMatte({ color: '#e7e1d3' });

  // top edge (back) — thicker, since this also becomes the chrome shelf base
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width + frameThickness * 2 + 1.0, frameRise, frameThickness + 0.4),
    mat
  );
  top.position.set(0, frameY + frameRise / 2, -halfD - frameThickness / 2 - 0.2);
  top.castShadow = true; top.receiveShadow = true;
  group.add(top);

  // bottom edge (front)
  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width + frameThickness * 2 + 1.0, frameRise, frameThickness),
    mat
  );
  bottom.position.set(0, frameY + frameRise / 2, halfD + frameThickness / 2);
  bottom.castShadow = true; bottom.receiveShadow = true;
  group.add(bottom);

  // left edge
  const left = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, frameRise, ROOM.depth + frameThickness * 2 + 0.6),
    mat
  );
  left.position.set(-halfW - frameThickness / 2 - 0.5, frameY + frameRise / 2, -0.1);
  left.castShadow = true; left.receiveShadow = true;
  group.add(left);

  // right edge
  const right = left.clone();
  right.position.x = halfW + frameThickness / 2 + 0.5;
  group.add(right);
}

// The "title bar" — a horizontal panel sitting on top of the back wall,
// fronted with traffic lights, a URL pill, and nav tabs.
function buildChrome(group, halfW, halfD) {
  const chromeY = ROOM.wallH + ROOM.chromeH / 2 + 0.05;
  const chromeZ = -halfD - 0.05; // flush with back wall
  const barW = ROOM.width + 1.2;

  // base slab (the title bar body)
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(barW, ROOM.chromeH, 0.45),
    whiteMatte({ color: '#f1ede2' })
  );
  slab.position.set(0, chromeY, chromeZ);
  slab.castShadow = true; slab.receiveShadow = true;
  group.add(slab);

  // a slim shadow line right where the bar meets the page (back wall top)
  const shadowLip = new THREE.Mesh(
    new THREE.BoxGeometry(barW + 0.1, 0.06, 0.5),
    whiteMatte({ color: '#d6d0c2', roughness: 0.95 })
  );
  shadowLip.position.set(0, ROOM.wallH + 0.02, chromeZ + 0.05);
  group.add(shadowLip);

  const faceZ = chromeZ + 0.45 / 2 + 0.001; // front face

  // ----- Traffic lights (3 small discs) -----
  const lightDefs = [
    { color: '#ff5f57', x: -barW / 2 + 1.0 },
    { color: '#febc2e', x: -barW / 2 + 1.6 },
    { color: '#28c840', x: -barW / 2 + 2.2 }
  ];
  for (const l of lightDefs) {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.08, 24),
      new THREE.MeshStandardMaterial({
        color: l.color,
        roughness: 0.45,
        metalness: 0.05,
        emissive: l.color,
        emissiveIntensity: 0.18
      })
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.set(l.x, chromeY + 0.08, faceZ + 0.04);
    disc.castShadow = true;
    group.add(disc);
  }

  // back/forward/reload — tiny mono shapes
  const navIcons = ['‹', '›', '↻'];
  navIcons.forEach((sym, i) => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#f1ede2'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#444';
    g.font = '500 76px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(sym, 64, 70);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 })
    );
    m.position.set(-barW / 2 + 3.3 + i * 0.65, chromeY + 0.08, faceZ);
    group.add(m);
  });

  // ----- URL pill (centered) -----
  {
    const urlW = 12.0, urlH = 0.85;
    const pill = new THREE.Mesh(
      new THREE.BoxGeometry(urlW, urlH, 0.18),
      whiteMatte({ color: '#fafaf3' })
    );
    pill.position.set(0, chromeY + 0.05, faceZ + 0.09);
    pill.castShadow = true;
    group.add(pill);

    // url text texture
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 80;
    const g = c.getContext('2d');
    g.fillStyle = '#fafaf3'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#666';
    g.font = '500 40px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('🔒  borisusu.com', c.width / 2, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const txt = new THREE.Mesh(
      new THREE.PlaneGeometry(urlW * 0.92, urlH * 0.92),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, transparent: true })
    );
    txt.position.set(0, chromeY + 0.05, faceZ + 0.19);
    group.add(txt);
  }

  // ----- Right-side window icons (tab list, share) -----
  ['⇪','+','▢','▢'].forEach((sym, i) => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#f1ede2'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#555';
    g.font = '500 64px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(sym, 64, 72);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 })
    );
    m.position.set(barW / 2 - 2.8 + i * 0.6, chromeY + 0.05, faceZ);
    group.add(m);
  });

  // ----- Site nav bar — a SECONDARY shelf just BELOW the chrome, with Works/About/Films/Contact -----
  // This sits flush with the inside of the back wall (z = -halfD + tiny offset) so it reads
  // as "navigation built into the page".
  const navY = ROOM.wallH - 0.55;
  const navZ = -halfD + 0.28;
  const navBarW = ROOM.width * 0.85;
  const navBar = new THREE.Mesh(
    new THREE.BoxGeometry(navBarW, 0.7, 0.06),
    whiteMatte({ color: '#fdfaf2' })
  );
  navBar.position.set(0, navY, navZ);
  group.add(navBar);

  // brand mark (left side of nav)
  {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#fdfaf2'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#1a1a1a';
    g.font = '600 56px "Cormorant Garamond", "Times New Roman", serif';
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('Borisusu', 16, c.height / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 0.7),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, transparent: true })
    );
    m.position.set(-navBarW / 2 + 2.4, navY, navZ + 0.04);
    group.add(m);
  }

  // nav tabs (Works | About | Films | Contact)
  const labels = ['Works', 'About', 'Films', 'Contact'];
  labels.forEach((label, i) => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#fdfaf2'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#1a1a1a';
    g.font = '500 46px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, c.width / 2, c.height / 2 + 4);
    if (i === 0) {
      // active underline
      g.fillRect(c.width / 2 - 38, c.height - 12, 76, 3);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.7),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, transparent: true })
    );
    // distribute on the right side of the nav bar
    const span = 6.2;
    const startX = navBarW / 2 - span;
    m.position.set(startX + i * (span / 3.2), navY, navZ + 0.04);
    group.add(m);
  });
}
