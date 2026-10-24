# KM-001 — Repository audit

**Date:** 2026-10-24 · **Auditor:** implementation session (Claude)

## What was actually provided
`Kalimah_Maze_PRD_and_Tasks.zip` (30 609 bytes) contains exactly three files and **no game source**:

| File | Bytes |
|---|---|
| `PRD_Kalimah_Maze_Chronicles_of_the_Lost_Bazaar.md` | 38 753 |
| `IMPLEMENTATION_TASKS.md` | 34 554 |
| `CLAUDE_IMPLEMENTATION_PROMPT.md` | 5 858 |

The prompt asks for an audit of "the existing game engine, rendering system, level generation, controls, UI, audio,
vocabulary data, grammar exercises, save system and PWA functionality". **None of those artefacts were in the archive**, so
none could be inspected. The earlier single-file prototype ("Lost Language Archives") was built in previous chat sessions
and was not attached to this one.

## Consequences
- No legacy defect list, save-key list, or licence inventory could be produced. Nothing was claimed about the old code.
- **No legacy save import** was written: guessing the old storage keys would risk corrupting data. `MIGRATIONS` in
  `src/persistence/save.js` is intentionally empty; the mechanism is unit-tested with synthetic steps.
- **No old behaviour was "retained"** — the game was rebuilt from the PRD. If the old HTML/repo is supplied, the audit
  should be redone and any reusable vocabulary or art reconciled (see KM-001 follow-up in `STATUS_REPORT.md`).

## Environment audit (what the build could rely on)
| Item | Finding |
|---|---|
| Node | v22 |
| Network | disabled → no `npm install`, no CDN fonts, no Vite/Phaser |
| Browser for verification | Chromium headless shell via a globally installed Playwright (dev-only) |
| Arabic fonts | system only (DejaVu Sans, FreeSerif in the sandbox); the CSS stack prefers Noto Naskh / Amiri / Scheherazade when present |
| Package scripts | none existed; created `package.json` (`start`, `test`, `validate`, `check`, `smoke`) |

## Migration risks
1. Arabic font availability differs per device. Text is real DOM text (not baked into canvas), so shaping is the browser's;
   see KM-104 in the status report for what was and was not verified.
2. Content provenance: all Arabic is authored, unreviewed (`review.status: draft`).
3. Save format v1 is new; future schema changes must add a `MIGRATIONS[n]` step.
