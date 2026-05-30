import * as THREE from 'three';
import { PROJECTS } from './projects.js';
import {
  whiteMatte, darkMatte,
  makePlaceholderTexture, makeLabelTexture,
  makeHeroPlateTexture, makeArtworkTexture, makeFooterTexture,
  makeBillboardTexture
} from './textures.js';

// Room dimensions (units = ~decimeters; ~26 x 32)
export const ROOM = {
  width: 26,
  depth: 28,
  wallH: 3.6,
  outerThick: 0.5,
  chromeH: 1.6 // title bar height (sits above the back wall)
};

// 2 rows x 4 cols of project alcoves, sunken into floor
const COLS = 4;
const ROWS = 2;
const ALCOVE_W = 5.8;
const ALCOVE_D = 7.0;
const ALCOVE_GAP_X = 0.30;
const ALCOVE_GAP_Z = 1.5;

// z layout (back -> front)  [halfD = 16, halfW = 13]
//  -16   back wall
//  -16..-7.2    hero zone
//   -7.2..-0.2  project row 1  (grid 24.85 wide, ±0.6 margin)
//    2.8..9.8   project row 2  (3.0 gap between rows)
//   10.5..12.9  guestbook section  (0.7 gap before, 0.3 gap to footer)
//   13.2..15.8  footer
//   16.0        front edge

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
    new THREE.BoxGeometry(ROOM.width + ROOM.outerThick * 2, ROOM.wallH, ROOM.outerThick),
    wMat
  );
  backWall.position.set(0, ROOM.wallH / 2, -halfD - ROOM.outerThick / 2 + 0.001);
  backWall.castShadow = true; backWall.receiveShadow = true;
  group.add(backWall);

  // side walls (sloped down toward the front — diorama wedge) — light blue
  const sideWallMat = whiteMatte({ color: '#aecde0' });
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(ROOM.depth, 0);
    shape.lineTo(ROOM.depth, 0.6);
    shape.lineTo(0, 0.6);
    shape.lineTo(0, 0);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: ROOM.outerThick, bevelEnabled: false });
    const mesh = new THREE.Mesh(geom, sideWallMat);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(side * (halfW + ROOM.outerThick / 2 - 0.001), 0, -halfD);
    mesh.scale.x = side; // flip so the inside face is inward
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  }

  // --- HERO ZONE (back band, contains title plate + big artwork) ---
  // raised platform behind alcoves
  const heroPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width - 0.6, 0.6, 6.5),
    whiteMatte({ color: '#f3efe6' })
  );
  heroPlatform.position.set(0, 0.30, -halfD + 3.25);
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
  const alcoveBandZ0 = -halfD + 6.5; // top edge of row 1 (back-most)
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
    g.fillText('선택된 작업', 30, 80);
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
        radius: 3.8,
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
    footer.position.set(0, footerH / 2, halfD - 0.8);
    footer.receiveShadow = true; footer.castShadow = true;
    group.add(footer);

    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width - 0.04, 2.58),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })
    );
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, footerH + 0.001, halfD - 0.8);
    group.add(top);
  }

  // ============================================================
  // GUESTBOOK — styled as a 2D website "Contact" section in 3D
  // Sits between the last project row and the footer, like a
  // full-width section of a scrolling portfolio site.
  // Left column = section heading; right = flat 3D form card.
  // ============================================================
  {
    const secZ0    = 9.5;   // natural gap before footer — not touching
    const secDepth = 2.4;
    const secZc    = secZ0 + secDepth / 2;
    const secW     = ROOM.width - 1.0;  // ~27 units wide

    // ── section background panel (like a coloured section bg on a website) ──
    const secPanel = new THREE.Mesh(
      new THREE.BoxGeometry(secW, 0.045, secDepth),
      whiteMatte({ color: '#e4dfd4' })
    );
    secPanel.position.set(0, 0.172, secZc);
    secPanel.receiveShadow = true;
    group.add(secPanel);

    // ── top divider (hairline — mirrors website hr / section boundary) ──
    const divTop = new THREE.Mesh(
      new THREE.BoxGeometry(secW, 0.035, 0.035),
      darkMatte({ color: '#1a1a1a', roughness: 0.95 })
    );
    divTop.position.set(0, 0.198, secZ0 + 0.018);
    group.add(divTop);

    // bottom divider (where section meets footer)
    const divBot = divTop.clone();
    divBot.position.z = secZ0 + secDepth - 0.018;
    group.add(divBot);

    // ── LEFT COLUMN: section number + heading + sub ──────────────────────
    {
      const cw = 640, ch = 320;
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      const g = c.getContext('2d');
      g.fillStyle = '#e4dfd4';
      g.fillRect(0, 0, cw, ch);

      // section index tag
      g.fillStyle = '#a09880';
      g.font = '500 26px ui-monospace, "SF Mono", Menlo, monospace';
      g.fillText('§ 04', 20, 50);

      // large serif heading
      g.fillStyle = '#111';
      g.font = '500 142px "Cormorant Garamond", "Times New Roman", serif';
      g.fillText('방명록', 12, 218);

      // EN label
      g.fillStyle = '#8a8070';
      g.font = '400 28px "Helvetica Neue", Helvetica, Arial, sans-serif';
      g.fillText('GUESTBOOK', 18, 270);

      // subtitle
      g.fillStyle = '#6a6050';
      g.font = '400 24px "Helvetica Neue", Helvetica, Arial, sans-serif';
      g.fillText('한 마디 남겨주세요', 18, 308);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const lbl = new THREE.Mesh(
        new THREE.PlaneGeometry(9.0, 2.1),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88 })
      );
      lbl.rotation.x = -Math.PI / 2;
      lbl.position.set(-7.0, 0.22, secZc - 0.1);
      group.add(lbl);
    }

    // ── RIGHT COLUMN: flat 3D contact-form card ───────────────────────────
    // card base (white card, like a website form container)
    const cardW = 12.0, cardD = secDepth - 0.4;
    const formCard = new THREE.Mesh(
      new THREE.BoxGeometry(cardW, 0.06, cardD),
      whiteMatte({ color: '#faf8f3' })
    );
    formCard.position.set(5.5, 0.22, secZc);
    formCard.castShadow = true; formCard.receiveShadow = true;
    group.add(formCard);

    // card left rule (vertical accent line — like a website form border)
    const cardRule = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.06, cardD - 0.1),
      darkMatte({ color: '#c8c0b0', roughness: 0.9 })
    );
    cardRule.position.set(5.5 - cardW / 2 + 0.06, 0.22, secZc);
    group.add(cardRule);

    // helper to make a flat input-field strip
    function makeField(label, xc, zc, fw, fh) {
      // field track
      const field = new THREE.Mesh(
        new THREE.BoxGeometry(fw, 0.028, fh),
        whiteMatte({ color: '#e0dcd4' })
      );
      field.position.set(xc, 0.264, zc);
      group.add(field);
      // placeholder label on the field
      const fc = document.createElement('canvas');
      fc.width = 512; fc.height = 48;
      const fg = fc.getContext('2d');
      fg.fillStyle = '#e0dcd4';
      fg.fillRect(0, 0, 512, 48);
      fg.fillStyle = '#b0a898';
      fg.font = '400 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
      fg.textBaseline = 'middle';
      fg.fillText(label, 14, 24);
      const ftex = new THREE.CanvasTexture(fc);
      ftex.colorSpace = THREE.SRGBColorSpace;
      const fplane = new THREE.Mesh(
        new THREE.PlaneGeometry(fw, fh),
        new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.88 })
      );
      fplane.rotation.x = -Math.PI / 2;
      fplane.position.set(xc, 0.279, zc);
      group.add(fplane);
    }

    const fcx = 5.5;  // form card center X
    makeField('이름  ·  Name',      fcx, secZc - 0.80, 10.5, 0.55);
    makeField('메시지  ·  Message', fcx, secZc + 0.10, 10.5, 0.80);

    // submit button (dark pill — like a website CTA button)
    const btnW = 3.2, btnH = 0.50;
    const btnMesh = new THREE.Mesh(
      new THREE.BoxGeometry(btnW, 0.072, btnH),
      darkMatte({ color: '#111111', roughness: 0.38, metalness: 0.05 })
    );
    btnMesh.position.set(fcx, 0.26, secZc + 0.95);
    btnMesh.castShadow = true;
    group.add(btnMesh);
    // button label
    {
      const bc = document.createElement('canvas');
      bc.width = 256; bc.height = 48;
      const bg = bc.getContext('2d');
      bg.fillStyle = '#111';
      bg.fillRect(0, 0, 256, 48);
      bg.fillStyle = '#fff';
      bg.font = '600 24px "Helvetica Neue", Helvetica, Arial, sans-serif';
      bg.textAlign = 'center';
      bg.textBaseline = 'middle';
      bg.fillText('남기기  →', 128, 24);
      const btex = new THREE.CanvasTexture(bc);
      btex.colorSpace = THREE.SRGBColorSpace;
      const bplane = new THREE.Mesh(
        new THREE.PlaneGeometry(btnW, btnH),
        new THREE.MeshStandardMaterial({ map: btex, roughness: 0.8 })
      );
      bplane.rotation.x = -Math.PI / 2;
      bplane.position.set(fcx, 0.298, secZc + 0.95);
      group.add(bplane);
    }

    // "ENTER" interaction hint — printed in the card, website-style tooltip
    {
      const hc = document.createElement('canvas');
      hc.width = 384; hc.height = 48;
      const hg = hc.getContext('2d');
      hg.fillStyle = '#faf8f3';
      hg.fillRect(0, 0, 384, 48);
      hg.fillStyle = '#b0a898';
      hg.font = '400 22px ui-monospace, "SF Mono", Menlo, monospace';
      hg.textBaseline = 'middle';
      hg.fillText('[ ENTER ] 눌러서 열기', 12, 24);
      const htex = new THREE.CanvasTexture(hc);
      htex.colorSpace = THREE.SRGBColorSpace;
      const hplane = new THREE.Mesh(
        new THREE.PlaneGeometry(6.0, 0.75),
        new THREE.MeshStandardMaterial({ map: htex, roughness: 0.9 })
      );
      hplane.rotation.x = -Math.PI / 2;
      hplane.position.set(fcx + 2.5, 0.285, secZc - 0.80);
      group.add(hplane);
    }

    group.userData.guestbookPosition = new THREE.Vector3(0, 0, secZc);
    group.userData.guestbookRadius = 3.5;
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
    const trackW = 0.68;                // visible width of the gutter (taller = more top-face area)
    const trackThick = 0.05;

    // recessed gutter (slightly inset, light tone) — runs along right wall
    const gutter = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, trackW, trackLen + 0.4),  // wider X → bigger top face from above
      whiteMatte({ color: '#d4cec2', roughness: 0.85 })
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
      new THREE.BoxGeometry(0.32, trackW - 0.08, thumbLen),
      new THREE.MeshStandardMaterial({
        color: '#1e2845', roughness: 0.45, metalness: 0.10
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

    // bright top-stripe on thumb — clearly visible from above camera angle
    const thumbTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.055, thumbLen - 0.15),
      new THREE.MeshStandardMaterial({ color: '#4d80e8', roughness: 0.28, metalness: 0.20 })
    );
    thumbTop.position.set(sbX - 0.04, sbY + (trackW - 0.08) / 2 + 0.028, thumb.position.z);
    group.add(thumbTop);

    // ── FLOOR-MOUNTED SCROLLBAR INDICATOR (highly visible from above) ──────
    const floorSbX = sbX - 0.32;      // slightly inward from wall thumb
    const floorTrackW = 0.60;
    // track rail on floor
    const floorRail = new THREE.Mesh(
      new THREE.BoxGeometry(floorTrackW, 0.028, trackLen + 0.4),
      whiteMatte({ color: '#c8c2b4', roughness: 0.75 })
    );
    floorRail.position.set(floorSbX, 0.164, (sbZBack + sbZFront) / 2);
    group.add(floorRail);
    // edge trim lines along track (2 thin bright borders)
    [-1, 1].forEach(side => {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.038, trackLen + 0.4),
        new THREE.MeshStandardMaterial({ color: '#8aadcc', roughness: 0.55 })
      );
      trim.position.set(floorSbX + side * (floorTrackW / 2 - 0.02), 0.169, (sbZBack + sbZFront) / 2);
      group.add(trim);
    });
    // sliding thumb on floor
    const floorThumb = new THREE.Mesh(
      new THREE.BoxGeometry(floorTrackW - 0.04, 0.055, thumbLen),
      new THREE.MeshStandardMaterial({ color: '#2255bb', roughness: 0.32, metalness: 0.18 })
    );
    floorThumb.position.set(floorSbX, 0.177, thumb.position.z);
    group.add(floorThumb);

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
        thumbTop.position.z = z;
        floorThumb.position.z = z;
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
  return { group, projectMounts, billboard: group.userData.billboard, scrollbar: group.userData.scrollbar,
           guestbookPosition: group.userData.guestbookPosition, guestbookRadius: group.userData.guestbookRadius };
}

