// Tileset + static layer bake (KM-021/022). Floors have variants + controlled detail noise; walls auto-select roof/facade/deep.
import { PAL, mk, R, shade, rngAt } from './pixel.js';

const T = 16;
function cobble(v) {
  const [c, x] = mk(T, T); const r = rngAt(v, 1, 'cob');
  R(x, PAL.cobble[v % 4], 0, 0, T, T);
  // irregular stones: two rows offset
  for (let row = 0; row < 2; row++) {
    const y0 = row * 8, off = row ? 4 : 0;
    for (let sx = -off; sx < T; sx += 8) {
      R(x, PAL.cobbleJoint, Math.max(0, sx), y0, 1, 8); R(x, PAL.cobbleJoint, Math.max(0, sx), y0 + 7, 8, 1);
      R(x, PAL.cobbleHi, Math.max(0, sx) + 1, y0 + 1, 5, 1);
    }
  }
  for (let i = 0; i < 5; i++) R(x, r() < 0.5 ? '#8d795c' : '#b9a481', (r() * 14) | 0, (r() * 14) | 0, 1, 1);
  return c;
}
function plaza(v) {
  const [c, x] = mk(T, T); const r = rngAt(v, 2, 'plz');
  R(x, PAL.plaza[v % 4], 0, 0, T, T);
  R(x, PAL.plazaJoint, 0, 15, T, 1); R(x, PAL.plazaJoint, 15, 0, 1, T);
  R(x, 'rgba(255,255,255,0.10)', 0, 0, T - 1, 1); R(x, 'rgba(255,255,255,0.07)', 0, 0, 1, T - 1);
  for (let i = 0; i < 4; i++) R(x, r() < 0.5 ? '#a38c68' : '#c8b28b', (r() * 14) | 0, (r() * 14) | 0, 1, 1);
  return c;
}
function sand(v) {
  const [c, x] = mk(T, T); const r = rngAt(v, 3, 'snd');
  R(x, PAL.sand[v % 3], 0, 0, T, T);
  for (let i = 0; i < 12; i++) R(x, r() < 0.6 ? PAL.sandDark : '#dcc088', (r() * 15) | 0, (r() * 15) | 0, 1 + ((r() * 2) | 0), 1);
  return c;
}
function court(v) {
  const [c, x] = mk(T, T);
  R(x, PAL.court[v % 3], 0, 0, T, T); R(x, PAL.courtJoint, 0, 15, T, 1); R(x, PAL.courtJoint, 15, 0, 1, T);
  if (v % 2 === 0) { // lapis diamond inlay on alternate tiles
    x.fillStyle = PAL.courtBlue;
    for (let i = 0; i < 4; i++) { x.fillRect(8 - i - 1, 4 + i, (i + 1) * 2, 1); x.fillRect(8 - i - 1, 11 - i, (i + 1) * 2, 1); }
    R(x, '#e7dcc0', 7, 7, 2, 2);
  }
  return c;
}
function wood(v) {
  const [c, x] = mk(T, T); const r = rngAt(v, 4, 'wd');
  R(x, PAL.wood[v % 3], 0, 0, T, T); R(x, PAL.woodDark, 0, 5, T, 1); R(x, PAL.woodDark, 0, 11, T, 1);
  R(x, PAL.woodHi, 0, 0, T, 1);
  for (let i = 0; i < 4; i++) R(x, PAL.woodDark, (r() * 14) | 0, [2, 8, 13][i % 3], 2, 1);
  return c;
}
function kstone(v) {
  const [c, x] = mk(T, T); const r = rngAt(v, 5, 'ks');
  R(x, PAL.kstone[v % 3], 0, 0, T, T); R(x, PAL.kJoint, 0, 7, T, 1); R(x, PAL.kJoint, v % 2 ? 4 : 10, 0, 1, 8); R(x, PAL.kJoint, v % 2 ? 11 : 5, 8, 1, 8);
  for (let i = 0; i < 4; i++) R(x, '#6a6480', (r() * 14) | 0, (r() * 14) | 0, 1, 1);
  return c;
}
function roof(v, deep) {
  const [c, x] = mk(T, T); const r = rngAt(v, 6, 'rf');
  R(x, deep ? PAL.roofDeep : PAL.roof, 0, 0, T, T);
  if (!deep) { for (let y = 3; y < T; y += 4) R(x, shade(PAL.roof, -14), 0, y, T, 1); for (let i = 0; i < 6; i++) R(x, PAL.roofHi, (r() * 14) | 0, [1, 5, 9, 13][i % 4], 3, 1); }
  return c;
}
function facade(kind, v) {
  const [c, x] = mk(T, T); const r = rngAt(v, 7, 'fc');
  const base = [PAL.plasterA, PAL.plasterB, PAL.plasterC][kind % 3];
  R(x, base, 0, 0, T, T);
  R(x, PAL.roofEdge, 0, 0, T, 2); R(x, PAL.roofHi, 0, 0, T, 1);             // cornice
  R(x, shade(base, -22), 0, 2, T, 2);                                          // eave shadow
  for (let i = 0; i < 7; i++) R(x, r() < 0.5 ? shade(base, -14) : shade(base, 10), (r() * 13) | 0, 5 + ((r() * 8) | 0), 2 + ((r() * 3) | 0), 1);
  R(x, PAL.plasterShade, 0, 14, T, 2); R(x, shade(PAL.plasterShade, -20), 0, 15, T, 1);
  if (v % 3 === 1) { // shuttered window
    R(x, PAL.ink, 4, 5, 8, 8); R(x, '#2a2230', 5, 6, 6, 6); R(x, PAL.turquoise, 4, 5, 2, 8); R(x, PAL.turquoise, 10, 5, 2, 8);
    R(x, PAL.turquoiseDk, 4, 12, 8, 1); R(x, '#f3d9a0', 7, 8, 2, 1);
  }
  return c;
}

