// Title backdrop: dawn skyline with domes, minarets and hanging lanterns, drawn at low resolution then scaled (KM-091).
import { mk, R } from './pixel.js';

export class TitleScene {
  constructor(canvas) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.t = 0; this.raf = 0; this.reduced = false; }
  start(reduced) { this.reduced = reduced; this.resize(); this.loop = this.loop.bind(this); cancelAnimationFrame(this.raf); this.last = performance.now(); this.raf = requestAnimationFrame(this.loop); this.onR = () => this.resize(); addEventListener('resize', this.onR); }
  stop() { cancelAnimationFrame(this.raf); removeEventListener('resize', this.onR); }
  resize() { const w = this.c.clientWidth || 640, h = this.c.clientHeight || 360, s = Math.max(2, Math.round(Math.min(w / 200, h / 112))); this.c.width = Math.ceil(w / s); this.c.height = Math.ceil(h / s); this.draw(); }
  loop(ts) { this.t += Math.min(0.05, (ts - this.last) / 1000); this.last = ts; if (!this.reduced) this.draw(); this.raf = requestAnimationFrame(this.loop); }
  draw() {
    const x = this.ctx, W = this.c.width, H = this.c.height; x.imageSmoothingEnabled = false;
    const bands = ['#241c46', '#2f2458', '#4a2a68', '#74355f', '#b5535a', '#e08a4a', '#f2b45a'];
    const bh = Math.ceil(H * 0.78 / bands.length); bands.forEach((b, i) => R(x, b, 0, i * bh, W, bh + 1));
    R(x, '#f2b45a', 0, H * 0.78 - 1, W, H);
    for (let i = 0; i < 40; i++) { const sx = (i * 53) % W, sy = (i * 29) % (H * 0.35); if ((i + Math.floor(this.t * 2)) % 5) R(x, '#f6efdc', sx, sy, 1, 1); }
    const sunY = H * 0.62; x.fillStyle = '#ffe9b0'; x.beginPath(); x.arc(W * 0.72, sunY, Math.max(8, H * 0.09), 0, 7); x.fill();
    const sky = (col, base, f) => { x.fillStyle = col; for (let i = 0; i < W; i++) { const h = base + Math.sin(i * f) * 6 + Math.sin(i * f * 2.3) * 4; x.fillRect(i, H - h, 1, h); } };
    sky('#5a2f5e', H * 0.34, 0.05);
    const dome = (cx, w, h, col) => { x.fillStyle = col; x.fillRect(cx - w / 2, H - h, w, h); x.beginPath(); x.arc(cx, H - h, w / 2, Math.PI, 0); x.fill(); R(x, col, cx - 1, H - h - w / 2 - 5, 2, 5); };
    const minaret = (cx, h, col) => { R(x, col, cx - 3, H - h, 6, h); R(x, col, cx - 5, H - h + 8, 10, 3); x.fillStyle = col; x.beginPath(); x.moveTo(cx - 4, H - h); x.lineTo(cx, H - h - 12); x.lineTo(cx + 4, H - h); x.fill(); };
    sky('#3a2150', H * 0.24, 0.09); dome(W * 0.2, 34, H * 0.3, '#3a2150'); dome(W * 0.5, 44, H * 0.36, '#2d1a42'); minaret(W * 0.33, H * 0.5, '#2d1a42'); minaret(W * 0.83, H * 0.46, '#2d1a42'); dome(W * 0.7, 26, H * 0.28, '#3a2150');
    sky('#1d1230', H * 0.12, 0.13);
    for (let i = 0; i < 9; i++) { const lx = (i + 0.5) * (W / 9), ly = 8 + Math.sin(i * 1.7) * 3 + (this.reduced ? 0 : Math.sin(this.t * 1.5 + i) * 1); R(x, '#14101c', lx, 0, 1, ly); R(x, '#14101c', lx - 3, ly, 7, 8); R(x, ['#e8a33d', '#2fa59d', '#c4415b'][i % 3], lx - 2, ly + 1, 5, 6); R(x, '#fff3c0', lx, ly + 3, 1, 2); }
    void mk;
  }
}
