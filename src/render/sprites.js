// Characters: procedural 16×24 sprites in 4 facings × 4 walk frames (KM-024). Right = mirrored left.
import { mk, R, shade, outlined, PAL } from './pixel.js';

const cache = new Map();

function draw(look, dir, f) {
  const [c, x] = mk(16, 24);
  const skin = look.skin, top = look.top, trim = look.trim || top, hair = look.hair || '#2a1d18';
  const pants = look.pants || shade(top, -48), step = f === 1 ? 1 : f === 3 ? -1 : 0;
  const side = dir === 'left';
  // legs
  const legY = 18;
  if (side) { R(x, pants, 6, legY, 4, 5 - (step > 0 ? 1 : 0)); R(x, shade(pants, -16), 6 + step, legY, 4, 5); R(x, '#2a1d18', 5 + (step > 0 ? 1 : 0), 22, 5, 2); }
  else { R(x, pants, 5, legY, 3, step > 0 ? 4 : 5); R(x, pants, 8, legY, 3, step < 0 ? 4 : 5); R(x, '#2a1d18', 5, step > 0 ? 22 : 23, 3, 1); R(x, '#2a1d18', 8, step < 0 ? 22 : 23, 3, 1); }
  // robe / tunic
  const bx = side ? 5 : 4, bw = side ? 6 : 8;
  R(x, top, bx, 10, bw, 9); R(x, shade(top, 24), bx, 10, 1, 9); R(x, shade(top, -26), bx + bw - 1, 10, 1, 9);
  R(x, trim, bx, 14, bw, 1); R(x, shade(top, -34), bx, 18, bw, 1);
  if (look.long) { R(x, top, bx, 19, bw, 2); R(x, shade(top, -34), bx, 20, bw, 1); }
  if (look.apron) { R(x, look.apron, bx + 1, 13, bw - 2, 6); R(x, shade(look.apron, -22), bx + 1, 18, bw - 2, 1); }
  // arms
  const sw = step;
  if (side) { R(x, shade(top, -12), 7, 11 + (sw > 0 ? 1 : 0), 2, 4); R(x, skin, 7, 15 + (sw > 0 ? 1 : 0), 2, 1); }
  else { R(x, shade(top, -10), 2, 11 + (sw > 0 ? 1 : 0), 2, 4); R(x, skin, 2, 15 + (sw > 0 ? 1 : 0), 2, 1); R(x, shade(top, -10), 12, 11 + (sw < 0 ? 1 : 0), 2, 4); R(x, skin, 12, 15 + (sw < 0 ? 1 : 0), 2, 1); }
  // head
  const hx = side ? 5 : 4, hw = side ? 7 : 8;
  R(x, skin, hx, 4, hw, 7); R(x, shade(skin, 18), hx, 4, 1, 6); R(x, shade(skin, -26), hx, 10, hw, 1);
  if (dir === 'up') R(x, hair, hx, 3, hw, 8);
  else {
    R(x, hair, hx, 3, hw, 2); if (side) R(x, hair, hx + 3, 4, 4, 4);
    if (dir === 'down') { R(x, PAL.ink, 6, 7, 1, 2); R(x, PAL.ink, 9, 7, 1, 2); R(x, shade(skin, -20), 7, 9, 2, 1); }
    else { R(x, PAL.ink, 6, 7, 1, 2); R(x, shade(skin, -20), 5, 9, 2, 1); }
  }
  if (look.cap) { R(x, look.cap, hx, 1, hw, 4); R(x, shade(look.cap, 26), hx, 1, hw, 1); R(x, shade(look.cap, -30), hx, 4, hw, 1); if (look.tassel) R(x, look.tassel, hx + hw - 1, 3, 1, 5); }
  if (look.scarf) { R(x, look.scarf, hx - 1, 2, hw + 2, 3); R(x, look.scarf, hx - 1, 4, 2, 7); R(x, look.scarf, hx + hw - 1, 4, 2, 7); R(x, shade(look.scarf, 30), hx, 2, hw, 1); if (dir === 'up') R(x, look.scarf, hx, 3, hw, 8); }
  if (look.trimHead) R(x, look.trimHead, hx, 4, hw, 1);
  const o = outlined(c);
  if (dir !== 'right') return o;
  const [fc, fx] = mk(o.width, o.height); fx.translate(o.width, 0); fx.scale(-1, 1); fx.drawImage(o, 0, 0); return fc;
}

export function charSprite(look, dir, frame) {
  const key = JSON.stringify(look) + dir + frame;
  let s = cache.get(key);
  if (!s) { s = draw(look, dir === 'right' ? 'left' : dir, frame); if (dir === 'right') s = flip(s); cache.set(key, s); }
  return s;
}
function flip(o) { const [fc, fx] = mk(o.width, o.height); fx.translate(o.width, 0); fx.scale(-1, 1); fx.drawImage(o, 0, 0); return fc; }

export const PLAYER_LOOK = { skin: '#c98f5f', top: '#3b4a8a', trim: '#e8a33d', hair: '#2a1d18', cap: '#a8322f', tassel: '#e8a33d', long: false };
export const walkFrame = (anim, moving) => (moving ? [0, 1, 2, 3][Math.floor(anim * 8) % 4] : 0);

export function keySprite() {
  const [c, x] = mk(10, 8);
  R(x, '#e8a33d', 0, 1, 4, 4); R(x, '#8a5a1c', 1, 2, 2, 2); R(x, '#e8a33d', 4, 2, 5, 1); R(x, '#e8a33d', 7, 3, 1, 2); R(x, '#e8a33d', 5, 3, 1, 1);
  return outlined(c);
}