export function buildAtlas() {
  const A = { cobble: [0, 1, 2, 3].map(cobble), plaza: [0, 1, 2, 3].map(plaza), sand: [0, 1, 2].map(sand), court: [0, 1, 2, 3].map(court),
    wood: [0, 1, 2].map(wood), k: [0, 1, 2].map(kstone), roof: [0, 1, 2, 3].map((v) => roof(v, false)), deep: [roof(0, true)],
    facade: [0, 1, 2].flatMap((k) => [0, 1, 2].map((v) => facade(k, k * 3 + v))) };
  return A;
}

const RUG = { teal: ['#2d7f86', '#e8d5a0', '#164a50'], wine: ['#8f3550', '#e8d5a0', '#561d30'], saffron: ['#d79a35', '#f0e2b8', '#8a5a1c'] };
function drawRug(x, d, T0) {
  const [a, b, dk] = RUG[d.pal]; const px = d.x * T0, py = d.y * T0, w = d.w * T0, h = d.h * T0;
  R(x, dk, px, py, w, h); R(x, a, px + 1, py + 1, w - 2, h - 2); R(x, b, px + 2, py + 2, w - 4, 1); R(x, b, px + 2, py + h - 3, w - 4, 1);
  for (let i = 4; i < w - 4; i += 4) { R(x, b, px + i, py + (h >> 1) - 1, 2, 2); R(x, dk, px + i + 1, py + (h >> 1), 1, 1); }
  for (let i = 0; i < w; i += 2) { R(x, b, px + i, py - 1, 1, 1); R(x, b, px + i, py + h, 1, 1); }
}

// Bake floors, walls and rug decals of the whole stage into one canvas (static layer).
export function bakeStatic(level, atlas) {
  const { w, h, def } = level;
  const [c, x] = mk(w * T, h * T);
  const grid = def.grid, wallAt = (tx, ty) => tx < 0 || ty < 0 || tx >= w || ty >= h || def.legend[grid[ty][tx]]?.solid;
  const pick = (arr, tx, ty) => arr[(tx * 7 + ty * 13 + ((tx * ty) % 5)) % arr.length];
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const ch = grid[ty][tx], px = tx * T, py = ty * T;
    if (def.legend[ch]?.solid) {
      let near = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!wallAt(tx + dx, ty + dy)) near = true;
      if (!wallAt(tx, ty + 1)) x.drawImage(atlas.facade[(Math.floor(tx / 5) * 3 + (tx + ty) % 3) % atlas.facade.length], px, py);
      else if (near) x.drawImage(pick(atlas.roof, tx, ty), px, py);
      else x.drawImage(atlas.deep[0], px, py);
      if (near && wallAt(tx, ty + 1) && !wallAt(tx + 1, ty)) R(x, PAL.roofEdge, px + 15, py, 1, T);
      if (near && wallAt(tx, ty + 1) && !wallAt(tx - 1, ty)) R(x, PAL.roofEdge, px, py, 1, T);
    } else {
      const set = { '.': atlas.cobble, p: atlas.plaza, s: atlas.sand, t: atlas.court, w: atlas.wood, k: atlas.k }[ch] || atlas.cobble;
      x.drawImage(pick(set, tx, ty), px, py);
      // wall contact shadow on floors directly beneath a facade
      if (wallAt(tx, ty - 1)) { R(x, 'rgba(40,24,30,0.28)', px, py, T, 3); R(x, 'rgba(40,24,30,0.12)', px, py + 3, T, 2); }
    }
  }
  // plaza inlay around the fountain: turquoise ring + saffron diamonds (orientation landmark)
  const cx = 28, cy = 25;
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    if (grid[ty][tx] !== 'p') continue;
    const dx = tx - cx + 0.5 - 0.5, dy = ty - cy, d = Math.max(Math.abs(tx - 27.5), Math.abs(ty - 24.5));
    const px = tx * T, py = ty * T;
    if (d >= 4.5 && d < 5.5) { R(x, PAL.turquoiseDk, px, py + 1, T, T - 2); R(x, PAL.turquoise, px, py + 3, T, T - 6); R(x, '#e7dcc0', px + 7, py + 7, 2, 2); }
    else if (d >= 6.5 && d < 7.5 && (tx + ty) % 2 === 0) { x.fillStyle = PAL.saffron; for (let i = 0; i < 4; i++) { x.fillRect(8 - i - 1, 4 + i + py - 0 - 0, 0, 0); } R(x, PAL.saffron, px + 6, py + 6, 4, 4); R(x, '#a86f1d', px + 7, py + 7, 2, 2); }
    void dx; void dy;
  }
  for (const d of def.decals || []) if (d.type === 'rug') drawRug(x, d, T);
  return c;
}
