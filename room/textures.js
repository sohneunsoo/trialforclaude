import * as THREE from 'three';

// Generate a striped placeholder texture with a label, for project art.
export function makePlaceholderTexture(label, tone = "#dcd7cc", accent = "#444") {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 384;
  const g = c.getContext('2d');

  // ground
  g.fillStyle = tone;
  g.fillRect(0, 0, c.width, c.height);

  // diagonal stripes
  g.save();
  g.translate(c.width / 2, c.height / 2);
  g.rotate(-Math.PI / 5);
  g.translate(-c.width, -c.height);
  for (let x = 0; x < c.width * 2; x += 28) {
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(x, 0, 14, c.height * 2);
  }
  g.restore();

  // soft vignette
  const grad = g.createRadialGradient(c.width/2, c.height/2, 60, c.width/2, c.height/2, c.width * 0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  // label chip
  g.fillStyle = 'rgba(0,0,0,0.55)';
  const w = 200, h = 36;
  g.fillRect(24, c.height - 24 - h, w, h);
  g.fillStyle = '#fff';
  g.font = '600 14px ui-monospace, "SF Mono", Menlo, monospace';
  g.textBaseline = 'middle';
  g.fillText(label, 36, c.height - 24 - h / 2);

  // accent corner mark
  g.fillStyle = accent;
  g.fillRect(c.width - 56, 24, 32, 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Subtle paper-like normal/roughness for matte walls: solid white material.
export function whiteMatte(opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: opts.color || '#f6f3ec',
    roughness: opts.roughness ?? 0.95,
    metalness: 0,
    ...opts
  });
}

export function darkMatte(opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: opts.color || '#15161a',
    roughness: opts.roughness ?? 0.6,
    metalness: 0,
    ...opts
  });
}

// Generate a small canvas with two lines of text used as a label sticker.
export function makeLabelTexture(code, title, subtitle, width = 720, height = 240, darkMode = false) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const g = c.getContext('2d');
  g.fillStyle = darkMode ? '#0d0d0d' : '#f6f3ec';
  g.fillRect(0, 0, width, height);

  g.fillStyle = darkMode ? '#888888' : '#1a1a1a';
  g.font = '600 38px "Helvetica Neue", Helvetica, Arial, sans-serif';
  g.textBaseline = 'top';
  g.fillText(code, 24, 24);

  g.fillStyle = darkMode ? '#ffffff' : '#1a1a1a';
  g.font = '600 56px "Helvetica Neue", Helvetica, Arial, sans-serif';
  // wrap title if needed
  const words = title.split(' ');
  let line = ''; let y = 76; const maxW = width - 48;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW) {
      g.fillText(line, 24, y); y += 60; line = w;
    } else line = test;
  }
  g.fillText(line, 24, y); y += 64;

  g.fillStyle = darkMode ? '#666666' : '#777';
  g.font = '500 28px "Helvetica Neue", Helvetica, Arial, sans-serif';
  g.fillText(subtitle, 24, y);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Hero wall texture — Borisusu title plate
export function makeHeroPlateTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f3ec';
  g.fillRect(0, 0, c.width, c.height);

  // small star + korean tagline
  g.fillStyle = '#1a1a1a';
  g.font = '500 30px "Helvetica Neue", Helvetica, Arial, sans-serif';
  g.fillText('★  호미에서 드론까지', 80, 200);
  g.fillText('     기술과 상상을 넘나드는 창작자', 80, 240);

  g.font = '600 220px "Cormorant Garamond", "Times New Roman", serif';
  g.fillStyle = '#0d0d0d';
  g.fillText('Borisusu', 80, 470);

  g.fillStyle = '#3a3a3a';
  g.font = '400 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
  g.fillText('기획과 예술, 이야기를 연결하여', 80, 700);
  g.fillText('새로운 경험을 만드는 크리에이터입니다.', 80, 736);

  // WORK button
  g.fillStyle = '#0d0d0d';
  g.fillRect(80, 820, 280, 78);
  g.fillStyle = '#fff';
  g.font = '600 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
  g.fillText('WORK 보기  →', 110, 870);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// =====================================================================
