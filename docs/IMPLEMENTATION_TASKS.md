# Kalimah Maze: Chronicles of the Lost Bazaar
## Implementation Task Breakdown

> **Status legend:** ✅ done and verified · 🟡 partial (what is missing is stated) · ⬜ not started. Statuses were added in the 2026-10-24 session; see `docs/STATUS_REPORT.md` for evidence.

This backlog is intended for a coding agent or small development team. Execute tasks in dependency order and keep the application runnable after each milestone. Mark a task `[x]` only after its acceptance criteria and verification are complete. Do not mark work complete based on code presence alone.

**Priority key:** `P0` release blocker/foundation · `P1` essential MVP · `P2` important polish · `P3` post-MVP  
**Task ownership:** one task may be split into smaller commits; preserve task IDs in commit/PR descriptions where useful.

---

## Phase 0 — Repository audit and project guardrails

### KM-001 — Inspect the actual project
- **Status (2026-10-24):** 🟡 partial — The zip contained no source (see docs/REPOSITORY_AUDIT.md). Audit of the provided material and environment is done; the legacy code could not be audited.
- **Priority:** P0
- **Work:** inspect the full repository, package scripts, app entry points, asset inventory, save keys/schema, existing tests, licenses, and runtime behavior. Do not assume the uploaded HTML is the whole codebase.
- **Acceptance:** `docs/REPOSITORY_AUDIT.md` records current stack, run/build/test commands, entry points, assets, known defects, reusable behavior, and migration risks. No unexplained files or dependencies are overwritten.

### KM-002 — Capture a baseline and create a safe branch/backup
- **Status (2026-10-24):** 🟡 partial — No repository existed to back up. Project is a fresh folder; no VCS history was created in this session.
- **Priority:** P0
- **Depends on:** KM-001
- **Work:** ensure current project can be restored; capture existing behavior through smoke tests/screenshots where practical.
- **Acceptance:** baseline instructions and backup/branch strategy documented; no user work silently discarded.

