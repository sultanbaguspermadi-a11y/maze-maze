// Bazaar prop set (KM-023). Every prop is generated in code with consistent rules:
// light from upper-left, 1px ink outline, 3-step material ramps, shadows to lower-right.
import { PAL, mk, R, shade, outlined, rngAt } from './pixel.js';

const T = 16;
function blob(x, col, cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))));
    if (w >= 0) R(x, col, cx - w, cy + y, w * 2 + 1, 1);
  }
}
const line = (x, col, x0, y0, x1, y1, t = 1) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) R(x, col, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t, t);
};

// ---- goods on counters ----
function jar(x, ox, oy, s, col) {
  const w = s === 'l' ? 6 : 4, h = s === 'l' ? 9 : 6;
  blob(x, shade(col, -34), ox, oy + h - 1, w, 3); blob(x, col, ox, oy + 3 + (s === 'l' ? 1 : 0), w, h / 2 | 0 || 3);
  R(x, col, ox - 2, oy - 1, 5, 3); R(x, shade(col, -34), ox - 3, oy - 2, 7, 2); R(x, shade(col, 40), ox - w + 1, oy + 2, 1, 3);
  R(x, PAL.turquoise, ox - w + 1, oy + 4, w * 2 - 1, 1);
}
function basket(x, fill) {
  R(x, '#7a5128', 1, 8, 14, 6); R(x, '#a9763f', 2, 8, 12, 5); for (let i = 3; i < 14; i += 3) R(x, '#7a5128', i, 8, 1, 5);
  R(x, '#5b3a1c', 1, 7, 14, 1); fill();
}
export function goodsArt(kind) {
  const [c, x] = mk(16, 14);
  const ball = (cx, cy, col, hi) => { blob(x, col, cx, cy, 2, 2); R(x, hi, cx - 1, cy - 1, 1, 1); };
  if (kind === 'fig') basket(x, () => { [[4, 6], [8, 5], [12, 6], [6, 7], [10, 7]].forEach(([a, b]) => ball(a, b, '#6b3a6b', '#a46aa4')); });
  else if (kind === 'dates') basket(x, () => { [[4, 6], [8, 5], [12, 6], [6, 7], [10, 7]].forEach(([a, b]) => { blob(x, '#5e3318', a, b, 2, 1); R(x, '#c8873a', a - 1, b - 1, 1, 1); }); });
  else if (kind === 'grape') basket(x, () => { [[4, 6], [7, 5], [10, 6], [13, 6], [5, 7], [9, 7], [12, 7]].forEach(([a, b]) => ball(a, b, '#6a9a3f', '#bfe28a')); });
  else if (kind.startsWith('bread')) {
    const loaf = (cx, cy) => { blob(x, '#8f5a22', cx, cy + 1, 4, 3); blob(x, '#d9a24f', cx, cy, 4, 3); R(x, '#8f5a22', cx - 2, cy - 1, 1, 2); R(x, '#8f5a22', cx + 1, cy - 1, 1, 2); R(x, '#f0cd88', cx - 3, cy - 1, 2, 1); };
    R(x, '#8a6038', 0, 11, 16, 3); R(x, '#b98a55', 0, 11, 16, 1);
    if (kind === 'bread1') loaf(8, 8); else if (kind === 'bread2') { loaf(4, 8); loaf(12, 8); } else { loaf(4, 9); loaf(12, 9); loaf(8, 5); }
  } else {
    R(x, '#8a6038', 0, 12, 16, 2);
    if (kind === 'jar-s') jar(x, 8, 5, 's', '#b5653a');
    else if (kind === 'jar-twin') { jar(x, 4, 6, 's', '#b5653a'); jar(x, 12, 6, 's', '#b5653a'); }
    else jar(x, 8, 3, 'l', '#b5653a');
  }
  return outlined(c);
}

