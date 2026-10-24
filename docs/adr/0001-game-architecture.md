# ADR 0001 — Game architecture (KM-003)

**Status:** accepted · **Date:** 2026-10-24

## Decision
Dependency-free **ES modules + Canvas 2D** for the world, **real DOM** for all text/UI, **node:test** for logic, Playwright
(dev-only, optional) for browser verification. No bundler, no framework, no runtime dependencies.

## Why not the PRD's suggested Vite + TypeScript + Phaser
The PRD recommends them only "if there is no suitable existing stack". There was no existing stack (see audit) and the build
environment has **no network**, so those packages could not be installed or verified. A dependency that cannot be installed
and tested would have been a larger risk than writing a small tile/collision/camera layer.

| Concern | How it is met without a framework |
|---|---|
| Tilemaps | authored grid + legend → compiled tile bitmap (`world/level.js`), static layer baked once (`render/tiles.js`) |
| Scene lifecycle | `main.js` owns title → session → results; sessions are disposable objects |
| Collisions | one tile bitmap shared by physics, flood-fill pathing and the validator (they cannot disagree) |
| Input | `Input` exposes `vec()` + actions; keyboard, joystick, D-pad feed it |
| Camera | integer pixel scale, snapped camera, bottom-sheet inset |
| Testability | `GameSession` is DOM-free and takes an injected UI; the same class runs in Node tests and the browser |
| PWA | `manifest.webmanifest`, `sw.js`, hash-versioned `precache.json` |

## Boundaries
- `src/world`, `src/quests`, `src/learning`, `src/persistence`, `src/game/session.js`, `src/content` — **no DOM**, unit-tested.
- `src/render`, `src/ui`, `src/input`, `src/audio`, `src/main.js` — browser only.
- Content is data: stage layout, quests, dialogue, lexicon and challenges live in `src/content/` and are checked by
  `tools/validate-content.mjs` before they can ship.

## Dependency policy
Runtime: **none**. Dev: Playwright (global, optional, only `tools/smoke.mjs`). Any new dependency needs an entry in
`docs/ASSET_REGISTER.md` (name, version, licence, reason).

## Trade-offs accepted
- No TypeScript: shapes are enforced by `src/content/schema.js` and tests rather than types.
- Hand-rolled pixel art is generated in code (consistent and licence-free) but is less hand-crafted than an artist's tileset.
- Single-file-per-feature modules are larger than ideal in places (`ui/ui.js`, `render/props.js`); splitting is listed as debt.

## Migration boundary
When a bundler/TypeScript is later acceptable, the pure modules can be moved as-is; only `render/` and `ui/` touch the DOM.
