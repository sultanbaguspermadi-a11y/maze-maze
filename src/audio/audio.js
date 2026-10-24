// State-aware procedural audio (KM-090/091). Everything is synthesised at runtime: original, no audio files, no licences.
// Nothing is created until a user gesture calls unlock() (browser autoplay policy). Volumes: master / music / sfx + mute.
const HIJAZ = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66]; // D E♭ F♯ G A B♭ C D

export class AudioManager {
  constructor() { this.ctx = null; this.s = { master: 0.8, music: 0.5, sfx: 0.8, mute: false }; this.mode = 'menu'; this.timer = null; this.step = 0; this.ok = false; }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      this.ctx = new AC(); const c = this.ctx;
      this.master = c.createGain(); this.musicBus = c.createGain(); this.sfxBus = c.createGain(); this.ambBus = c.createGain();
      this.musicBus.connect(this.master); this.sfxBus.connect(this.master); this.ambBus.connect(this.master); this.master.connect(c.destination);
      this.startAmbience(); this.apply(this.s); this.setMode(this.mode); this.ok = true;
    } catch { this.ctx = null; }
  }

  apply(s) {
    this.s = { ...this.s, ...s }; if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.s.mute ? 0 : this.s.master, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.s.sfx, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.s.music * (this.mode === 'modal' ? 0.45 : 1) * (this.mode === 'menu' ? 0.8 : 1), t, 0.2);
    this.ambBus.gain.setTargetAtTime(this.s.music * 0.5 * (this.mode === 'play' || this.mode === 'modal' ? 1 : 0.25), t, 0.3);
  }

  setMode(mode) {
    this.mode = mode; if (!this.ctx) return; this.apply({});
    if (!this.timer) this.timer = setInterval(() => this.tick(), 340);
  }
  suspend() { this.ctx?.suspend?.(); } resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  startAmbience() {
    const c = this.ctx, len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0.05; const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.18; lg.gain.value = 0.025; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    src.connect(bp); bp.connect(g); g.connect(this.ambBus); src.start();
  }

  note(freq, when, dur, gain, type = 'triangle', bus = this.musicBus) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = 1800;
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(gain, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(f); f.connect(g); g.connect(bus); o.start(when); o.stop(when + dur + 0.05);
  }

  tick() {
    if (!this.ctx || this.ctx.state !== 'running' || this.mode === 'silent') return;
    const c = this.ctx, t = c.currentTime + 0.05, i = this.step++;
    const calm = this.mode === 'menu' || this.mode === 'modal';
    if (i % 8 === 0) { this.note(73.42, t, 2.6, 0.05, 'sine'); this.note(110, t, 2.6, 0.03, 'sine'); } // drone D + A
    const walk = [0, 2, 3, 4, 3, 2, 1, 0, 2, 4, 5, 4, 3, 2, 3, 0];
    if (i % 2 === 0 || (!calm && i % 4 === 1)) { const idx = walk[(i >> 1) % walk.length] + (i % 32 >= 16 ? 1 : 0); this.note(HIJAZ[idx % 8] * (idx > 7 ? 2 : 1), t, 0.7, calm ? 0.05 : 0.07); }
    if (!calm && i % 4 === 0) this.note(73.42 * (i % 16 === 8 ? 1.5 : 1), t, 0.25, 0.06, 'sine'); // soft frame-drum pulse
  }

  play(name) {
    if (!this.ctx || this.ctx.state !== 'running' || this.s.mute) return;
    const c = this.ctx, t = c.currentTime, B = this.sfxBus;
    const seq = (notes, gap, dur, g = 0.12, type = 'triangle') => notes.forEach((f, i) => this.note(f, t + i * gap, dur, g, type, B));
    switch (name) {
      case 'pickup': seq([660, 990], 0.07, 0.14); break;
      case 'coin': seq([1320, 1760], 0.05, 0.12, 0.08, 'square'); break;
      case 'discover': seq([880, 1320, 1760], 0.06, 0.25, 0.07, 'sine'); break;
      case 'objective': seq([523, 659, 784], 0.1, 0.22, 0.12); break;
      case 'right': seq([523, 784], 0.09, 0.2, 0.12); break;
      case 'wrong': seq([196, 147], 0.12, 0.28, 0.1, 'sawtooth'); break;
      case 'deliver': seq([392, 523, 659, 784], 0.08, 0.2, 0.12); break;
      case 'victory': seq([392, 523, 659, 784, 1046], 0.14, 0.5, 0.12); break;
      case 'blocked': seq([220], 0, 0.06, 0.06, 'square'); break;
      case 'click': seq([740], 0, 0.05, 0.05, 'square'); break;
      default: break;
    }
  }
}