// ---- stall (two layers so a vendor can stand between them) ----
function stallBack(variant, w) {
  const [c, x] = mk(w * T, T + 8);
  const [cloth] = PAL.cloth[variant] || PAL.cloth.dates;
  R(x, '#3b2a25', 0, 8, w * T, T); R(x, '#4e3a30', 0, 8, w * T, 2); R(x, '#2c1f1c', 0, T + 6, w * T, 2);
  R(x, PAL.woodDark, 0, 17, w * T, 2); R(x, PAL.woodHi, 0, 17, w * T, 1);   // shelf board
  for (let i = 3; i < w * T - 4; i += 7) {
    if (variant === 'dates' || variant === 'water' || variant === 'pots') jar(x, i + 2, 12, 's', variant === 'water' ? '#4a8bb0' : variant === 'pots' ? '#c4733a' : '#a9763f');
    else if (variant === 'bread') { blob(x, '#d9a24f', i + 2, 15, 3, 2); R(x, '#8f5a22', i + 1, 14, 1, 2); }
    else if (variant === 'spice') { blob(x, ['#c0452d', '#e0a33a', '#7d8a3a'][(i / 7 | 0) % 3], i + 2, 15, 3, 2); }
    else { R(x, ['#3a8f7a', '#c4733a', '#8f3550'][(i / 7 | 0) % 3], i, 10, 5, 7); R(x, '#ffffff22', i, 10, 1, 7); }
  }
  R(x, PAL.woodDark, 0, 0, 3, T + 8); R(x, PAL.woodDark, w * T - 3, 0, 3, T + 8); R(x, PAL.woodHi, 0, 0, 1, T + 8);
  R(x, cloth, 3, 8, 1, 1);
  return outlined(c);
}
function stallFront(variant, w) {
  const [c, x] = mk(w * T, T);
  const [cloth, light] = PAL.cloth[variant] || PAL.cloth.dates;
  R(x, PAL.woodHi, 0, 0, w * T, 3); R(x, PAL.woodDark, 0, 3, w * T, 1);        // counter top + edge
  R(x, shade(PAL.wood[0], -6), 0, 4, w * T, 12);
  for (let i = 0; i < w * T; i += 4) R(x, (i / 4) % 2 ? light : cloth, i, 4, 4, 9); // cloth skirt, vertical stripes
  R(x, shade(cloth, -40), 0, 13, w * T, 1); R(x, PAL.woodDark, 0, 14, w * T, 2); R(x, PAL.woodDark, 0, 4, 2, 12); R(x, PAL.woodDark, w * T - 2, 4, 2, 12);
  for (let i = 0; i < w * T; i += 4) R(x, shade(cloth, -20), i, 12, 2, 1);
  return outlined(c);
}

