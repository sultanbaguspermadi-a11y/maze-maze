# Asset register (KM-004, KM-091)

| Asset | Origin | Licence |
|---|---|---|
| All tiles, props, characters, UI art, title skyline | generated in code (`src/render/*`) | project-original |
| App icons `public/icons/*.png` | generated with a Python/PIL script from a 64×64 pixel design | project-original |
| Music, ambience, SFX | synthesised at runtime with Web Audio (`src/audio/audio.js`); no audio files | project-original |
| Fonts | **none bundled** — system stack (Noto Naskh Arabic, Amiri, Scheherazade New, Geeza Pro, Traditional Arabic, DejaVu Sans) | OS-provided |
| Runtime dependencies | none | n/a |
| Dev dependency | Playwright (global, optional, `tools/smoke.mjs` only) | Apache-2.0 |

No third-party art, audio, fonts or code is included. If a font is bundled later it must be added here with its licence.
