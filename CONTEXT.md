# Portfolio Room — Session Context

## Project Overview
A Three.js 0.160.0 static site: a 3D isometric "room" that renders a 2D portfolio website as a diorama. Deployed on Vercel at `portfolio-room-peach.vercel.app`. No bundler — plain ES modules loaded from CDN. The camera looks diagonally down into the room; the visitor moves a 3D cursor around with arrow keys to browse projects.

**Root:** `E:\portfolio-room\`  
**Entry:** `index.html` (loads `room/main.js` as a module)

---

## File Structure

```
E:\portfolio-room\
├── index.html            # Full HTML + all CSS + guestbook overlay markup
├── bg.png                # Sky/background texture
├── covers/               # Project card cover images
├── cardnews/             # slide-01.png … slide-11.png (AI trend card gallery)
├── room/
│   ├── main.js           # Scene setup, camera, lights, input, render loop
│   ├── environment.js    # All 3D geometry: room, alcoves, hero, guestbook, scrollbar
│   ├── projects.js       # PROJECTS array (8 active projects)
│   ├── guestbook.js      # localStorage guestbook (ES module)
│   ├── textures.js       # CanvasTexture factories
│   ├── character.js      # Walking character + CharacterWanderer
│   ├── cat.js            # Cat + CatWanderer
│   └── mouse.js          # 3D arrow cursor
├── ai-tool-map.html      # Standalone AI tool map page
├── ai-creator-guide.html # Standalone AI creator guide page
├── prompt-archive.html   # Standalone prompt archive page
└── CONTEXT.md            # ← this file
```

---

## Current Room Dimensions (`environment.js`)

```javascript
export const ROOM = {
  width: 26,
  depth: 28,
  wallH: 3.6,
  outerThick: 0.5,
  chromeH: 1.6   // title bar height
};

const COLS = 4;
const ROWS = 2;
const ALCOVE_W = 5.8;
const ALCOVE_D = 7.0;
const ALCOVE_GAP_X = 0.30;
const ALCOVE_GAP_Z = 1.5;
```

**halfW = 13, halfD = 14**

### Z Layout (back → front)
```
-14          back wall
-14 .. -7.5  hero zone  (platform depth 6.5, billboard at z=-14+3.6)
 -7.2.. -0.2 project row 1
  2.8 ..  9.8 project row 2  (ALCOVE_GAP_Z=1.5 between rows)
  9.5 .. 11.9 guestbook section  (§04 방명록), secZ0=9.5
 13.2 .. 15.8 footer  (dark band), position halfD-0.8
 14.0         front edge
```

---

## Camera & Lighting (`main.js`)

```javascript
const HOME_CAM = {
  pos:    new THREE.Vector3(-9, 25, 34),
  target: new THREE.Vector3(-2, 1.5, 2.0)
};

scene.fog = new THREE.Fog('#a8cce0', 40, 90);

// Shadow
const s = 22;
// sun.shadow.camera left/right/top/bottom = ±s, far = 70

// Controls
controls.target.set(-2, 1.5, 2.0);
controls.minDistance = 10;
controls.maxDistance = 60;
```

---

## Features

### 1. Scrollbar
Built into right inner wall, floor-mounted, tracks character Z position.  
`group.userData.scrollbar` → `setProgress(t)` called each frame from main.js.

### 2. Guestbook (§04 방명록)
3D section on the floor between project rows and footer.  
- Cursor within radius 3.5 shows `✉ 방명록` prompt; Enter opens 2D overlay  
- `#gb-overlay` in index.html; localStorage key `'portfolio_guestbook_v1'`, max 60 entries  
- ESC closes; Ctrl/Cmd+Enter submits

`room/guestbook.js` exports: `initGuestbook()`, `openGuestbook()`, `closeGuestbook()`, `isGuestbookOpen()`

```javascript
group.userData.guestbookPosition = new THREE.Vector3(0, 0, secZc); // ≈ 10.7
group.userData.guestbookRadius = 3.5;
```

### 3. Cat character
`buildCat()` + `CatWanderer` in `cat.js` — wanders with same bounds/avoidZones as human character.

### 4. Digital Billboard (hero zone)
LED-style screen (9.6×5.6), right side of hero zone, at `xCenter = halfW/2 + 0.4`, `zCenter = -halfD + 3.6`.  
Cycles Korean slides via `billboard.update(deltaTime)` called from render loop.