function oven() {
  const [c, x] = mk(64, 62);
  R(x, '#7a3f2a', 4, 34, 56, 28); for (let r = 0; r < 4; r++) for (let i = 0; i < 56; i += 8) { R(x, '#5c2e20', 4 + i + (r % 2) * 4, 34 + r * 7, 1, 7); R(x, '#5c2e20', 4, 34 + r * 7, 56, 1); }
  R(x, '#a8553a', 4, 34, 56, 2);
  [[32, 30, 26, 14, '#8f4731'], [32, 24, 20, 10, '#a8553a'], [32, 18, 13, 7, '#b86445']].forEach(([cx, cy, rx, ry, col]) => blob(x, col, cx, cy, rx, ry));
  R(x, '#7a3f2a', 44, 4, 8, 18); R(x, '#5c2e20', 43, 2, 10, 3); R(x, '#a8553a', 44, 4, 2, 18);          // chimney
  R(x, '#1a0f10', 22, 38, 20, 24); blob(x, '#1a0f10', 32, 38, 10, 6);                                    // mouth
  R(x, '#c4482a', 24, 50, 16, 12); R(x, '#ff9a3c', 26, 53, 12, 9); R(x, '#ffd36a', 29, 56, 6, 6);
  R(x, '#8a5a35', 6, 52, 12, 8); R(x, '#5b3a24', 6, 52, 12, 2); R(x, '#a8744a', 8, 56, 3, 1);                 // wood pile
  R(x, '#5b3a24', 48, 54, 10, 6); R(x, '#d9a24f', 50, 51, 6, 4);                                          // peel + loaf
  return outlined(c);
}
function fountain() {
  const [c, x] = mk(64, 74);
  blob(x, '#8d7e66', 32, 56, 31, 16); blob(x, '#cdbf9e', 32, 52, 31, 16); blob(x, '#e1d6b8', 32, 50, 29, 14);
  blob(x, '#2a7f8e', 32, 52, 24, 11); blob(x, '#3aa6b5', 32, 51, 22, 9); blob(x, '#6fd0d0', 28, 49, 8, 2);
  for (let a = 0; a < 16; a++) R(x, a % 2 ? '#2fa59d' : '#e8a33d', 6 + a * 3 + 1, 44 + (a % 2), 2, 1);
  R(x, '#cdbf9e', 27, 22, 10, 28); R(x, '#a89a7a', 33, 22, 4, 28); R(x, '#e1d6b8', 27, 22, 2, 28);
  blob(x, '#cdbf9e', 32, 24, 12, 4); blob(x, '#3aa6b5', 32, 23, 9, 2); blob(x, '#cdbf9e', 32, 14, 5, 6); R(x, '#a89a7a', 33, 8, 3, 12);
  blob(x, '#e8a33d', 32, 7, 3, 3); R(x, '#ffd36a', 31, 6, 1, 1);
  return outlined(c);
}
function well() {
  const [c, x] = mk(48, 66);
  blob(x, '#8d7e66', 24, 52, 23, 12); blob(x, '#bfae8d', 24, 48, 23, 12); blob(x, '#d8c9a6', 24, 46, 21, 10); blob(x, '#1f4752', 24, 47, 15, 7); blob(x, '#2f6f7e', 24, 46, 12, 5);
  R(x, PAL.woodDark, 5, 12, 4, 36); R(x, PAL.woodDark, 39, 12, 4, 36); R(x, PAL.woodHi, 5, 12, 1, 36); R(x, PAL.woodDark, 3, 10, 42, 4);
  for (let i = 0; i < 6; i++) R(x, i % 2 ? '#9c5b36' : '#b8704a', 2 + i * 7, 4 + (i % 2), 7, 6); R(x, '#6e3a22', 2, 9, 42, 2);
  R(x, '#cdbf9e', 23, 14, 1, 18); R(x, '#8a5a35', 20, 32, 8, 6); R(x, '#5b3a24', 20, 32, 8, 1);
  return outlined(c);
}
function palmTrunk() {
  const [c, x] = mk(16, 36);
  for (let i = 0; i < 36; i++) { const w = 4 + (i > 28 ? 2 : 0); R(x, '#8a6a45', 8 - w / 2 + Math.round(Math.sin(i / 9)), i, w, 1); if (i % 4 === 0) R(x, '#5e4630', 8 - w / 2 + Math.round(Math.sin(i / 9)), i, w, 1); }
  R(x, '#a8845a', 6, 2, 1, 30);
  return outlined(c);
}
function palmCrown() {
  const [c, x] = mk(52, 38);
  const cx = 26, cy = 24;
  for (let f = 0; f < 9; f++) {
    const a = Math.PI + (f / 8) * Math.PI * 1.0 - 0.0, len = 22, dir = Math.cos(a);
    for (let t = 0; t <= 1; t += 0.04) {
      const px = cx + Math.cos(a) * len * t, py = cy + Math.sin(a) * len * t * 0.8 + 18 * t * t * (1 - Math.abs(Math.sin(a)) * 0.4);
      R(x, f % 2 ? '#3f7f3a' : '#4f9444', Math.round(px), Math.round(py), 2, 2);
      if (t > 0.2 && Math.round(t * 25) % 2 === 0) { R(x, '#2c5a2b', Math.round(px), Math.round(py) + 2, 1, 2); R(x, '#6fb25a', Math.round(px), Math.round(py) - 1, 1, 1); }
    }
    void dir;
  }
  [[22, 26], [26, 27], [30, 26]].forEach(([a, b]) => blob(x, '#6a3b1e', a, b, 2, 2));
  return outlined(c);
}
function noticeboard() {
  const [c, x] = mk(32, 34);
  R(x, PAL.woodDark, 3, 8, 3, 26); R(x, PAL.woodDark, 26, 8, 3, 26);
  R(x, '#6e4a2c', 1, 6, 30, 18); R(x, PAL.woodHi, 1, 6, 30, 1); R(x, '#8a6038', 3, 8, 26, 14); R(x, PAL.woodDark, 0, 3, 32, 4);
  [[5, 10, '#f3e6c4'], [13, 11, '#e8d9a8'], [21, 10, '#f3e6c4']].forEach(([a, b, col]) => { R(x, col, a, b, 7, 9); R(x, '#8a6038', a + 1, b + 2, 5, 1); R(x, '#8a6038', a + 1, b + 4, 4, 1); R(x, '#8a6038', a + 1, b + 6, 5, 1); });
  R(x, PAL.wine, 25, 17, 3, 3); R(x, PAL.saffron, 9, 9, 2, 2);
  return outlined(c);
}
function priceboard() {
  const [c, x] = mk(16, 28);
  R(x, PAL.woodDark, 7, 12, 3, 16); R(x, PAL.woodHi, 7, 12, 1, 16);
  R(x, PAL.woodDark, 1, 1, 14, 13); R(x, '#2b2736', 2, 2, 12, 11);
  R(x, '#efe6cf', 3, 4, 7, 1); R(x, '#efe6cf', 3, 7, 9, 1); R(x, '#efe6cf', 3, 10, 5, 1); blob(x, PAL.saffron, 12, 5, 1, 1);
  return outlined(c);
}
function crate1(v = 0) {
  const [c, x] = mk(16, 18); const r = rngAt(v, 1, 'cr');
  R(x, '#b98a55', 0, 2, 16, 5); R(x, '#8a6038', 0, 7, 16, 9); R(x, '#5b3a24', 0, 7, 16, 1);
  for (let i = 3; i < 16; i += 4) R(x, '#5b3a24', i, 8, 1, 8);
  R(x, '#5b3a24', 0, 2, 1, 14); R(x, '#5b3a24', 15, 2, 1, 14); R(x, '#d3a56e', 1, 2, 14, 1); R(x, '#5b3a24', 0, 15, 16, 1);
  if (r() < 0.6) R(x, '#e8d9a8', 3 + ((r() * 8) | 0), 3, 3, 3);
  return outlined(c);
}
function crates(w, h) {
  const [c, x] = mk(w * T + 2, h * T + 6);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) x.drawImage(crate1(i + j * 3), i * T, j * T + 4);
  return c;
}
function barrel() {
  const [c, x] = mk(16, 20);
  blob(x, '#6a4326', 8, 14, 6, 4); R(x, '#7f5130', 2, 5, 12, 10); R(x, '#a06a3e', 2, 5, 2, 10); R(x, '#5b3a24', 12, 5, 2, 10);
  blob(x, '#5e3c22', 8, 5, 6, 3); blob(x, '#3d2616', 8, 5, 4, 2); R(x, '#444a52', 2, 7, 12, 1); R(x, '#444a52', 2, 12, 12, 1);
  return outlined(c);
}
function sack() {
  const [c, x] = mk(16, 18);
  blob(x, '#b8a47a', 8, 11, 6, 6); blob(x, '#d2c196', 7, 9, 5, 5); R(x, '#8d7a52', 6, 3, 4, 3); R(x, '#8f3550', 5, 5, 6, 1); R(x, '#e6d8b0', 5, 7, 1, 3);
  return outlined(c);
}
function jarstack() {
  const [c, x] = mk(16, 22);
  jar(x, 5, 12, 's', '#b5653a'); jar(x, 11, 12, 's', '#9c5b36'); jar(x, 8, 6, 's', '#c4733a');
  return outlined(c);
}
function cart() {
  const [c, x] = mk(48, 44);
  R(x, PAL.woodDark, 4, 14, 40, 14); R(x, PAL.wood[0], 5, 14, 38, 12); R(x, PAL.woodHi, 5, 14, 38, 1);
  for (let i = 8; i < 42; i += 6) R(x, PAL.woodDark, i, 15, 1, 11);
  blob(x, '#b8a47a', 14, 12, 6, 5); blob(x, '#d2c196', 13, 10, 5, 4); blob(x, '#b8a47a', 26, 11, 5, 5); jar(x, 36, 12, 'l', '#c4733a');
  R(x, PAL.woodDark, 0, 18, 6, 3); R(x, PAL.woodDark, 42, 18, 6, 3);
  [10, 38].forEach((cx) => { blob(x, '#3c2a1c', cx, 34, 8, 8); blob(x, '#8a5a35', cx, 34, 6, 6); blob(x, '#3c2a1c', cx, 34, 1, 1); R(x, '#5b3a24', cx - 6, 34, 12, 1); R(x, '#5b3a24', cx, 28, 1, 12); });
  return outlined(c);
}
function potshelf() {
  const [c, x] = mk(32, 40);
  R(x, PAL.woodDark, 0, 6, 32, 34); R(x, '#3b2a25', 2, 8, 28, 30);
  [16, 28].forEach((yy) => { R(x, PAL.woodHi, 0, yy + 6, 32, 2); });
  [[8, 14, '#c4733a'], [18, 14, '#a9763f'], [26, 15, '#4a8bb0'], [8, 26, '#b5653a'], [16, 26, '#c4733a'], [25, 26, '#8f3550']].forEach(([a, b, col]) => jar(x, a, b - 4, 's', col));
  R(x, PAL.woodDark, 0, 3, 32, 4);
  return outlined(c);
}
function gatearch() {
  const [c, x] = mk(64, 40);
  R(x, '#14101c', 8, 12, 48, 28); R(x, '#241c34', 10, 14, 44, 26); R(x, '#33274a', 14, 22, 36, 18); R(x, '#463a62', 20, 30, 24, 10);
  [4, 56].forEach((px) => { R(x, '#cdbf9e', px, 4, 8, 36); R(x, '#e1d6b8', px, 4, 2, 36); R(x, '#a89a7a', px + 6, 4, 2, 36); R(x, '#8d7e66', px - 1, 36, 10, 4); R(x, '#e1d6b8', px - 1, 2, 10, 3); });
  R(x, '#cdbf9e', 8, 4, 48, 8); R(x, PAL.turquoise, 10, 7, 44, 2); for (let i = 12; i < 52; i += 6) R(x, PAL.saffron, i, 7, 2, 2);
  return outlined(c);
}
function exitdoor() {
  const [c, x] = mk(64, 22);
  R(x, '#14101c', 6, 2, 52, 20); R(x, '#f6d98a', 20, 6, 24, 16); R(x, '#ffe9b0', 26, 8, 12, 14);
  R(x, '#cdbf9e', 2, 0, 8, 22); R(x, '#cdbf9e', 54, 0, 8, 22); R(x, '#cdbf9e', 2, 0, 60, 4); R(x, PAL.turquoise, 10, 3, 44, 1);
  for (let i = 0; i < 6; i++) R(x, '#ffd36a', 22 + i * 4, 10 + (i % 2) * 2, 1, 1);
  return outlined(c);
}

