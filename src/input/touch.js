// On-screen controls (KM-093): analog joystick or D-pad, left-handed layout, size/opacity, safe areas.
import { clamp } from '../core/util.js';

export class TouchControls {
  constructor(root, input) {
    this.root = root; this.input = input; this.ptr = null; this.dirs = new Map();
    root.innerHTML = '';
    const el = (tag, cls, attrs = {}) => { const e = document.createElement(tag); e.className = cls; Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
    this.moveZone = el('div', 'tc-move'); this.base = el('div', 'tc-base', { 'aria-hidden': 'true' }); this.knob = el('div', 'tc-knob');
    this.base.append(this.knob); this.dpad = el('div', 'tc-dpad', { role: 'group', 'aria-label': 'Arah gerak' });
    for (const [d, label, glyph] of [['up', 'Atas', '▲'], ['left', 'Kiri', '◀'], ['right', 'Kanan', '▶'], ['down', 'Bawah', '▼']]) {
      const b = el('button', `tc-d tc-${d}`, { type: 'button', 'aria-label': label }); b.textContent = glyph;
      const on = (e) => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); input.pad.add(d); b.classList.add('on'); };
      const off = () => { input.pad.delete(d); b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
      this.dpad.append(b);
    }
    this.moveZone.append(this.base, this.dpad);
    this.actions = el('div', 'tc-actions');
    this.btnA = el('button', 'tc-a', { type: 'button', 'aria-label': 'Interaksi' }); this.btnA.textContent = 'Aksi';
    this.btnJ = el('button', 'tc-j', { type: 'button', 'aria-label': 'Jurnal' }); this.btnJ.textContent = 'Jurnal';
    this.actions.append(this.btnA, this.btnJ);
    root.append(this.moveZone, this.actions);
    this.btnA.addEventListener('pointerdown', (e) => { e.preventDefault(); input.fire('interact'); });
    this.btnJ.addEventListener('pointerdown', (e) => { e.preventDefault(); input.fire('journal'); });

    const z = this.base;
    const move = (e) => {
      if (this.ptr !== e.pointerId) return;
      const r = z.getBoundingClientRect(), R = r.width / 2; const cx = r.left + R, cy = r.top + R;
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), max = R * 0.9;
      if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.min(1, Math.hypot(dx, dy) / max), dead = 0.15;
      const mag = m < dead ? 0 : (m - dead) / (1 - dead);
      input.stick.x = m ? (dx / Math.hypot(dx, dy)) * mag : 0; input.stick.y = m ? (dy / Math.hypot(dx, dy)) * mag : 0;
    };
    const end = (e) => { if (this.ptr !== e.pointerId) return; this.ptr = null; input.stick.x = input.stick.y = 0; this.knob.style.transform = ''; };
    z.addEventListener('pointerdown', (e) => { e.preventDefault(); this.ptr = e.pointerId; z.setPointerCapture?.(e.pointerId); move(e); });
    z.addEventListener('pointermove', move); z.addEventListener('pointerup', end); z.addEventListener('pointercancel', end); z.addEventListener('lostpointercapture', end);
    for (const n of [this.moveZone, this.actions]) n.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  apply(settings) {
    const coarse = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    const show = settings.control !== 'auto' || coarse;
    const mode = settings.control === 'dpad' ? 'dpad' : 'joystick';
    this.root.hidden = !show; this.root.dataset.mode = mode; this.root.dataset.hand = settings.leftHanded ? 'left' : 'right';
    this.root.style.setProperty('--pad-size', clamp(settings.padSize, 0.8, 1.4)); this.root.style.setProperty('--pad-opacity', clamp(settings.padOpacity, 0.3, 1));
    if (!show) { this.input.stick.x = this.input.stick.y = 0; this.input.pad.clear(); }
  }
  setTarget(on) { this.btnA.classList.toggle('ready', !!on); }
}
