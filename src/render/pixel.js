// Pixel-art drawing helpers (browser only). All art is generated in code: original, license-free (ASSET_REGISTER.md).
import { mulberry32, hashString } from '../core/util.js';

export const PAL = {
  ink: '#1d1620', shadow: 'rgba(40,24,30,0.32)',
  cobble: ['#a58f6e', '#9a8466', '#af9a78', '#a08b6c'], cobbleJoint: '#7d6a50', cobbleHi: '#c0aa86',
  plaza: ['#b9a27c', '#b09873', '#bfa982', '#b39b76'], plazaJoint: '#8c7858',
  sand: ['#c9a86a', '#c2a064', '#cfae72'], sandDark: '#b08e52',
  court: ['#cbbd9f', '#c3b496', '#d2c5a8'], courtBlue: '#3a5a98', courtJoint: '#a29678',
  wood: ['#8a5a35', '#7f5130', '#935f39'], woodDark: '#5b3a24', woodHi: '#a8744a',
  kstone: ['#4d4760', '#554f69', '#48425a'], kJoint: '#2f2a3c',
  plasterA: '#c8955c', plasterB: '#b9825a', plasterC: '#d1b078', plasterShade: '#8d5f3e', plasterHi: '#e0b27c',
  roof: '#9a7a5a', roofEdge: '#6e5238', roofDeep: '#352b2a', roofHi: '#b39573',
  turquoise: '#2fa59d', turquoiseDk: '#1f6f72', saffron: '#e8a33d', wine: '#8f3550', lapis: '#2c3f86',
  cloth: { dates: ['#d49a3a', '#f3e6c4'], bread: ['#b8423a', '#f3e6c4'], water: ['#2f7aa6', '#e8f1f4'], pots: ['#c4733a', '#f3e6c4'], spice: ['#8a3f6a', '#e8d2a4'], fabric: ['#3a8f7a', '#f0e0b0'] },
};

export function mk(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x];
}
export const R = (x, col, px, py, w, h) => { x.fillStyle = col; x.fillRect(px, py, w, h); };

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('');
}

// 1px dark outline around opaque pixels. Returns a canvas 2px larger in each dimension.
export function outlined(src, col = PAL.ink) {
  const w = src.width, h = src.height; const [c, x] = mk(w + 2, h + 2);
  x.drawImage(src, 1, 1);
  const img = x.getImageData(0, 0, w + 2, h + 2), d = img.data, out = new Uint8ClampedArray(d);
  const n = parseInt(col.slice(1), 16), cr = (n >> 16) & 255, cg = (n >> 8) & 255, cb = n & 255;
  const W = w + 2, A = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < h + 2 && d[(yy * W + xx) * 4 + 3] > 10;
  for (let yy = 0; yy < h + 2; yy++) for (let xx = 0; xx < W; xx++) {
    if (A(xx, yy)) continue;
    if (A(xx - 1, yy) || A(xx + 1, yy) || A(xx, yy - 1) || A(xx, yy + 1)) {
      const i = (yy * W + xx) * 4; out[i] = cr; out[i + 1] = cg; out[i + 2] = cb; out[i + 3] = 255;
    }
  }
  x.putImageData(new ImageData(out, W, h + 2), 0, 0);
  return c;
}

export const rngAt = (a, b, salt = 0) => mulberry32(hashString(`${a},${b},${salt}`));