const MAKERS = {
  oven: [oven, 0, 30], fountain: [fountain, 0, 10], well: [well, -0, 18], noticeboard: [noticeboard, 0, 18], priceboard: [priceboard, 0, 12],
  barrel: [barrel, 0, 4], sack: [sack, 0, 2], jarstack: [jarstack, 0, 6], cart: [cart, 0, 12], potshelf: [potshelf, 0, 8], gatearch: [gatearch, 0, 24], exitdoor: [exitdoor, 0, 6],
};

// Returns depth-sorted draw items: { sort, img, x, y, fade?, id }
export function buildPropItems(level) {
  const items = [];
  const add = (img, x, y, sort, extra = {}) => items.push({ img, x: x - 1, y: y - 1, sort, ...extra });
  for (const p of level.props) {
    const px = p.x * T, py = p.y * T;
    if (p.type === 'stall') {
      add(stallBack(p.variant, p.w), px, py - 8, py + 2, { id: p.id });
      add(stallFront(p.variant, p.w), px, py + T, (p.y + 2) * T, { id: p.id });
    } else if (p.type === 'palm') add(palmTrunk(), px, py - 20, (p.y + 1) * T, { id: p.id });
    else if (p.type === 'crate') add(crates(p.w, p.h), px, py - 4, (p.y + p.h) * T, { id: p.id });
    else if (MAKERS[p.type]) {
      const [fn, , up] = MAKERS[p.type];
      const img = fn();
      const offX = p.type === 'well' ? 0 : 0;
      add(img, px + offX, py - up, (p.y + p.h) * T - (p.solid === false ? 6 : 0), { id: p.id, fade: ['oven', 'well'].includes(p.type) });
    }
  }
  return items;
}

