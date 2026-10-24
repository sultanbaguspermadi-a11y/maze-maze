# Content guide (KM-050, KM-112)

## Data shapes (see `src/content/`)
- **Lexicon entry** `{ id, ar (with tashkeel), plain (derived), gloss (id), pos, topic, stage, provenance, review }`
- **Challenge** `{ id, type: choice|order|short, strand: vocab|nahwu|sarf|integrated, topic, difficulty, direction, prompt, ar?,
  options|tokens|answers, answer, rationale, optionFeedback?, hints[], lex[], prerequisites[], misconception, provenance, review }`
- **Quest** objectives are typed events (`talk, inspect, collect, deliver, answer, reach, …`) with `requires`, `requiresFlags`, `grants`.
- **Dialogue** is a node graph with conditional entries, choices, effects and challenge nodes.

## Review states (never blur them)
`draft` (authored, unreviewed) → `reviewed` (needs `reviewer` + `date`, enforced by the validator) · `disputed` · `derived`
(machine-generated review items built from the lexicon). **Currently every authored item is `draft`; zero are `reviewed`.**
The UI shows a **draf** badge in the Lexicon and the About dialog states that the Arabic is unreviewed.

## Rules for authors
1. Do not state a grammar rule you cannot cite; if uncertain, leave the rationale descriptive ("pola فَعَالِيل") and mark `draft`.
2. Distractors must be real forms of other words or deliberate *case/number* errors tied to a named `misconception`.
   Do not invent non-words.
3. Teach before testing: every `prerequisites` word must be discoverable earlier (the practice board enforces this at runtime).
4. Pick a normalisation policy per typed item (`exact`, `lenient-tashkeel`, `lenient-orthography`); never unify hamza shapes
   in an orthography test.
5. Run `node tools/validate-content.mjs` — it fails on unknown refs, answers missing from options, dead-end dialogue,
   undeclared dialogue effects, unreachable objectives and soft-locks.

## Inventory vs PRD minimums (run the validator for live numbers)
| Strand | Have | PRD minimum | Status |
|---|---|---|---|
| Lexicon | 160 | 150 | met in count, all draft |
| Nahwu | 7 | 60 | **shortfall** |
| Sarf | 8 | 40 | **shortfall** |
| Integrated | 2 | 20 | **shortfall** |

Stage 1's grammar load is intentionally light (numbers, dual, broken plurals, adjective agreement); the PRD's heavy nahwu
topics (idhafah, kana/inna, hal, tamyiz, istithna', conditionals, mazid forms…) belong to Stages 2–4, which are not built.
