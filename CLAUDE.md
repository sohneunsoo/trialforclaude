# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Three.js 0.160.0 static portfolio site rendered as a 3D isometric "room" — a 2D portfolio diorama. No bundler, no build step. Plain ES modules loaded from CDN via `importmap` in `index.html`. Deployed on Vercel at `portfolio-room-peach.vercel.app`.

## Development

**Local preview:** serve with any static file server on port 3333  
```bash
python -m http.server 3333
```
Then open `http://localhost:3333`.

**Deploy to production:**
```bash
npx vercel deploy --prod
```
Run this from the repo root. Do not invoke `npx` with a full system path (spaces in path cause issues on Windows).

There are no tests, no lint commands, and no package.json. All dependencies are CDN-loaded.

## Architecture

### Entry point
`index.html` contains all CSS, all 2D overlay HTML (prompts, project overlay, embed overlay, guestbook overlay, HUD), and loads `room/main.js` as an ES module.

### Module breakdown (`room/`)

| File | Responsibility |
|------|---------------|
| `main.js` | Scene setup, render loop, input handling, camera animation, project/embed/overlay state machine |
| `environment.js` | All 3D geometry: floor, walls, alcoves, hero zone, guestbook section, scrollbar, window frame, chrome bar, digital billboard |
| `projects.js` | `PROJECTS` array — single source of truth for all project metadata |
| `textures.js` | `CanvasTexture` factory functions (labels, hero plate, artwork, billboard slides) |
| `character.js` | Walking character mesh + `CharacterWanderer` AI |
| `cat.js` | Cat mesh + `CatWanderer` AI |
| `mouse.js` | 3D arrow cursor mesh |
| `guestbook.js` | Firebase Realtime Database guestbook (open/close/submit/live-sync) |

### Standalone pages
`ai-tool-map.html`, `ai-creator-guide.html`, `prompt-archive.html` — self-contained single-file pages linked from project alcoves. They each include `return-timer.js` which redirects to `index.html` after 2 minutes of inactivity.

### Interaction state machine (`main.js`)
Three overlay layers, dismissed in this ESC order: guestbook → embed overlay → project overlay.

- **Arrow keys / WASD** move the 3D cursor (`mouse`) around the room floor
- **Enter** triggers `tryOpenProject()` which checks proximity to project mounts or guestbook
- Project open modes: `embed: true` → iframe overlay; `gallery: [...]` → lightbox; `url` only → new tab; neither → slide-up detail panel
- Camera animates with `zoomToAlcove()` / `zoomBack()` using `easeInOutQuad`; `controls.enabled` is toggled off during animation

### Room coordinate system
- **X:** −13 (left) → +13 (right)
- **Z:** −14 (back/hero zone) → +14 (front/footer)
- **Y:** 0 is floor surface; geometry sits above/below

Key Z positions:
- Hero zone: `z ≈ −14` to `−7.5`
- Project row 1: `z ≈ −7.2` to `−0.2`
- Project row 2: `z ≈ +2.8` to `+9.8`
- Guestbook section: `z ≈ +9.5` to `+11.9`
- Footer: `z ≈ +13.2` to `+15.8`

### Adding or editing projects
Edit `room/projects.js` — each entry in `PROJECTS` drives one alcove in `environment.js`. The first 4 entries fill row 1 (dark/top row), the next 4 fill row 2 (AI row). WIP projects are commented out at the bottom. Fields: `id`, `code`, `title`, `titleEn`, `tags`, `tone`, `accent`, `year`, `role`, `status`, `desc1`, `desc2`, plus optional `url`, `embed`, `vertical`, `qr`, `cover`, `gallery`.

### Guestbook
Backed by Firebase Realtime Database (`portfolio-room-2479a`). The Firebase config in `guestbook.js` is intentionally public (Realtime DB rules govern write access). The `escHtml()` function in that file is required for XSS safety — do not remove it.

## What Not to Touch

- **Right side wall** — intentionally absent. Do not re-add; it produces a visible triangular protrusion from the default isometric camera angle.
- **Window frame left/right edges** — restored to full `ROOM.depth + frameThickness * 2 - 0.4` length centered at `z = 0.4`. Do not shorten.
- **`setProgress`** in scrollbar — contains a stray character; read carefully before editing.
- **`buildWindowFrame` depth** — already trimmed so side edges stop flush at the back corner.
