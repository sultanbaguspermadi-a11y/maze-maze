// Layered canvas renderer (KM-014/021/025/026). Logical pixels are scaled by an INTEGER factor with
// nearest-neighbour filtering; camera is pixel-snapped; actors are depth-sorted with props.
import { buildAtlas, bakeStatic } from './tiles.js';
import { buildPropItems, buildForeground, goodsArt } from './props.js';
import { charSprite, walkFrame, PLAYER_LOOK, keySprite } from './sprites.js';
import { mk, R, PAL } from './pixel.js';

const T = 16;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.scale = 2; this.vw = 320; this.vh = 180; this.cam = { x: 0, y: 0, snap: true };
    this.t = 0; this.shake = 0; this.inset = 0; this.session = null; this.atlas = null; this.dust = [];
    for (let i = 0; i < 22; i++) this.dust.push({ x: Math.random(), y: Math.random(), s: 0.3 + Math.random() * 0.7 });
  }

  setSession(session) {
    this.session = session; const lvl = session.level;
    this.atlas ||= buildAtlas();
    this.stat = bakeStatic(lvl, this.atlas);
    this.items = buildPropItems(lvl); this.fg = buildForeground(lvl);
    this.goodsArt = new Map(lvl.interactables.filter((i) => i.kind === 'goods').map((g) => [g.id, goodsArt(g.art || 'dates')]));
    this.keyArt = keySprite();
    this.lights = (lvl.def.lights || []).map((l) => {
      const r = l.r, [c, x] = mk(r * 2, r * 2); const g = x.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, l.color + 'cc'); g.addColorStop(0.45, l.color + '44'); g.addColorStop(1, l.color + '00');
      x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return { ...l, img: c };
    });
    this.cam.snap = true;
  }

  resize(cw, ch) {
    const portrait = ch > cw * 1.1; const across = portrait ? 12 : 20;
    this.scale = Math.max(1, Math.floor(cw / (T * across)));
    this.vw = Math.ceil(cw / this.scale); this.vh = Math.ceil(ch / this.scale);
    this.canvas.width = this.vw; this.canvas.height = this.vh;
    this.canvas.style.width = this.vw * this.scale + 'px'; this.canvas.style.height = this.vh * this.scale + 'px';
    this.ctx.imageSmoothingEnabled = false;
    const [v, x] = mk(this.vw, this.vh);
    const g = x.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.35, this.vw / 2, this.vh / 2, Math.hypot(this.vw, this.vh) * 0.62);
    g.addColorStop(0, 'rgba(24,12,28,0)'); g.addColorStop(1, 'rgba(24,12,28,0.38)'); x.fillStyle = g; x.fillRect(0, 0, this.vw, this.vh);
    this.vignette = v; this.cam.snap = true;
  }

  kick(amount = 1) { this.shake = Math.max(this.shake, 0.28 * amount); }

  render(dt, opt = {}) {
    const s = this.session; if (!s) return;
    const { ctx } = this; this.t += dt; const t = this.t, reduced = !!opt.reduced;
    const p = s.player, lvl = s.level, mapW = lvl.w * T, mapH = lvl.h * T;
    const visH = this.vh - this.inset / this.scale; // keep the player in the part of the screen a bottom sheet leaves visible
    const tx = p.x - this.vw / 2, ty = p.y - 12 - visH / 2;
    const clampAx = (v, vs, ms) => (ms <= vs ? (ms - vs) / 2 : Math.max(0, Math.min(ms - vs, v)));
    const extra = this.inset / this.scale; // allow overscroll below the map so a bottom sheet never hides the player
    const gx = clampAx(tx, this.vw, mapW), gy = ty < 0 ? clampAx(ty, this.vh, mapH) : (mapH + extra <= this.vh ? clampAx(ty, this.vh, mapH) : Math.max(0, Math.min(mapH - this.vh + extra, ty)));
    if (this.cam.snap) { this.cam.x = gx; this.cam.y = gy; this.cam.snap = false; }
    else { const k = Math.min(1, dt * 9); this.cam.x += (gx - this.cam.x) * k; this.cam.y += (gy - this.cam.y) * k; }
    let sx = 0, sy = 0;
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt); if (opt.shake > 0) { const a = Math.round(2 * opt.shake); sx = Math.round((Math.random() - 0.5) * 2 * a); sy = Math.round((Math.random() - 0.5) * 2 * a); } }
    const cx = Math.round(this.cam.x) + sx, cy = Math.round(this.cam.y) + sy;

    ctx.fillStyle = '#14101c'; ctx.fillRect(0, 0, this.vw, this.vh);
    ctx.save(); ctx.translate(-cx, -cy);
    ctx.drawImage(this.stat, 0, 0);

    // ground shadows (lower-right, matching the upper-left light)
    ctx.fillStyle = PAL.shadow;
    for (const pr of lvl.props) if (pr.solid !== false && ['stall', 'oven', 'fountain', 'well', 'cart', 'crate', 'potshelf'].includes(pr.type)) ctx.fillRect(pr.x * T + 3, (pr.y + pr.h) * T - 3, pr.w * T, 5);
    for (const pr of lvl.props) if (pr.type === 'palm') ctx.fillRect(pr.x * T + 2, (pr.y + 1) * T - 4, 18, 4);

    // depth-sorted pass
    const list = [];
    const inView = (x, y, w, h) => x + w > cx && x < cx + this.vw && y + h > cy && y < cy + this.vh;
    const playerRect = { x: p.x - 9, y: p.y - 24, w: 18, h: 24 };
    for (const it of this.items) if (inView(it.x, it.y, it.img.width, it.img.height)) list.push(it);
    for (const g of lvl.interactables) if (g.kind === 'goods' && !s.taken.has(g.id)) list.push({ sort: (g.y + 1) * T + 0.5, draw: () => ctx.drawImage(this.goodsArt.get(g.id), g.x * T - 1, g.y * T - 6) });
    const key = lvl.interactables.find((i) => i.kind === 'pickup');
    if (key && s.visible(key)) list.push({ sort: (key.y + 1) * T, draw: () => { ctx.drawImage(this.keyArt, key.x * T + 3, key.y * T + 6 + (reduced ? 0 : Math.round(Math.sin(t * 3))));
      if (!reduced && Math.sin(t * 5) > 0.6) { R(ctx, '#fff3c0', key.x * T + 12, key.y * T + 4, 1, 1); R(ctx, '#fff3c0', key.x * T + 3, key.y * T + 3, 1, 1); } } });
    for (const g of lvl.gates) list.push({ sort: (g.y + 1) * T - 6, draw: () => this.drawCurtain(g, s.gateOpen(g.id), t, reduced) });
    const fountain = lvl.props.find((q) => q.type === 'fountain');
    if (fountain) list.push({ sort: (fountain.y + fountain.h) * T + 0.2, draw: () => this.drawFountainFX(fountain, t, reduced) });
    const shadow = (x, y) => { ctx.fillStyle = 'rgba(40,24,30,0.34)'; ctx.fillRect(Math.round(x) - 5, Math.round(y) - 1, 10, 2); ctx.fillRect(Math.round(x) - 4, Math.round(y) - 2, 8, 1); ctx.fillRect(Math.round(x) - 4, Math.round(y) + 1, 8, 1); };
    for (const n of lvl.npcs) {
      const fx = (n.x + 0.5) * T, fy = (n.y + 1) * T - 2;
      const dx = p.x - fx, dy = p.y - fy; const dir = Math.hypot(dx, dy) < 52 ? (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')) : 'down';
      const bob = reduced ? 0 : (Math.sin(t * 2 + n.x) > 0.95 ? 1 : 0);
      list.push({ sort: fy, draw: () => { shadow(fx, fy); ctx.drawImage(charSprite(n.look, dir, 0), Math.round(fx) - 9, fy - 24 - bob); } });
    }
    for (const w of s.wanderers) list.push({ sort: w.y, draw: () => { shadow(w.x, w.y); ctx.drawImage(charSprite(w.look, w.dir, walkFrame(w.anim, true)), Math.round(w.x) - 9, Math.round(w.y) - 24); } });
    list.push({ sort: p.y, draw: () => { shadow(p.x, p.y); ctx.drawImage(charSprite(PLAYER_LOOK, p.dir, walkFrame(p.anim, p.moving)), Math.round(p.x) - 9, Math.round(p.y) - 24); } });
    list.sort((a, b) => a.sort - b.sort);
    for (const it of list) {
      if (it.draw) { it.draw(); continue; }
      const fade = it.fade && p.y < it.sort && playerRect.x < it.x + it.img.width && playerRect.x + 18 > it.x && playerRect.y < it.y + it.img.height && playerRect.y + 24 > it.y;
      if (fade) ctx.globalAlpha = 0.6; ctx.drawImage(it.img, it.x, it.y); if (fade) ctx.globalAlpha = 1;
    }

    // objective markers + interaction brackets
    if (opt.help !== 'low') for (const m of s.markers()) {
      const by = m.y - 30 + (reduced ? 0 : Math.round(Math.sin(t * 4) * 2));
      R(ctx, PAL.ink, m.x - 4, by - 1, 9, 9); R(ctx, '#ffd36a', m.x - 3, by, 7, 7); R(ctx, PAL.ink, m.x - 1, by + 2, 3, 3); R(ctx, '#ffd36a', m.x, by + 3, 1, 1);
      R(ctx, PAL.ink, m.x - 1, by + 8, 3, 2); R(ctx, '#ffd36a', m.x, by + 8, 1, 1);
    }
    if (s.target && s.mode === 'play') this.drawBrackets(s.target, s, t, reduced);

    // foreground occluders
    for (const f of this.fg) {
      if (!inView(f.x, f.y, f.img.width, f.img.height)) continue;
      const over = f.rect && playerRect.x < f.rect.x + f.rect.w && playerRect.x + 18 > f.rect.x && playerRect.y < f.rect.y + f.rect.h && playerRect.y + 24 > f.rect.y;
      if (f.fade && over) ctx.globalAlpha = 0.5;
      if (f.kind === 'awning' && !reduced) {
        const off = Math.round(Math.sin(t * 1.6 + f.sway * 1.7) * 0.9);
        ctx.drawImage(f.img, 0, 0, f.img.width, 12, f.x, f.y, f.img.width, 12); ctx.drawImage(f.img, 0, 12, f.img.width, f.img.height - 12, f.x + off, f.y + 12, f.img.width, f.img.height - 12);
      } else ctx.drawImage(f.img, f.x, f.y);
      ctx.globalAlpha = 1;
    }

    // light pools (additive, restrained) + warm morning tint
    ctx.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      if (!inView(l.x * T - l.r, l.y * T - l.r, l.r * 2, l.r * 2)) continue;
      ctx.globalAlpha = 0.34 * (l.flicker && !reduced ? 0.85 + 0.15 * Math.sin(t * 13 + Math.sin(t * 3.1) * 2) : 1);
      ctx.drawImage(l.img, Math.round(l.x * T - l.r), Math.round(l.y * T - l.r));
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    ctx.fillStyle = 'rgba(255,198,120,0.07)'; ctx.fillRect(0, 0, this.vw, this.vh);
    if (!reduced) {
      ctx.fillStyle = 'rgba(255,238,200,0.55)';
      for (const d of this.dust) { const x = ((d.x * this.vw + t * 4 * d.s) % this.vw), y = ((d.y * this.vh - t * 2.5 * d.s + Math.sin(t * d.s + d.x * 9) * 3) % this.vh + this.vh) % this.vh; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    }
    ctx.drawImage(this.vignette, 0, 0);
  }

  drawBrackets(src, s, t, reduced) {
    const ctx = this.ctx, T0 = T;
    let x, y, w, h;
    if (src.kind === 'npc') { x = src.x * T0; y = src.y * T0 - 8; w = T0; h = T0 + 8; }
    else { x = src.x * T0; y = src.y * T0; w = (src.w || 1) * T0; h = (src.h || 1) * T0; }
    if (src.anchor && src.kind !== 'npc') { x = src.anchor.x * T0 - 4; y = src.anchor.y * T0 - 4; w = T0 + 8; h = T0 + 8; }
    const pad = reduced ? 1 : 1 + Math.round(Math.abs(Math.sin(t * 5)));
    x -= pad; y -= pad; w += pad * 2; h += pad * 2; const L = 4;
    for (const [col, o] of [[PAL.ink, 1], ['#ffffff', 0]]) {
      ctx.fillStyle = col;
      for (const [ax, ay, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
        ctx.fillRect(dx > 0 ? ax - o : ax - L - o, ay - (dy > 0 ? o : 0) - (dy < 0 ? 0 : 0), L + o * 2, 1 + o * 2 - 0);
        ctx.fillRect(ax - (dx > 0 ? o : 0) - (dx < 0 ? 0 : 0), dy > 0 ? ay - o : ay - L - o, 1 + o * 2, L + o * 2);
      }
    }
  }

  drawCurtain(g, open, t, reduced) {
    const ctx = this.ctx, x = g.x * T, y = g.y * T, w = g.w * T;
    const sway = reduced ? 0 : Math.sin(t * 1.4);
    const fold = (px, pw, hemOff) => {
      R(ctx, PAL.ink, px - 1, y - 1, pw + 2, T + 2);
      for (let i = 0; i < pw; i++) R(ctx, i % 4 < 2 ? '#2d3f8f' : '#3d56b8', px + i, y, 1, T - 1 + (i % 4 === 0 ? hemOff : 0));
      R(ctx, '#e8a33d', px, y, pw, 2); R(ctx, '#17214f', px, y + T - 2, pw, 1);
    };
    if (!open) fold(x, w, Math.round(sway));
    else { fold(x, 5, 0); fold(x + w - 5, 5, 0); R(ctx, 'rgba(255,217,138,0.18)', x + 5, y, w - 10, T); }
  }

  drawFountainFX(f, t, reduced) {
    const ctx = this.ctx, cx = (f.x + f.w / 2) * T, top = f.y * T - 10 + 7;
    for (let i = 0; i < 7; i++) {
      const ph = reduced ? i / 7 : ((t * 1.1 + i / 7) % 1), a = (i - 3) * 0.9;
      const dx = a * ph * 9, dy = -ph * (1 - ph) * 36 + ph * 6;
      R(ctx, '#bff3f0', Math.round(cx + dx) - 0, Math.round(top + 8 + dy), 1, 1);
      if (ph > 0.75) R(ctx, 'rgba(191,243,240,0.5)', Math.round(cx + dx * 1.2), Math.round(top + 36), 2, 1);
    }
    for (let i = 0; i < 6; i++) { const k = reduced ? i : Math.floor(t * 2 + i * 1.7); const ox = ((k * 37 + i * 11) % 36) - 18, oy = ((k * 17 + i * 5) % 8) - 3; R(ctx, '#d8fffb', Math.round(cx + ox), Math.round(top + 42 + oy), 1, 1); }
  }

  // Journal map: static layer scaled to fit, with fog over areas not yet seen.
  drawMap(canvas, s, help) {
    const lvl = s.level, W = canvas.width, H = canvas.height, c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false; c.fillStyle = '#14101c'; c.fillRect(0, 0, W, H);
    const k = Math.min(W / (lvl.w * T), H / (lvl.h * T)); const ox = (W - lvl.w * T * k) / 2, oy = (H - lvl.h * T * k) / 2;
    for (const a of lvl.areas) {
      if (!s.areas.has(a.id)) continue; const r = a.rect;
      c.drawImage(this.stat, r.x * T, r.y * T, r.w * T, r.h * T, ox + r.x * T * k, oy + r.y * T * k, r.w * T * k, r.h * T * k);
    }
    c.strokeStyle = '#e8a33d'; c.lineWidth = 1;
    for (const a of lvl.areas) { const r = a.rect; if (s.areas.has(a.id)) c.strokeRect(Math.round(ox + r.x * T * k) + 0.5, Math.round(oy + r.y * T * k) + 0.5, Math.round(r.w * T * k), Math.round(r.h * T * k)); }
    const dot = (x, y, shape, col) => { const px = ox + x * k, py = oy + y * k; c.fillStyle = '#14101c'; c.beginPath();
      if (shape === 'tri') { c.moveTo(px, py - 6); c.lineTo(px + 5, py + 4); c.lineTo(px - 5, py + 4); } else if (shape === 'dia') { c.moveTo(px, py - 6); c.lineTo(px + 5, py); c.lineTo(px, py + 6); c.lineTo(px - 5, py); } else c.rect(px - 4, py - 4, 8, 8);
      c.closePath(); c.fill(); c.fillStyle = col; c.beginPath();
      if (shape === 'tri') { c.moveTo(px, py - 4); c.lineTo(px + 3, py + 2); c.lineTo(px - 3, py + 2); } else if (shape === 'dia') { c.moveTo(px, py - 4); c.lineTo(px + 3, py); c.lineTo(px, py + 4); c.lineTo(px - 3, py); } else c.rect(px - 2, py - 2, 4, 4);
      c.closePath(); c.fill(); };
    if (help !== 'low') for (const m of s.markers()) dot(m.x, m.y, 'dia', '#ffd36a');
    dot(s.player.x, s.player.y - 4, 'tri', '#ffffff');
  }
}