// Animated digital billboard texture.
// Returns { texture, update(elapsed) } — call update() each frame to
// cycle through "slides" with a smooth crossfade. Each slide is rendered
// to a canvas (gradient bg + headline + sub + chip), giving it a punchy
// LED-screen look. We also overlay a subtle scanline pattern and a tiny
// "LIVE" pulse dot so it reads as a screen, not a poster.
// =====================================================================
export function makeBillboardTexture() {
  const W = 1024, H = 640;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  const slides = [
    { bg1: '#1a2a55', bg2: '#0a1230', accent: '#ffd24a',
      kicker: 'NOW SHOWING',  big: 'BORISUSU',     sub: 'CREATIVE STUDIO · SEOUL · 2026' },
    { bg1: '#3b0d2e', bg2: '#761a4d', accent: '#fff0c2',
      kicker: 'NEW DROP',     big: 'AURORA / 05',  sub: 'INTERACTIVE FILM · STREAMING SOON' },
    { bg1: '#0e3a2a', bg2: '#176b4a', accent: '#ffe085',
      kicker: 'IN ROTATION',  big: 'FIELD NOTES',  sub: 'DESIGN DIARY · WEEKLY' },
    { bg1: '#c43a1f', bg2: '#7a1d0e', accent: '#fff3d6',
      kicker: 'CAMPAIGN',     big: 'KIOSK·22',     sub: 'WAYFINDING · PUBLIC PROJECT' },
    { bg1: '#101014', bg2: '#2a2a36', accent: '#7af7c9',
      kicker: 'TONIGHT',      big: 'LATE NIGHT',   sub: 'LIVE SET · 23:00 KST' },
    { bg1: '#0d0d1a', bg2: '#1a1a3a', accent: '#a8d8ff',
      kicker: 'AI 시리즈',
      big: 'AI 4차 산업\n부랴부랴 따라잡기', bigSize: 76,
      sub: '부제: AI 아이돌 만들기(?)' },
    { bg1: '#1a0a2e', bg2: '#2e1a4a', accent: '#ffb3d9',
      kicker: '부제',
      big: 'AI 아이돌\n만들기(?)', bigSize: 88,
      sub: 'AI 4차 산업 부랴부랴 따라잡기' },
  ];

  // pre-render each slide to its own offscreen canvas so we can crossfade
  // between them without re-painting from scratch every frame.
  const slideCanvases = slides.map(s => renderSlide(s, W, H));

  function renderSlide(s, w, h) {
    const cc = document.createElement('canvas');
    cc.width = w; cc.height = h;
    const gg = cc.getContext('2d');
    // gradient background
    const grad = gg.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, s.bg1);
    grad.addColorStop(1, s.bg2);
    gg.fillStyle = grad;
    gg.fillRect(0, 0, w, h);

    // subtle radial highlight upper-left
    const r = gg.createRadialGradient(w * 0.25, h * 0.25, 40, w * 0.25, h * 0.25, w * 0.7);
    r.addColorStop(0, 'rgba(255,255,255,0.18)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    gg.fillStyle = r;
    gg.fillRect(0, 0, w, h);

    // kicker pill
    gg.fillStyle = s.accent;
    const kickerText = s.kicker;
    gg.font = '600 28px "Helvetica Neue", Helvetica, Arial, sans-serif';
    const tw = gg.measureText(kickerText).width;
    gg.fillRect(60, 60, tw + 44, 50);
    gg.fillStyle = '#000';
    gg.textBaseline = 'middle';
    gg.fillText(kickerText, 60 + 22, 60 + 25);

    // big headline — supports \n line breaks and custom bigSize
    gg.fillStyle = '#fff';
    gg.textBaseline = 'alphabetic';
    const bigSize = s.bigSize || 168;
    const bigFont = bigSize >= 100
      ? `700 ${bigSize}px "Cormorant Garamond", "Times New Roman", serif`
      : `700 ${bigSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    gg.font = bigFont;
    const bigLines = s.big.split('\n');
    const lineH = bigSize * 1.18;
    // centre the block vertically in the upper 2/3 of the canvas
    const blockH = bigLines.length * lineH;
    let bigY = (h * 0.62 - blockH) / 2 + lineH;
    bigY = Math.max(bigY, 140); // never overlap kicker
    for (const line of bigLines) {
      gg.fillText(line, 60, bigY);
      bigY += lineH;
    }

    // subtitle
    gg.fillStyle = 'rgba(255,255,255,0.78)';
    gg.font = '500 30px "Helvetica Neue", Helvetica, Arial, sans-serif';
    gg.fillText(s.sub, 60, bigY + 18);

    // tiny bottom strip
    gg.fillStyle = 'rgba(0,0,0,0.35)';
    gg.fillRect(0, h - 56, w, 56);
    gg.fillStyle = s.accent;
    gg.beginPath(); gg.arc(80, h - 28, 8, 0, Math.PI * 2); gg.fill();
    gg.fillStyle = '#fff';
    gg.font = '500 22px ui-monospace, "SF Mono", Menlo, monospace';
    gg.textBaseline = 'middle';
    gg.fillText('LIVE · CH 01 · BORISUSU.TV', 104, h - 28);
    gg.textAlign = 'right';
    gg.fillText('1080p · 60FPS', w - 64, h - 28);
    gg.textAlign = 'left';

    // scanline overlay
    gg.fillStyle = 'rgba(0,0,0,0.10)';
    for (let y = 0; y < h; y += 3) gg.fillRect(0, y, w, 1);

    return cc;
  }

  // Initial paint = first slide
  g.drawImage(slideCanvases[0], 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  // 3.5s per slide, 0.6s crossfade
  const SLIDE_DUR = 3.5;
  const FADE_DUR = 0.6;
  let lastFrameIdx = -1;

  function update(elapsed) {
    const cycle = SLIDE_DUR;
    const total = cycle * slideCanvases.length;
    const t = elapsed % total;
    const idx = Math.floor(t / cycle);
    const tIn = t - idx * cycle;
    const next = (idx + 1) % slideCanvases.length;

    // only repaint when something would visibly change (every frame during fade,
    // once at the moment we leave fade range).
    const inFade = tIn > cycle - FADE_DUR;
    if (!inFade && idx === lastFrameIdx) return;
    lastFrameIdx = inFade ? -1 : idx;

    g.clearRect(0, 0, W, H);
    g.globalAlpha = 1;
    g.drawImage(slideCanvases[idx], 0, 0);
    if (inFade) {
      const k = (tIn - (cycle - FADE_DUR)) / FADE_DUR;
      g.globalAlpha = k;
      g.drawImage(slideCanvases[next], 0, 0);
      g.globalAlpha = 1;
    }

    // pulse dot blinking — drawn on top, every frame
    const blink = (Math.sin(elapsed * 3.0) * 0.5 + 0.5);
    g.fillStyle = `rgba(255,80,80,${0.45 + blink * 0.55})`;
    g.beginPath(); g.arc(W - 36, 36, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.font = '600 18px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText('● LIVE', W - 52, 36);
    g.textAlign = 'left';

    tex.needsUpdate = true;
  }

  return { texture: tex, update };
}

// Big "stained glass tree" artwork — abstract painterly texture (legacy)
export function makeArtworkTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 640;
  const g = c.getContext('2d');

  // deep base
  g.fillStyle = '#1a1010';
  g.fillRect(0, 0, c.width, c.height);

  // organic color blocks — coarse "stained glass"
  const palette = ['#6b1f2a','#2a4868','#4a6a2e','#c46a2f','#8c5fbd','#1f3a3a','#c79f3d','#3e2a1a','#8aa6c1'];
  const cells = 60;
  for (let i = 0; i < 480; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const r = 30 + Math.random() * 80;
    g.fillStyle = palette[Math.floor(Math.random() * palette.length)];
    g.globalAlpha = 0.55 + Math.random() * 0.4;
    g.beginPath();
    const sides = 5 + Math.floor(Math.random() * 4);
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2 + Math.random() * 0.3;
      const rr = r * (0.7 + Math.random() * 0.6);
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  }
  g.globalAlpha = 1;

  // dark branch silhouettes
  g.strokeStyle = '#0a0708';
  g.lineWidth = 10;
  g.lineCap = 'round';
  function branch(x, y, a, len, depth) {
    if (depth <= 0) return;
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    g.lineWidth = Math.max(1.5, depth * 2.2);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    branch(x2, y2, a - 0.4 - Math.random() * 0.3, len * 0.78, depth - 1);
    branch(x2, y2, a + 0.4 + Math.random() * 0.3, len * 0.78, depth - 1);
  }
  branch(c.width / 2, c.height, -Math.PI / 2, 130, 8);
  branch(c.width / 2 - 60, c.height, -Math.PI / 2 - 0.2, 110, 7);
  branch(c.width / 2 + 80, c.height, -Math.PI / 2 + 0.15, 120, 7);

  // top vignette
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, 'rgba(0,0,0,0.35)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Footer "WHAT DO YOU SAY?" plate
export function makeFooterTexture() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0f0f12';
  g.fillRect(0, 0, c.width, c.height);

  g.fillStyle = '#f4f1e9';
  g.font = '500 72px "Cormorant Garamond", "Times New Roman", serif';
  g.fillText('WHAT DO', 56, 110);
  g.fillText('YOU SAY?', 56, 196);

  // divider
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(540, 70); g.lineTo(540, 200); g.stroke();

  // contact
  g.fillStyle = '#e9e5dd';
  g.font = '500 38px "Helvetica Neue", Helvetica, Arial, sans-serif';
  g.fillText('✉   eunsoo14@naver.com', 600, 110);
  g.fillText('☎   010-3741-4604', 600, 178);

  // social circles
  ['Ig','Be','✉'].forEach((t, i) => {
    const cx = 1620 + i * 130; const cy = 140;
    g.strokeStyle = '#e9e5dd'; g.lineWidth = 2;
    g.beginPath(); g.arc(cx, cy, 44, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#e9e5dd';
    g.font = '500 30px "Helvetica Neue", Helvetica, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(t, cx, cy);
    g.textAlign = 'start'; g.textBaseline = 'alphabetic';
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