### KM-003 — Define architecture decision record
- **Status (2026-10-24):** ✅ done — docs/adr/0001-game-architecture.md (deviates from the PRD's suggested Vite/TS/Phaser because there is no network; reasons recorded).
- **Priority:** P0
- **Depends on:** KM-001
- **Work:** choose between an existing capable stack and a modular TypeScript/Vite 2D framework approach. If choosing a new framework, record why it improves tilemaps, scene lifecycle, collisions, input, camera, testability, and PWA packaging.
- **Acceptance:** `docs/adr/0001-game-architecture.md` documents the choice, tradeoffs, dependency policy, and migration boundary.

### KM-004 — Establish quality gates and asset policy
- **Status (2026-10-24):** 🟡 partial — Commands documented in README; asset + source registers and content-review rules exist. No linter/formatter/type-checker (no dependencies available).
- **Priority:** P0
- **Depends on:** KM-001
- **Work:** define formatting/lint/type-check/test/build scripts where appropriate; create asset license/source register and content-review rules.
- **Acceptance:** local developer commands are documented; asset/content registers exist; no unlicensed assets are introduced.

## Phase 1 — Core game foundation

### KM-010 — Create modular application bootstrap
- **Status (2026-10-24):** ✅ done — src/main.js bootstraps save → settings → title → session loop; modules separated by concern.
- **Priority:** P0
- **Depends on:** KM-003
- **Work:** establish game initialization, loading/error states, scene/state flow, and safe teardown/restart behavior.
- **Acceptance:** app launches into a usable title/menu scene; fatal runtime errors show a recoverable error UI instead of a stuck loading screen.

### KM-011 — Define shared content and state schemas
- **Status (2026-10-24):** ✅ done — src/content/schema.js validates lexicon, challenges, quests, dialogue, items, clues and stages; src/persistence/save.js validates saves. JS, not TypeScript.
- **Priority:** P0
- **Depends on:** KM-010
- **Work:** define typed schemas/validators for stages, tiles, actors, NPCs, items, quests, dialogues, learning challenges, save data, and settings.
- **Acceptance:** invalid IDs, missing answers, unknown prerequisites, or invalid tile references are caught by automated validation with actionable messages.

### KM-012 — Implement input abstraction
- **Status (2026-10-24):** 🟡 partial — Keyboard, analog joystick, D-pad, remappable interact/journal keys. Gamepad not implemented.
- **Priority:** P0
- **Depends on:** KM-010
- **Work:** unify keyboard and touch actions behind the same movement/interact/pause/action map. Keep future gamepad support possible without requiring it for MVP.
- **Acceptance:** gameplay systems do not directly depend on individual keyboard keys or raw touch events; remapping/configuration is feasible.

### KM-013 — Implement player movement and collision
- **Status (2026-10-24):** ✅ done — Sub-stepped tile-bitmap collision; unit-tested incl. no tunnelling, wall sliding, gates.
- **Priority:** P0
- **Depends on:** KM-012
- **Work:** reliable grid/tile-aware movement or smooth tile-aligned movement, collision, interaction range, and safe spawn handling.
- **Acceptance:** player cannot pass through blocking geometry; no input lock after pause, dialogue, resize, or stage transition; movement works on keyboard and touch.

### KM-014 — Implement camera and viewport resizing
- **Status (2026-10-24):** ✅ done — Integer pixel scale + snapped camera + resize; verified at 1280×720, 390×844, 844×390, 820×1180 in Chromium.
- **Priority:** P0
- **Depends on:** KM-010, KM-013
- **Work:** camera follow, bounds, room framing where required, resize handling, and restrained transitions.
- **Acceptance:** no stretching/blurry pixel scaling in the game layer; player remains visible after viewport changes; camera does not expose unintended out-of-bounds areas.

### KM-015 — Build base scene and UI flow
- **Status (2026-10-24):** 🟡 partial — Title, pause, settings, about, results, error screens. No stage-select screen (only one stage exists).
- **Priority:** P0
- **Depends on:** KM-010
- **Work:** title/menu, gameplay HUD, pause overlay, stage transition, result screen, settings, and recoverable navigation.
- **Acceptance:** every visible navigation control works; overlays pause/block gameplay correctly; browser back/reload does not create an unrecoverable state.

### KM-016 — Add versioned local persistence
- **Status (2026-10-24):** ✅ done — Versioned, sanitised saves; corrupt/future/blocked/failed storage handled; tested in Node and in the browser.
- **Priority:** P0
- **Depends on:** KM-011, KM-015
- **Work:** implement validated, versioned local save/load for settings, campaign flags, quests, checkpoint, lexicon progress, and review state.
- **Acceptance:** progress survives reload; corrupt/old data is handled without crashing; reset requires confirmation; migrations are tested where applicable.

### KM-017 — Add error logging and dev diagnostics
- **Status (2026-10-24):** 🟡 partial — Global error + unhandled-rejection overlay; `?debug` hook. No persistent log buffer.
- **Priority:** P1
- **Depends on:** KM-010
- **Work:** useful development logging, debug toggles for quest/stage state, and readable error reporting; keep development tools out of production UX.
- **Acceptance:** developers can identify invalid stage data and state transitions; debug tools are inaccessible or disabled in release builds.

## Phase 2 — Pixel-art renderer and world pipeline

### KM-020 — Set pixel-art visual specification
- **Status (2026-10-24):** ✅ done — docs/ART_DIRECTION.md.
- **Priority:** P0
- **Depends on:** KM-004
- **Work:** define logical resolution, tile sizes, nearest-neighbor scaling, palette/material rules, outline/shadow rules, Arabic UI type strategy, and camera pixel alignment.
- **Acceptance:** `docs/ART_DIRECTION.md` includes reference boards, palette tokens, tile grid, asset naming, and visual do/don't examples.

### KM-021 — Implement layered tilemap rendering
- **Status (2026-10-24):** ✅ done — Static baked layer + depth-sorted pass + foreground pass.
- **Priority:** P0
- **Depends on:** KM-014, KM-020
- **Work:** support floor, wall/architecture, prop, foreground-occlusion, collision, and interaction-marker layers.
- **Acceptance:** layer ordering is deterministic; decorative tiles can be non-blocking; foreground props correctly pass in front of/behind the player.

### KM-022 — Build the marketplace base tileset
- **Status (2026-10-24):** 🟡 partial — Cobble, plaza (with inlay), sand, courtyard, wood, dark stone, roof/facade walls — enough for Stage 1 only.
- **Priority:** P1
- **Depends on:** KM-020, KM-021
- **Work:** create or integrate properly licensed/owned floor, cobble, stone, wood, rug, wall, edge, corner, door, arch, and transition tiles.
- **Acceptance:** seamless test room has no accidental gaps, misaligned corners, inconsistent outlines, or blurry scaling; asset provenance is recorded.

### KM-023 — Create bazaar prop set
- **Status (2026-10-24):** 🟡 partial — ~25 prop types for Stage 1 (stalls, oven, fountain, well, palms, carts, crates, shelves, arches…). Stages 2–4 sets not built.
- **Priority:** P1
- **Depends on:** KM-022
- **Work:** stalls, counter variants, baskets, dates/fruit, spice jars, pottery, crates, sacks, balances/scales, lanterns, fabric, signs, carts, doors, and columns.
- **Acceptance:** props align to the world grid, have deliberate footprints/collision, and are recognizable at native gameplay size.

### KM-024 — Create player/NPC/enemy sprites and animation states
- **Status (2026-10-24):** 🟡 partial — Player + NPC/wanderer sprites, 4 facings × 4 frames. No enemy sprites.
- **Priority:** P1
- **Depends on:** KM-020, KM-021
- **Work:** idle, movement, interaction, hit/feedback, NPC idle/working/walking, and limited enemy states appropriate to MVP.
- **Acceptance:** animation frame timing is consistent; no sprite jitter; silhouettes remain readable against every stage background.

### KM-025 — Implement depth sorting and foreground occlusion
- **Status (2026-10-24):** ✅ done — Y-sorted actors/props; split stall layers; fade-on-overlap for oven, well, awnings, beams, arches, palm crowns.
- **Priority:** P1
- **Depends on:** KM-021, KM-023, KM-024
- **Work:** sort movable actors by world position and handle foreground awnings/arches intentionally.
- **Acceptance:** characters can pass naturally behind/around props; the player is never hidden by UI-critical objects without an occlusion/visibility solution.

### KM-026 — Add restrained lighting and environment animation
- **Status (2026-10-24):** 🟡 partial — Light pools, flicker, dust, fountain spray, awning sway, reduced-motion switch. No sun shafts / time-of-day.
- **Priority:** P2
- **Depends on:** KM-021, KM-023
- **Work:** lamp flicker, cloth motion, small dust/smoke effects, water if present, and stage-specific lighting layers.
- **Acceptance:** effects can be disabled/reduced; static scenes are cached where possible; effects do not impair Arabic text or hazard visibility.

### KM-027 — Add stage visual review checklist
- **Status (2026-10-24):** 🟡 partial — Checklist in docs/ART_DIRECTION.md applied by me to Stage 1; no human art review.
- **Priority:** P1
- **Depends on:** KM-022 through KM-026
- **Work:** compare each scene against art direction and capture normal-size screenshots.
- **Acceptance:** checklist passes for legibility, coherent materials, landmarks, tile transitions, actor contrast, and mobile composition. No stage is only a palette swap.

## Phase 3 — Stage, room, and quest framework

### KM-030 — Define authored level format
- **Status (2026-10-24):** ✅ done — Authored grid + legend + props/gates/areas/triggers/wanderers; compiled by src/world/level.js.
- **Priority:** P0
- **Depends on:** KM-011, KM-021
- **Work:** implement data-driven layout and object definitions with room/area graph, spawn, exit, gates, triggers, enemy routes, props, and learning challenge references.
- **Acceptance:** a sample stage can be assembled from data without editing renderer or quest engine code.

### KM-031 — Implement room graph and level validation
- **Status (2026-10-24):** 🟡 partial — Bounds, overlap, reachability, quest-state simulation, soft-lock and wanderer-route checks. Areas exist but there is no formal room graph.
- **Priority:** P0
- **Depends on:** KM-030
- **Work:** pathfinding/reachability validation for player navigation, exits, mandatory triggers, keys, checkpoints, and valid enemy spawns.
- **Acceptance:** intentionally broken fixtures fail with clear messages; all current authored stages pass.

### KM-032 — Implement gates, keys, switches, and triggers
- **Status (2026-10-24):** 🟡 partial — Flag-driven gate (curtain) + trigger zones + item pickups. No switches or generic key/door objects.
- **Priority:** P1
- **Depends on:** KM-030, KM-031
- **Work:** reusable interactable state machines with clear locked/unlocked/active feedback.
- **Acceptance:** gate requirements are data-driven; state persists at defined safe points; no key can be required behind its own locked gate.

### KM-033 — Implement objective/quest evaluator
- **Status (2026-10-24):** ✅ done — src/quests/engine.js; 8 unit tests.
- **Priority:** P0
- **Depends on:** KM-011, KM-030
- **Work:** objective types: collect, deliver, inspect, talk, answer, activate, unlock, survive, reach, and boss-phase completion. Support prerequisites and optional objectives.
- **Acceptance:** each objective has stable ID, clear state transitions, and tests; quests cannot complete from unrelated actions.

### KM-034 — Implement journal and objective tracker
- **Status (2026-10-24):** ✅ done — Journal: objectives with hints, clue log, map, bag.
- **Priority:** P1
- **Depends on:** KM-033, KM-015
- **Work:** main/side objective display, clues found, known destinations, and helpful progress wording.
- **Acceptance:** player can rediscover mandatory instructions without re-talking to NPCs; journal state remains correct after reload.

### KM-035 — Implement map reveal and landmark markers
- **Status (2026-10-24):** ✅ done — Fog-of-war map with discovered-area frames, objective and player markers (shape-coded), area list.
- **Priority:** P1
- **Depends on:** KM-030, KM-034
- **Work:** stage map view or minimap, exploration reveal, objective markers, exits, and relevant locked routes.
- **Acceptance:** map supports player orientation but does not replace environmental landmarks; states are not distinguished by colour alone.

### KM-036 — Implement checkpoint and stage transition rules
- **Status (2026-10-24):** 🟡 partial — Autosave checkpoints on objective/quest/interaction, stage-complete handling. No stage-to-stage transition (no Stage 2).
- **Priority:** P0
- **Depends on:** KM-016, KM-033
- **Work:** explicit checkpoint boundaries, retry behavior, transitions, and stage completion summaries.
- **Acceptance:** restart/resume behavior is deterministic and cannot duplicate rewards or lose essential quest flags.

### KM-037 — Add controlled procedural variation hooks
- **Status (2026-10-24):** ⬜ not started — No procedural variation hooks.
- **Priority:** P2
- **Depends on:** KM-031, KM-033
- **Work:** optional variations for reward locations, approved prop variants, or safe patrol routes while retaining authored critical routes.
- **Acceptance:** a fixed seed reproduces its variant; every generated variant passes level/quest validation; mandatory clue semantics remain intact.

## Phase 4 — Contextual interaction and story

### KM-040 — Implement interaction targeting and feedback
- **Status (2026-10-24):** ✅ done — Nearest-anchor targeting with facing tie-break, brackets + prompt + touch button highlight.
- **Priority:** P0
- **Depends on:** KM-012, KM-013, KM-021
- **Work:** detect eligible NPC/object in range; show consistent context prompt; support keyboard/touch activation.
- **Acceptance:** target selection is predictable; no required action relies on hover; clear feedback appears after activation or rejection.

### KM-041 — Implement dialogue system
- **Status (2026-10-24):** ✅ done — Data-driven dialogue graph with conditions, choices, effects and challenge nodes.
- **Priority:** P1
- **Depends on:** KM-011, KM-040
- **Work:** data-driven dialogue nodes, choices, requirements, quest effects, revisit responses, and Arabic/Indonesian display.
- **Acceptance:** dialogue choices resolve to valid nodes; state effects are tested; pause/back/continue behavior is usable on phone.

### KM-042 — Implement object inspection and environmental text
- **Status (2026-10-24):** ✅ done — Inspect panel with Arabic, meaning, grammar note, word chips, journal clues.
- **Priority:** P1
- **Depends on:** KM-040, KM-011
- **Work:** inspect signs, prices, notes, inscriptions, tools, and relevant props; save mandatory clues in journal.
- **Acceptance:** critical clue text can be reopened; optional lore does not block the main quest; Arabic rendering is correct.

### KM-043 — Implement lightweight inventory and item use
- **Status (2026-10-24):** 🟡 partial — Inventory, purse, delivery consumption. No item-use mechanic.
- **Priority:** P1
- **Depends on:** KM-011, KM-033, KM-040
- **Work:** stable item IDs, quest items, stack behavior where needed, UI list, and item-to-object conditions.
- **Acceptance:** item duplication/exploitation cannot skip mandatory state incorrectly; only necessary inventory features are built for MVP.

### KM-044 — Create authored market quest chain
- **Status (2026-10-24):** ✅ done — Stage 1 chain: main order (9 objectives + optional practice) and side quest.
- **Priority:** P1
- **Depends on:** KM-033, KM-041, KM-042, KM-043
- **Work:** build main quest from shopping request through delivery and discovery of the hidden bazaar route; include at least one meaningful optional side objective.
- **Acceptance:** quest is completable from a clean save, journal supports recovery, and each step has observable in-world feedback.

## Phase 5 — Learning engine and academic content

### KM-050 — Define learning content schema and review workflow
- **Status (2026-10-24):** 🟡 partial — Schemas + review status + provenance + validator. No review-workflow tooling (export/import of reviewer decisions).
- **Priority:** P0
- **Depends on:** KM-011
- **Work:** create schemas for lexicon items, questions, prompts, answer variants, rationales, hints, topics, levels, prerequisite rules, source metadata, and review status.
- **Acceptance:** content validator detects missing answer/rationale/topic/review status, invalid references, and duplicate IDs.

### KM-051 — Implement Arabic normalization rules per exercise
- **Status (2026-10-24):** ✅ done — Three explicit policies; order canonicalisation; tests prove hamza/taa marbuta are not silently unified.
- **Priority:** P0
- **Depends on:** KM-050
- **Work:** implement explicit normalization policies for spaces, optional tashkeel, tatweel, and accepted orthographic variants where a task permits them.
- **Acceptance:** normalization does not silently equate grammatically or orthographically distinct forms when the exercise tests that distinction; unit tests cover each policy.

### KM-052 — Implement contextual vocabulary interactions
- **Status (2026-10-24):** ✅ done — Words are discovered from signs, boards, goods labels and dialogue and feed the Lexicon.
- **Priority:** P1
- **Depends on:** KM-050, KM-040, KM-042
- **Work:** connect items, signs, dialogue, labels, object names, and quest requests to vocabulary entries.
- **Acceptance:** words can be discovered in context, viewed in the lexicon with meaning/example, and practised after encounter.

### KM-053 — Implement challenge runtime and feedback
- **Status (2026-10-24):** 🟡 partial — choice / order / short, hints, typo nudge, per-option feedback. No free-response explanation grading.
- **Priority:** P0
- **Depends on:** KM-050, KM-051
- **Work:** support multiple choice, select-a-role, ordering, match, short response where robust, and contextual selection; provide hints and error-specific explanations.
- **Acceptance:** each mandatory challenge validates against schema, reports answer feedback, and returns control to gameplay safely.

### KM-054 — Implement nahwu challenge types
- **Status (2026-10-24):** 🟡 partial — Nahwu items: 7 (agreement, nominal vs verbal sentence order, na't). Types: choice, order.
- **Priority:** P1
- **Depends on:** KM-053
- **Work:** support sentence type, grammatical role, i'rab/sign reasoning, syntactic relationship, and selected construction analysis.
- **Acceptance:** answer keys and accepted alternatives are explicit; rationales explain why the answer is correct; challenge output can drive game flags.

### KM-055 — Implement sarf challenge types
- **Status (2026-10-24):** 🟡 partial — Sarf items: 8 (dual forms, broken plurals).
- **Priority:** P1
- **Depends on:** KM-053
- **Work:** support root/pattern identification, derived-form recognition, selected conjugation tables, masdar/ism fa'il/ism maf'ul, and contextual form choice.
- **Acceptance:** challenge distinguishes form recognition from meaning/context; unsupported forms are not silently accepted.

### KM-056 — Implement learning progression and spaced review
- **Status (2026-10-24):** ✅ done — Leitner boxes, weak flags, due dates, mastery rule; deterministic and unit-tested.
- **Priority:** P1
- **Depends on:** KM-016, KM-050, KM-053
- **Work:** track discovered, practised, reverse-practised, contextual-demonstration, and mastered states. Resurface weak items in varied contexts.
- **Acceptance:** progression persists; review intervals are deterministic/testable; no claim of mastery is awarded from discovery alone.

### KM-057 — Create market vocabulary pack
- **Status (2026-10-24):** 🟡 partial — 160 entries (≥150) — all draft, none reviewed.
- **Priority:** P1
- **Depends on:** KM-050, KM-052
- **Work:** author at least 150 curated lexical entries across goods, trade, prices/quantities, directions, people/jobs, objects, and story terms.
- **Acceptance:** every entry includes Arabic, Indonesian meaning, useful context/example where appropriate, topic tags, provenance, and review state; duplicates and spelling inconsistencies are checked.

### KM-058 — Create nahwu question bank
- **Status (2026-10-24):** 🟡 partial — 7 / 60.
- **Priority:** P1
- **Depends on:** KM-054
- **Work:** author at least 60 reviewed challenges suitable for progression across the market chapter, including explanations and misconception-aware distractors.
- **Acceptance:** mandatory items are reviewed for grammatical accuracy and level; each has a clear teaching prerequisite or tutorial context.

### KM-059 — Create sarf question bank
- **Status (2026-10-24):** 🟡 partial — 8 / 40.
- **Priority:** P1
- **Depends on:** KM-055
- **Work:** author at least 40 reviewed challenges across the required beginner-to-intermediate/selected advanced forms.
- **Acceptance:** forms and examples are linguistically valid; normalization/accepted variants are specified when needed.

### KM-060 — Create integrated analysis challenge bank
- **Status (2026-10-24):** 🟡 partial — 2 / 20.
- **Priority:** P1
- **Depends on:** KM-054, KM-055
- **Work:** author at least 20 integrated tasks requiring context plus nahwu and/or sarf reasoning.
- **Acceptance:** tasks test transfer instead of exact repetition; model answer and rationale are stored; all required boss concepts are taught earlier.

### KM-061 — Implement lexicon UI and search
- **Status (2026-10-24):** ✅ done — Search, topic and state filters, weak flag, review round, draft badge.
- **Priority:** P1
- **Depends on:** KM-052, KM-056
- **Work:** search Arabic/Indonesian; filter by topic, stage, and learning state; show word form, meaning, example, notes, and review status.
- **Acceptance:** RTL and diacritics display correctly; unknown words stay hidden only where intended; list is usable on mobile.

### KM-062 — Expert content review and provenance audit
- **Status (2026-10-24):** ⬜ not started — Requires a qualified Arabic reviewer.
- **Priority:** P0 before public release
- **Depends on:** KM-057 through KM-060
- **Work:** review mandatory Arabic content with a qualified subject-matter reviewer; record issue, correction, source, and review status.
- **Acceptance:** public build includes no item falsely labelled expert-reviewed; all mandatory items have review status recorded; unresolved disputed items are removed or explicitly accepted with rationale.

## Phase 6 — Stage-specific implementation

### KM-070 — Build Stage 1: Morning Market layout
- **Status (2026-10-24):** ✅ done — 56×46 authored Morning Market; validated; physics-bot walkable.
- **Priority:** P1
- **Depends on:** KM-022, KM-023, KM-030, KM-031
- **Work:** create central plaza, main aisle, stalls, side lane, courtyard, and optional stash using authored layout.
- **Acceptance:** composition is readable; landmarks are memorable; every required path passes validation; screenshot review completed at desktop and mobile sizes.

### KM-071 — Implement Stage 1 shopping quest
- **Status (2026-10-24):** ✅ done — Price boards → vendor dialogue → numeric/dual challenge → label-reading basket choice → delivery → curtain → exit.
- **Priority:** P1
- **Depends on:** KM-044, KM-052, KM-057, KM-070
- **Work:** request list, item inspection, quantity/price clue, NPC delivery, optional side reward.
- **Acceptance:** quest teaches and reuses market vocabulary; the player can recover the request in the journal; quest states are tested.

### KM-072 — Build Stage 2: Merchants' Alleys layout
- **Status (2026-10-24):** ⬜ not started
- **Priority:** P1
- **Depends on:** KM-070, KM-030, KM-031
- **Work:** covered souk, delivery routes, storage rooms, junction loops, lock/shortcut, and clue landmark.
- **Acceptance:** differs in composition/rhythm from Stage 1; critical route is fair; optional route reward is discoverable.

### KM-073 — Implement Stage 2 delivery and grammar gate
- **Status (2026-10-24):** ⬜ not started
- **Priority:** P1
- **Depends on:** KM-032, KM-033, KM-041, KM-054, KM-072
- **Work:** multi-step deliveries; route clues using prepositions/idhafah/adjective agreement; grammar-gated shortcut/exit.
- **Acceptance:** all clues are journaled; answer explanations appear; alternate valid player order does not break the quest.

### KM-074 — Build Stage 3: Vaults of Secrets layout
- **Status (2026-10-24):** ⬜ not started
- **Priority:** P1
- **Depends on:** KM-030, KM-031, KM-022, KM-023
- **Work:** create several distinct rooms, mechanical scale/lock area, inscription wall, optional challenge room, checkpoint, and manuscript chamber.
- **Acceptance:** room graph is purposeful; landmarks orient the player; level validation covers all required puzzle states.

### KM-075 — Implement Stage 3 analysis puzzle chain
- **Status (2026-10-24):** ⬜ not started
- **Priority:** P1
- **Depends on:** KM-032, KM-033, KM-042, KM-054, KM-055, KM-074
- **Work:** combine i'rab role identification, construction analysis, and derived-form reasoning to activate mechanisms.
- **Acceptance:** each rule is taught or surfaced before use; incorrect responses have useful feedback; chain remains solvable after reload/checkpoint.

### KM-076 — Build boss arena and Word Warden state machine
- **Status (2026-10-24):** ⬜ not started
- **Priority:** P1
- **Depends on:** KM-030, KM-031, KM-024, KM-025
- **Work:** author arena, boss sprites/telegraphs, phase state machine, health/phase UI, and defeat/victory transition.
- **Acceptance:** phases are distinct and telegraphed; pause/resume preserves correct phase; no invalid state can skip or repeat phases incorrectly.

### KM-077 — Wire boss phases to learning content
- **Status (2026-10-24):** ⬜ not started
- **Priority:** P1
- **Depends on:** KM-053, KM-054, KM-055, KM-060, KM-076
- **Work:** connect recognition, syntax analysis, and morphology/integrated analysis phases to shield openings and final-seal logic.
- **Acceptance:** all boss concepts have been introduced earlier; mistakes trigger proportionate responses; no phase is a pure damage sponge.

### KM-078 — Implement chapter completion and rewards
- **Status (2026-10-24):** ⬜ not started — Stage-complete results exist for Stage 1 only.
- **Priority:** P1
- **Depends on:** KM-036, KM-056, KM-077
- **Work:** chapter summary, quest closure, lexicon pack/reward, completion stats, replay, and future-chapter placeholder that is clearly labelled locked/not yet available.
- **Acceptance:** victory persists; replay does not corrupt first completion; the summary distinguishes gameplay results from learning performance.

## Phase 7 — Enemies, challenge balance, and feel

### KM-080 — Implement enemy behavior framework
- **Status (2026-10-24):** ⬜ not started
- **Priority:** P1
- **Depends on:** KM-013, KM-030, KM-031
- **Work:** shared actor state machine for patrol, investigate, chase, retreat/stun, and defeat/reset as needed.
- **Acceptance:** enemy intent is legible; navigation respects collision; enemies cannot permanently block required progression.

### KM-081 — Create stage-specific enemy archetypes
- **Status (2026-10-24):** ⬜ not started
- **Priority:** P2
- **Depends on:** KM-080, KM-024
- **Work:** implement only archetypes used by the market chapter, each with distinct behavior and visual/audio cues.
- **Acceptance:** every archetype can be described by its counterplay; player can reliably recognize its active state.

### KM-082 — Implement difficulty and assistance scaling
- **Status (2026-10-24):** 🟡 partial — Help level (hints 0/1/3, markers on/off) only; no difficulty scaling system.
- **Priority:** P1
- **Depends on:** KM-080, KM-053
- **Work:** configure enemy pressure, hint availability, timing windows, and optional challenge depth via data.
- **Acceptance:** higher difficulty raises decision complexity/pressure without making required Arabic content ambiguous; easier settings do not remove all meaningful learning.

### KM-083 — Tune movement and interaction feel
- **Status (2026-10-24):** ⬜ not started — Not tuned beyond a single walk speed; needs playtesting.
- **Priority:** P1
- **Depends on:** KM-013, KM-040, KM-080
- **Work:** tune acceleration/turning, interaction range, hit response, pickup feedback, and input buffering if required.
- **Acceptance:** controls feel predictable at 30+ FPS mobile and 60 FPS desktop; no action feels delayed by unnecessary UI animation.

## Phase 8 — Audio, atmosphere, and UI polish

### KM-090 — Implement state-aware audio manager
- **Status (2026-10-24):** ✅ done — State-aware procedural audio manager with master/music/sfx/mute. Audio output not audibly verified in this environment.
- **Priority:** P1
- **Depends on:** KM-010, KM-015
- **Work:** independent master/music/SFX volume, mute, audio unlock/resume, stage ambience, cues for discovery/danger/puzzle/boss/victory, and overlay ducking.
- **Acceptance:** no audio plays before browser policy allows it; no stuck/overlapping music after scene changes; volume settings persist.

### KM-091 — Create and register audio assets
- **Status (2026-10-24):** 🟡 partial — Procedural audio registered; no recorded assets. Not audibly reviewed.
- **Priority:** P1
- **Depends on:** KM-004, KM-090
- **Work:** use original or properly licensed music/SFX/ambience; provide stage-specific identity and loop points.
- **Acceptance:** license recorded; loops are tested; all essential auditory cues have visual/text equivalents.

### KM-092 — Implement responsive HUD and overlays
- **Status (2026-10-24):** ✅ done — Responsive HUD, modals with focus trap, bottom sheet camera inset; verified on 3 touch viewports.
- **Priority:** P1
- **Depends on:** KM-015, KM-034, KM-035
- **Work:** stage objective, interaction prompt, health/charges where applicable, map/journal, word log, pause/settings, challenge prompts, and boss UI.
- **Acceptance:** visual hierarchy remains clear at supported viewport sizes; gameplay is paused or safely modal when prompts require focus; no essential control is cut off.

### KM-093 — Implement left-handed and control customization
- **Status (2026-10-24):** ✅ done — Left-handed layout, joystick/D-pad, size, opacity, safe areas; touch ≥44 px verified.
- **Priority:** P1
- **Depends on:** KM-012, KM-092
- **Work:** analog joystick/D-pad/swipe modes, left-handed orientation, size/opacity controls, safe areas, and persistence.
- **Acceptance:** settings immediately affect controls and survive reload; touch target and conflict tests pass on a real phone/tablet or documented emulator setup.

### KM-094 — Implement settings and accessibility options
- **Status (2026-10-24):** ✅ done — Text size, translation, controls, volumes, mute, reduced motion, shake, help, key remap, reset.
- **Priority:** P1
- **Depends on:** KM-015, KM-090, KM-092
- **Work:** language, Arabic text size, translation visibility, reduced motion, screen shake, audio sliders, and save reset confirmation.
- **Acceptance:** each setting is functional—not just a visual toggle—and all settings have sensible defaults and persistent state.

### KM-095 — Add transitions and environmental feedback polish
- **Status (2026-10-24):** 🟡 partial — Toasts, shake, brackets, fades. No stage transitions/screen wipes.
- **Priority:** P2
- **Depends on:** KM-026, KM-090, KM-092
- **Work:** door animations, item pickup, quest completion, boss entrance, chapter transition, and discovery feedback.
- **Acceptance:** transitions are brief and skippable where appropriate; reduced motion is respected; feedback never blocks required input unexpectedly.

## Phase 9 — Mobile, PWA, offline, and performance

### KM-100 — Implement responsive layout/device profiles
- **Status (2026-10-24):** 🟡 partial — Responsive via scale rules + CSS breakpoints; verified in Chromium emulation only.
- **Priority:** P0
- **Depends on:** KM-092, KM-093
- **Work:** define layouts for desktop, tablet, mobile landscape, and mobile portrait/fallback states.
- **Acceptance:** all essential UI is visible and actionable; no page-level scrolling breaks gameplay; safe-area insets are respected.

### KM-101 — Add manifest and installable app shell
- **Status (2026-10-24):** ✅ done — Manifest + generated icons incl. maskable. Install prompt not verified.
- **Priority:** P1
- **Depends on:** KM-010
- **Work:** app manifest, appropriate icons, display mode, theme/background colours, and install guidance.
- **Acceptance:** manifest validates; tested browsers show correct app metadata; unsupported installation paths are documented honestly.

### KM-102 — Implement service worker/offline caching
- **Status (2026-10-24):** ✅ done — Hash-versioned precache + cache-first SW; verified offline reload and offline new game in Chromium.
- **Priority:** P1
- **Depends on:** KM-101, KM-091
- **Work:** cache shell and essential first-chapter assets, handle versioned updates, and provide offline fallback/status messaging.
- **Acceptance:** after one successful installation/load, the core chapter starts offline on the tested browser matrix; update does not discard local save.

### KM-103 — Performance profile and optimize
- **Status (2026-10-24):** ⬜ not started — No profiling or budgets measured.
- **Priority:** P1
- **Depends on:** KM-070, KM-072, KM-074, KM-076, KM-100
- **Work:** profile frame time, draw calls/render loops, asset sizes, memory, audio, and resize handling on desktop and mid-range mobile.
- **Acceptance:** target 60 FPS desktop and 30+ FPS mobile under representative conditions or document measured constraints and a mitigation plan; no unbounded effects or event leaks.

### KM-104 — Validate pixel scaling, text shaping, and browser differences
- **Status (2026-10-24):** 🟡 partial — Integer scaling and Arabic shaping verified in Chromium only; Safari/Firefox/real devices untested.
- **Priority:** P0
- **Depends on:** KM-020, KM-100
- **Work:** test nearest-neighbor art, Arabic shaping/diacritics, RTL mixed text, safe areas, focus, and audio resumption in supported browsers.
- **Acceptance:** device/browser matrix and defects are documented; no known text clipping/critical control loss remains.

## Phase 10 — Testing, review, and release

### KM-110 — Unit-test core game systems
- **Status (2026-10-24):** ✅ done — 68 tests covering implemented systems (normalisation, challenges, progress, save, quests, level, validator, headless campaign).
- **Priority:** P0
- **Depends on:** KM-011, KM-016, KM-031, KM-033, KM-051, KM-053
- **Work:** test schema validation, objective state, save migration, normalization, answer evaluation, level reachability, boss phase transitions, and review scheduling.
- **Acceptance:** meaningful tests cover normal and failure cases; test results are part of the release report.

### KM-111 — Add end-to-end campaign smoke tests
- **Status (2026-10-24):** 🟡 partial — Stage 1 full campaign headless (Node) and in a real browser; no multi-stage campaign yet.
- **Priority:** P0
- **Depends on:** KM-071, KM-073, KM-075, KM-077, KM-078
- **Work:** test new save to chapter completion, failure/retry, pause/resume, reload/checkpoint, and side objective behavior.
- **Acceptance:** all mandatory campaign paths complete without manual console intervention; no softlocks or duplicate reward bugs.

### KM-112 — Add content QA checks
- **Status (2026-10-24):** ✅ done — tools/validate-content.mjs.
- **Priority:** P0
- **Depends on:** KM-057 through KM-062
- **Work:** verify IDs, empty fields, duplicate entries, broken RTL content, invalid options, answer-key mismatch, missing rationales, unreviewed mandatory items, and broken source references.
- **Acceptance:** CI or local validation fails on defined blocking errors; QA report identifies content precisely by ID.

### KM-113 — Conduct usability sessions
- **Status (2026-10-24):** ⬜ not started — No users available.
- **Priority:** P1
- **Depends on:** KM-078, KM-100
- **Work:** test with a small representative group including at least one mobile player and, where possible, Arabic-language students/reviewer. Ask players to complete the first quest without coaching.
- **Acceptance:** record concrete issues and fixes; players can identify movement, interaction, journal, pause, and next objective; feedback is not represented as statistically conclusive research.

### KM-114 — Academic sign-off and Arabic proofreading
- **Status (2026-10-24):** ⬜ not started — Requires an Arabic-language academic reviewer.
- **Priority:** P0 before public release
- **Depends on:** KM-062, KM-112
- **Work:** obtain review of required Arabic content, answer keys, explanations, and language display from a qualified reviewer.
- **Acceptance:** sign-off/status is recorded; unresolved disputed items are corrected, accepted with rationale, or removed before release.

### KM-115 — Security, privacy, and dependency review
- **Status (2026-10-24):** 🟡 partial — No runtime deps; content rendered via textContent/DOM nodes (no innerHTML for data); debug hook is query-gated. No formal review.
- **Priority:** P1
- **Depends on:** KM-004, KM-102
- **Work:** inspect dependency vulnerabilities where tooling permits, asset licensing, local data practices, dynamic text rendering, and external network dependency.
- **Acceptance:** no secret or unnecessary personal data collection; no unsafe rendering path for content; unresolved high-risk dependency/license issue is documented and blocks release when necessary.

### KM-116 — Final build, README, and release checklist
- **Status (2026-10-24):** 🟡 partial — README + check scripts. No release checklist run.
- **Priority:** P0
- **Depends on:** KM-110 through KM-115
- **Work:** run production build, full test suite, PWA validation, release-mode smoke test, and update setup/content/art documentation.
- **Acceptance:** clean install/build works using documented commands; release checklist, known issues, browser matrix, content review status, and artifact/license register are complete.

## Post-MVP backlog

### KM-200 — Add next district framework/content
- **Priority:** P3
- Add Hall of Knowledge or Everyday Passage only after the market chapter meets the MVP bar.

### KM-201 — Add optional audio pronunciation practice
- **Priority:** P3
- Add recorded/licensed pronunciation and replay controls; speech grading is not required.

### KM-202 — Add advanced free-response analysis mode
- **Priority:** P3
- Add a robust input and marking experience for sentence analysis, accepted variants, and instructor-reviewed rubrics.

### KM-203 — Add teacher/classroom tools
- **Priority:** P3
- Consider exportable progress summaries or classroom packs only after privacy and data minimization are defined.

### KM-204 — Add additional enemy/side-quest archetypes
- **Priority:** P3
- Only add mechanics that support new learning or exploration patterns rather than increasing content volume without depth.

---

## Suggested execution order (critical path)

1. KM-001 to KM-004: audit, architecture, guardrails.
2. KM-010 to KM-017: runnable modular foundation and persistence.
3. KM-020 to KM-027: art pipeline and first coherent tileset.
4. KM-030 to KM-036: authored stages, validation, quests, checkpoints.
5. KM-040, KM-050, KM-051, KM-053: interaction and learning runtime.
6. KM-070 and KM-071: **finish one polished Morning Market vertical slice first**.
7. Run internal usability/performance review and fix foundation issues before content expansion.
8. KM-072 to KM-078: complete all remaining market stages and boss.
9. KM-054 to KM-062 plus KM-080 to KM-095: fill and review academic content, enemy behavior, audio, and UX.
10. KM-100 to KM-116: device testing, PWA/offline, accessibility, quality gates, and release.

## Required agent status report after each phase

Use this exact structure:

- **Phase / tasks completed:** task IDs and short summary.
- **Files changed:** important files and purpose.
- **User-visible behavior:** what now works end-to-end.
- **Validation performed:** exact commands/tests/device profiles and actual results.
- **Known issues:** failures, limitations, and severity; do not hide failing tests.
- **Next tasks:** IDs from this backlog, respecting dependencies.

## Release blocker checklist

- [ ] Core chapter can be completed from a fresh save.
- [ ] All four stages have different spatial design and gameplay identity.
- [ ] Boss encounter has three distinct, curriculum-grounded phases.
- [ ] No mandatory level/quest softlocks.
- [ ] Arabic content and explanations have documented subject-matter review.
- [ ] Arabic rendering and diacritics pass the supported browser matrix.
- [ ] Keyboard and touch actions work; left-handed controls are tested.
- [ ] Save data survives reload and reset is deliberate.
- [ ] Reduced motion, audio volume, translation visibility, and text size work.
- [ ] PWA/offline behavior has been verified on named devices/browsers.
- [ ] Automated tests and production build pass, or explicitly documented blockers remain.
- [ ] Asset licenses, setup steps, test steps, and known issues are documented.