export function buildForeground(level) {
  const fg = [];
  for (const f of level.foreground) {
    if (f.type === 'awning') {
      const p = level.props.find((q) => q.id === f.stall); const [a, b] = PAL.cloth[p.variant];
      const w = p.w * T; const [c, x] = mk(w + 6, 16);
      R(x, PAL.woodDark, 0, 0, w + 6, 2);
      for (let i = 0; i < w + 6; i += 6) {
        R(x, (i / 6) % 2 ? b : a, i, 2, 6, 8);
        R(x, (i / 6) % 2 ? shade(b, -26) : shade(a, -30), i, 9, 6, 1);
        R(x, (i / 6) % 2 ? b : a, i + 1, 10, 4, 1); R(x, (i / 6) % 2 ? b : a, i + 2, 11, 2, 1);
      }
      R(x, 'rgba(255,255,255,0.25)', 0, 2, w + 6, 1);
      fg.push({ kind: 'awning', img: outlined(c), x: p.x * T - 4, y: p.y * T - 22, sway: f.i, fade: false });
    } else if (f.type === 'beam') {
      const w = f.w * T; const [c, x] = mk(w, 26);
      R(x, PAL.woodDark, 0, 0, w, 4); R(x, PAL.woodHi, 0, 0, w, 1);
      for (let i = 4; i < w - 6; i += 8) { R(x, [PAL.turquoise, PAL.saffron, PAL.wine][(i / 8 | 0) % 3], i, 5, 6, 5); R(x, 'rgba(0,0,0,0.25)', i + 2, 10, 2, 1); }
      for (let i = 24; i < w - 12; i += 48) { R(x, '#3b2a25', i + 4, 4, 1, 4); R(x, PAL.saffron, i, 8, 9, 10); R(x, '#ffd36a', i + 2, 10, 5, 6); R(x, '#3b2a25', i, 8, 9, 1); R(x, '#3b2a25', i, 17, 9, 1); }
      fg.push({ kind: 'beam', img: outlined(c), x: f.x * T - 1, y: f.y * T - 2, rect: { x: f.x * T, y: f.y * T - 2, w, h: 26 }, fade: true });
    } else if (f.type === 'arch') {
      const w = f.w * T; const [c, x] = mk(w + 8, 14);
      R(x, '#cdbf9e', 0, 2, w + 8, 10); R(x, '#e1d6b8', 0, 2, w + 8, 2); R(x, '#a89a7a', 0, 10, w + 8, 2);
      R(x, PAL.turquoise, 3, 6, w + 2, 2); for (let i = 4; i < w + 4; i += 6) R(x, PAL.saffron, i, 6, 2, 2);
      fg.push({ kind: 'arch', img: outlined(c), x: f.x * T - 5, y: f.y * T - 6, rect: { x: f.x * T, y: f.y * T - 6, w, h: 14 }, fade: true });
    }
  }
  for (const p of level.props) if (p.type === 'palm') {
    fg.push({ kind: 'palm', img: palmCrown(), x: p.x * T - 18, y: p.y * T - 44, rect: { x: p.x * T - 16, y: p.y * T - 40, w: 48, h: 34 }, fade: true });
  }
  return fg;
}