// One alcove: a sunken display case with a small framed image inside.
function buildAlcove(project) {
  const g = new THREE.Group();
  const dark = !!project.dark;

  const platMat  = dark ? darkMatte({ color: '#111111' }) : whiteMatte({ color: '#f7f3ea' });
  const wellMat  = dark ? darkMatte({ color: '#1e1e1e' }) : whiteMatte({ color: '#ece8de' });
  const rimMat   = dark ? darkMatte({ color: '#111111' }) : whiteMatte({ color: '#f7f3ea' });
  const boardMat = dark ? darkMatte({ color: '#181818' }) : whiteMatte({ color: '#fafaf3' });

  // base platform (raised slightly above floor)
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(ALCOVE_W, 0.45, ALCOVE_D),
    platMat
  );
  platform.position.y = 0.225;
  platform.receiveShadow = true; platform.castShadow = true;
  g.add(platform);

  // sunken inset (the "well" inside)
  const wellW = ALCOVE_W - 0.7;
  const wellD = ALCOVE_D * 0.55;
  const well = new THREE.Mesh(
    new THREE.BoxGeometry(wellW, 0.32, wellD),
    wellMat
  );
  well.position.set(0, 0.225 - 0.16, -ALCOVE_D * 0.05);
  well.receiveShadow = true;
  g.add(well);

  // raised inner walls forming the well rim
  const rimT = 0.06;
  const wellH = 0.36;
  const rb = new THREE.Mesh(
    new THREE.BoxGeometry(wellW + rimT * 2, wellH, rimT),
    rimMat
  );
  rb.position.set(0, 0.45 + wellH / 2 - 0.001, -ALCOVE_D * 0.05 - wellD / 2);
  g.add(rb);
  const rf = rb.clone();
  rf.position.z = -ALCOVE_D * 0.05 + wellD / 2;
  g.add(rf);
  const rl = new THREE.Mesh(
    new THREE.BoxGeometry(rimT, wellH, wellD + rimT * 2),
    rimMat
  );
  rl.position.set(-wellW / 2 - rimT / 2, 0.45 + wellH / 2 - 0.001, -ALCOVE_D * 0.05);
  g.add(rl);
  const rr = rl.clone(); rr.position.x = wellW / 2 + rimT / 2; g.add(rr);

  // artwork standing inside the well (small framed plane)
  const artTex = makePlaceholderTexture('[ ' + project.titleEn + ' ]', project.tone, project.accent, !!project.wip);
  const artScale = project.wip ? 0.58 : 0.78;
  const artW = wellW * artScale;
  const artH = artW * 0.78;
  const artMat = new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.6 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(artW, artH), artMat);
  art.position.set(0, 0.225 - 0.32 + artH / 2 + 0.05, -ALCOVE_D * 0.05);
  art.rotation.x = -0.06;
  art.castShadow = true;
  g.add(art);

  // swap in real cover image when available
  if (project.cover) {
    new THREE.TextureLoader().load(project.cover, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      artMat.map = tex;
      artMat.needsUpdate = true;
    });
  }

  // little back board behind the art
  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(artW + 0.12, artH + 0.12, 0.04),
    boardMat
  );
  backboard.position.set(0, art.position.y, art.position.z - 0.03);
  backboard.rotation.x = art.rotation.x;
  backboard.castShadow = true;
  g.add(backboard);

  // label plate on the platform (front face)
  const lblTex = makeLabelTexture(project.code, project.title, project.tags, 720, 240, dark);
  const labelMat = new THREE.MeshStandardMaterial({ map: lblTex, roughness: 0.92 });
  const labelW = ALCOVE_W - 0.4;
  const labelH = labelW * (240 / 720);
  const labelPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(labelW, labelH),
    labelMat
  );
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
  const mat = whiteMatte({ color: '#aecde0' });

  // top edge (back) — capped to room width to avoid back-corner protrusion
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width - 0.2, frameRise, frameThickness + 0.4),
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
    new THREE.BoxGeometry(frameThickness, frameRise, ROOM.depth + frameThickness * 2 - 0.4),
    mat
  );
  left.position.set(-halfW - frameThickness / 2 - 0.5, frameY + frameRise / 2, 0.4);
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
  const barW = ROOM.width + ROOM.outerThick * 2; // covers full outer frame including side walls

  // base slab (the title bar body)
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(barW, ROOM.chromeH, 0.45),
    whiteMatte({ color: '#aecde0' })
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
