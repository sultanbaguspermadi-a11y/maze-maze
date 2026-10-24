# Kalimah Maze — Chronicles of the Lost Bazaar

Petualangan piksel untuk belajar bahasa Arab. **Playable now: Stage 1 of 4 (Morning Market / سُوقُ الصَّبَاحِ).**
Stages 2–4 (Merchants' Alleys, Vaults of Secrets, the Word Warden) are **not built** — see `docs/STATUS_REPORT.md`.

## Run
```bash
node tools/serve.mjs 8080        # then open http://localhost:8080/   (needs a server: ES modules + service worker)
node tools/build-precache.mjs    # regenerate precache.json after changing any file under src/, public/, index.html, styles.css
```
No `npm install` is needed: there are no runtime dependencies. `npm run <script>` also works if npm is available.

## Check
```bash
node tools/validate-content.mjs          # schema + cross-reference + level/quest soft-lock validation (exit 1 on error)
node --test tests/*.test.mjs             # 68 unit + headless campaign tests
node tools/smoke.mjs                     # 49 real-browser checks (needs Playwright; set PLAYWRIGHT_DIR if not global)
```
`npm run check` runs the first two. Debug hook: append `?debug` to the URL (exposes `window.__KM`, read-mostly; used by the smoke suite).
Append `?nosw` to skip service-worker registration while developing.

## Play
Walk to **Hajjah Zainab** (south lane), read her order, buy **dates, two loaves, a large jar** with the 10 dirhams you are given,
**read the Arabic labels** to pick the right goods, deliver them, then find the blue curtain behind the bread oven.
Optional: the potter's lost key (crate alley) and the practice board (plaza).

| Action | Keyboard | Touch |
|---|---|---|
| Move | WASD / arrows | analog joystick or D-pad |
| Interact / confirm | E, Enter (remappable: F, Space) | **Aksi** |
| Journal / map | J (remappable: I, Tab) · M for map | **Jurnal** |
| Lexicon | L | via Menu |
| Pause / menu | Esc / P | **Menu** |
| Dialogue / challenge answers | 1–9, Enter | tap |

Settings (Menu → Pengaturan): Arabic text size, Indonesian meaning on/off, touch control scheme (auto/joystick/D-pad),
left-handed mode, control size and opacity, master/music/effects volume, mute, reduced motion, screen shake, help level
(hints and objective markers), key remapping, delete all data.

## Layout
```
src/world      level compiler, collider, flood fill, level validator        (no DOM)
src/quests     objective evaluator, dialogue graph helpers                   (no DOM)
src/learning   Arabic normalisation, challenge runtime, spaced review        (no DOM)
src/persistence versioned save store                                          (no DOM)
src/game       GameSession (all gameplay rules; UI injected)                  (no DOM)
src/content    Stage 1 layout, quests, dialogue, lexicon, challenges, schema (data)
src/render     tiles, props, sprites, renderer, title scene                   (browser)
src/ui src/input src/audio src/main.js                                        (browser)
tools/         serve, validate-content, build-precache, smoke, e2e helpers
docs/          audit, ADR, art direction, content guide, registers, status, annotated task list
```

## Important caveats
- **All Arabic content is unreviewed (`draft`)** and must not be treated as authoritative until a qualified reviewer signs it off.
- Audio is synthesised at runtime and could not be listened to in the build environment.
- Verified only in headless Chromium; not on real phones/tablets, Safari or Firefox.
