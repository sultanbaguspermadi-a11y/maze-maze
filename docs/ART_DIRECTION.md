# KM-020 — Pixel-art specification

**Mood:** a living morning bazaar, late-90s arcade readability, warm stone and cloth with turquoise/lapis accents.

## Technical rules (enforced in code)
| Rule | Value |
|---|---|
| Tile | 16×16 |
| Characters | 16×24 sprites, 4 facings × 4 walk frames, 1 px ink outline `#1d1620` |
| Scaling | integer only (`floor(width / (16 × tiles-across))`), nearest-neighbour, camera pixel-snapped |
| View | ≈20 tiles across on landscape, 12 on portrait (verified: 390×844 → ×2, 844×390 → ×2, 820×1180 → ×4, 1280×720 → ×4) |
| Light | upper-left; shadows fall lower-right |
| Ramps | 3 steps per material (shade/base/highlight) |
| Effects | additive light pools, 7 % warm tint, vignette, ≤22 dust motes; all disabled by "reduced motion" |

## Palette (named, reused through `render/pixel.js`)
Ink `#1d1620` · cobble `#a58f6e` · plaza stone `#b9a27c` · sand `#c9a86a` · courtyard limestone `#cbbd9f` + lapis `#3a5a98` ·
plaster ochre `#c8955c` / rose `#b9825a` / straw `#d1b078` · roof `#9a7a5a` · turquoise `#2fa59d` · saffron `#e8a33d` ·
pomegranate `#8f3550`. Stall cloth pairs: dates ochre, bread red, water blue, pottery orange, spice plum, fabric green.

## Stage identity (Stage 1 — implemented)
Silhouettes distinguish places from far away: the **fountain** (plaza), the **oven dome + chimney** (bread aisle),
**date palms with foreground canopies**, **striped awnings per trade**, **lapis diamond courtyard floor**, **sand alley with
crates**, **hanging lantern beams** over lane entrances. Foreground items (awnings, beams, arches, palm crowns, oven) fade
to 50–60 % when they would hide the player.

## UI
Dark panels (`#1a1730`) with brass border, saffron primary action, turquoise = success, rose = error. **Colour is never the
only signal**: every state also has a glyph or word (✓ ✗ ▸ ·, "benar/belum tepat", "draf").

## Visual review checklist (KM-027, applied to Stage 1 only)
- [x] landmark readable at 12 and 20 tiles across
- [x] no tile-seam shimmer when scrolling (integer scale, snapped camera)
- [x] player never fully hidden (fade rules; bottom-sheet camera inset)
- [x] props sit on the floor with consistent shadows
- [ ] side-by-side review with an artist — **not done**; art is procedural and should be judged by a human art director