### 5. Project layout: 2 rows × 4 cols = 8 projects
- Row 1: 아이돌 기획안, 가챠, 아이돌과 대화, 파일럿 뮤직
- Row 2: AI 툴 도감, AI 작업자 가이드, 프롬프트 아카이브, AI 트렌드 카드뉴스

---

## Wall / Frame State (current)

### Back wall
Width = `ROOM.width + ROOM.outerThick * 2 = 27` — extended to cover side wall thickness at back corner.

```javascript
new THREE.BoxGeometry(ROOM.width + ROOM.outerThick * 2, ROOM.wallH, ROOM.outerThick)
// position: (0, wallH/2, -halfD - outerThick/2 + 0.001)
```

### Side walls
**Left wall only** — right wall was removed; it produced a visible triangular protrusion from the default camera angle. Left wall is a flat uniform 0.6-tall strip.

```javascript
// left side wall only
const shape = new THREE.Shape();
shape.moveTo(0, 0);
shape.lineTo(ROOM.depth, 0);
shape.lineTo(ROOM.depth, 0.6);
shape.lineTo(0, 0.6);
shape.lineTo(0, 0);
// ExtrudeGeometry depth=outerThick, rotation.y=PI/2
// position: (-(halfW + outerThick/2 - 0.001), 0, -halfD), scale.x = -1
```

### Chrome bar (`buildChrome`)
`barW = ROOM.width + ROOM.outerThick * 2 = 27` — covers full outer frame including side wall.

### Window frame (`buildWindowFrame`)
- **Top edge:** `BoxGeometry(ROOM.width - 0.2, frameRise, frameThickness + 0.4)` at z = `-halfD - frameThickness/2 - 0.2`
- **Left/right edges:** `BoxGeometry(frameThickness, frameRise, ROOM.depth + frameThickness * 2 - 0.4)` centered at z = `0.4`  
  (back end reaches z = 0.4 - (28.8/2) = -14, front end z = 14.8)
- **Bottom edge:** `BoxGeometry(ROOM.width + frameThickness * 2 + 1.0, frameRise, frameThickness)` at z = `halfD + frameThickness/2`

`frameThickness = 0.6`, `frameRise` = computed from window frame height.  
Left/right edges at `x = ±(halfW + frameThickness/2 + 0.5) = ±13.8`

---

## Project Mounts

```javascript
projectMounts.push({
  project,
  position: new THREE.Vector3(cx, 0, cz),
  radius: 3.8,
  platform: alcove.userData.platform
});
```

Entering radius 3.8 shows prompt. Enter to open:
- `url` + `embed: true` → iframe overlay
- `gallery: [...]` → lightbox gallery
- `url` only → navigate directly

---

## Key Interactions (`main.js`)

| Key | Action |
|-----|--------|
| Arrow keys | Move 3D cursor |
| Enter | Open nearest project / guestbook |
| Escape | Close guestbook → close embed → close overlay |
| Arrow L/R | Navigate gallery when overlay open |
| Ctrl/Cmd+Enter | Submit guestbook message |

Cursor position clamped:
```javascript
const halfW = ROOM.width / 2 - 1.2;   // = 11.8
const halfD = ROOM.depth / 2 - 1.2;   // = 12.8
mouse.position.x = clamp(x, -halfW, halfW);
mouse.position.z = clamp(z, -halfD + 1.5, halfD - 2.0);
```

---

## What NOT to Touch

- **Window frame left/right edges** — restored to full length (`ROOM.depth + frameThickness * 2 - 0.4`), centered at z=0.4. Do not shorten again.
- **Right side wall** — intentionally absent. Do not re-add without a plan to prevent back-corner protrusion from the isometric camera angle.
- **`setProgress`** in scrollbar — has a stray character; read carefully if editing.
- **`escHtml()`** in guestbook.js — required for XSS safety.
- **`buildWindowFrame` depth** — already trimmed so side edges stop flush. Do not change back.

---

## Preview Server

```json
// C:\Users\es\.claude\launch.json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "portfolio-room",
      "runtimeExecutable": "C:\\Users\\es\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
      "runtimeArgs": ["-m", "http.server", "3333", "--directory", "E:\\portfolio-room"],
      "port": 3333
    }
  ]
}
```

**Deploy:** `cd E:\portfolio-room && npx vercel deploy --prod`

> Note: `npx` must be run from `E:\portfolio-room`. Don't use `C:\Program Files\nodejs\npx` directly (path-with-spaces issue in cmd).

---

## Commit Status

All changes committed and deployed to production.  
Last commit: `"Restore left side wall; keep right wall removed"`  
Live URL: `https://portfolio-room-peach.vercel.app`
