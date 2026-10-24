# Status report — session of 2026-10-24

## What was delivered
A dependency-free, installable, offline-capable PWA containing **one complete, playable stage** (Morning Market) built on
engine systems designed for four, with validators and tests. It is a coherent milestone, **not the full campaign**.

### Implemented (all verified; see evidence below)
- Authored 56×46 marketplace with eight named areas, landmarks (fountain, oven, palms, well), a gated secret route, a hidden
  curtain behind the oven, optional crate alley, and animated lighting/occlusion.
- Quest engine (typed objectives, prerequisites, flags, optional objectives), data-driven dialogue, inspection, inventory,
  purse, delivery, side quest, practice board, journal, fog-of-war map, autosave checkpoints.
- Learning engine: explicit Arabic normalisation policies, choice/order/typed challenges, hints, typo nudge, per-option
  feedback, spaced review with weak-word flagging, teach-before-test practice, 160-word Lexicon with search/filters.
- Touch + keyboard controls (joystick, D-pad, left-handed), settings/accessibility, focus-trapped dialogs, responsive HUD,
  bottom-sheet camera inset, reduced motion, offline app shell, manifest, icons.
- Level validator that simulates the quest graph to catch soft-locks, plus a physics bot proving the real collider can reach
  every objective.

## Evidence (commands actually run; final results)
| Command | Result |
|---|---|
| `node tools/validate-content.mjs` | 0 errors, 0 warnings; inventory printed (below) |
| `node --test tests/*.test.mjs` | **68 / 68 pass** (campaign 13, challenges 6, normalize 13, progress 5, quests 8, save 9, world 14) |
| `node tools/smoke.mjs` (Chromium headless, Playwright) | **49 / 49 pass** |

Browser checks cover: real keyboard movement; joystick via CDP multi-touch on 390×844, 844×390 and 820×1180; full shopping
chain through the real UI including a wrong price answer; side quest; reload + Continue; results screen; settings apply and
persist; settings modal reachable on the title screen; focus trap + Escape; ordering and typed-Arabic challenges incl. typo
path; translation-off behaviour; corrupt save; blocked storage; reduced-motion; touch targets ≥ 44 px; no page overflow;
integer pixel scale; manifest + icons; service worker; **offline reload and offline new game**.

## Defects found and fixed during this session (by testing, not by inspection)
1. Shell `mkdir {a,b}` created a literal directory (dash) — files rewritten.
2. A price board sat within a tie of the vendor's interaction anchor → moved one tile.
3. `input.enabled` was refreshed once per frame, dropping a key pressed right after a modal closed.
4. Nested arrays in the DOM helper printed `[object HTMLSpanElement]` on the results screen.
5. Word-discovery toasts stacked three deep → merged into one counter.
6. Arabic runs inside Indonesian sentences were not bidi-isolated → `<bdi>` wrapper added.
7. HUD buttons were 40 px (< 44 px) and toasts overlapped the objective on phones → fixed, measured.
8. **Modals opened underneath the title screen** (Settings/About/confirm invisible) → explicit z-index layering, now hit-tested.
9. On phones the dialogue sheet covered the player → camera inset + map overscroll, now measured.

## Content inventory vs PRD minimums
| Strand | Have | Target | |
|---|---|---|---|
| Lexicon | 160 | 150 | met (all `draft`) |
| Nahwu | 7 | 60 | **shortfall** |
| Sarf | 8 | 40 | **shortfall** |
| Integrated | 2 | 20 | **shortfall** |
Expert-reviewed items: **0**.

## Known defects / limits / blockers
- **The uploaded archive contained no game source**, so no legacy audit, import or reuse was possible (docs/REPOSITORY_AUDIT.md).
- Stages 2–4, enemies, the boss, difficulty scaling, procedural variation, chapter rewards: **not started**.
- No Arabic reviewer has checked anything; academic sign-off (KM-114) and provenance audit (KM-062) are open.
- Verified in headless Chromium only. **Not tested:** real devices, Safari/iOS, Firefox, installed-PWA behaviour, install prompt,
  audible audio, performance budgets (KM-103), usability with real learners (KM-113).
- Arabic shaping relies on system fonts; no font is bundled (needs network + licence decision).
- `?debug` exposes `window.__KM` in any build; acceptable for a prototype, should be stripped for release.
- `ui/ui.js` and `render/props.js` are large and should be split.
- Movement speed/feel is untuned (no playtest).

## Next tasks, in dependency order
1. **KM-062 / KM-114** — get an Arabic-language reviewer to sign off the 183 draft items (blocks claiming the content is correct).
2. **KM-001** — if the legacy HTML/repo exists, audit it and reconcile vocabulary/art/saves.
3. **KM-072 → KM-073** — Merchants' Alleys layout + delivery/grammar gate (adds idhafah, na't-man'ut, kana/inna content; grows KM-054/058).
4. **KM-032 / KM-037** — generic switches/keys; controlled procedural variation hooks (needed by Stage 2+).
5. **KM-074 → KM-075** — Vaults of Secrets + inscription/analysis puzzles (adds sarf mazid, tashrif, i'rab analysis; KM-055/059/060).
6. **KM-080/081/082** — enemy framework, archetypes, assistance scaling.
7. **KM-076 → KM-077 → KM-078** — Word Warden boss, learning wiring, chapter completion.
8. **KM-103 / KM-104 / KM-113** — profiling, Safari/Firefox/real-device passes, learner sessions; then KM-116 release checklist.
