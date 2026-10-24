// Input abstraction (KM-012): gameplay reads only { vec(), actions }. Keyboard, joystick and D-pad all feed it.
// Remapping is done through settings.keyInteract / keyJournal; a gamepad source could be added without touching gameplay.
const MOVE = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };

export class Input {
  constructor(getSettings) {
    this.getSettings = getSettings; this.keys = new Set(); this.pad = new Set(); this.stick = { x: 0, y: 0 };
    this.enabled = true; this.handlers = {};
    addEventListener('keydown', (e) => this.onKey(e, true));
    addEventListener('keyup', (e) => this.onKey(e, false));
    addEventListener('blur', () => this.reset());
  }
  on(action, fn) { this.handlers[action] = fn; }
  reset() { this.keys.clear(); this.pad.clear(); this.stick.x = this.stick.y = 0; }
  fire(a) { this.handlers[a]?.(); } // handlers guard on live UI/session state, so a key right after a modal closes is not lost
  onKey(e, down) {
    if (e.target?.closest?.('input, select, textarea')) return;
    const s = this.getSettings(); const c = e.code;
    if (MOVE[c]) { down ? this.keys.add(MOVE[c]) : this.keys.delete(MOVE[c]); if (this.enabled && down) e.preventDefault(); return; }
    if (!down || e.repeat) return;
    if (c === s.keyInteract || c === 'Enter') { this.fire('interact'); if (this.enabled) e.preventDefault(); }
    else if (c === 'Escape' || c === 'KeyP') this.fire('pause');
    else if (c === s.keyJournal) { this.fire('journal'); if (this.enabled && c === 'Tab') e.preventDefault(); }
    else if (c === 'KeyL') this.fire('lexicon');
    else if (c === 'KeyM') this.fire('map');
  }
  vec() {
    if (!this.enabled) return { x: 0, y: 0 };
    if (Math.hypot(this.stick.x, this.stick.y) > 0.05) return { ...this.stick };
    const has = (d) => this.keys.has(d) || this.pad.has(d);
    return { x: (has('right') ? 1 : 0) - (has('left') ? 1 : 0), y: (has('down') ? 1 : 0) - (has('up') ? 1 : 0) };
  }
}
