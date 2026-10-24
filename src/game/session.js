// GameSession: all gameplay rules for one stage, DOM-free (KM-013, 033, 036, 040–044, 052, 056).
// The UI is injected, so the identical code is driven by the browser UI and by headless tests.
import { compileStage, makeCollider, anchorOf, INTERACT_REACH, tileCenter } from '../world/level.js';
import { QuestEngine, evalAll } from '../quests/engine.js';
import { pickEntry, visibleChoices } from '../quests/dialogue.js';
import { evaluate, makeVocabChallenge } from '../learning/challenges.js';
import { discover, recordAnswer, pickReview, stateOf } from '../learning/progress.js';
import { dayNumber, clone } from '../core/util.js';
import { defaultProgress } from '../persistence/save.js';

export const WALK_SPEED = 58; // px/s at full analog deflection

export class GameSession {
  constructor({ stageDef, content, save, ui, persist = () => {}, day = dayNumber() }) {
    this.def = stageDef; this.content = content; this.ui = ui; this.persist = persist; this.day = day;
    this.level = compileStage(stageDef);
    this.save = save;
    const p = save.progress.stage === stageDef.id ? save.progress : defaultProgress();
    this.quests = new QuestEngine(content.QUESTS.filter((q) => q.stage === stageDef.id), p.quests);
    this.inv = { ...p.inv }; this.purse = p.purse;
    this.taken = new Set(p.taken); this.clues = [...p.clues]; this.inspected = new Set(p.inspected);
    this.areas = new Set(p.areas); this.stats = { ...p.stats }; this.practiced = { ...(p.practiced || {}) };
    this.lexicon = save.lexicon;
    this.collider = makeCollider(this.level, (gid) => this.gateOpen(gid));
    const s = tileCenter(this.level.T, this.level.spawn.x, this.level.spawn.y);
    this.player = { x: s.x, y: s.y + 6, dir: 'down', moving: false, anim: 0 };
    if (p.pos && this.collider.standable(p.pos.x, p.pos.y)) { this.player.x = p.pos.x; this.player.y = p.pos.y; }
    this.mode = 'play'; this.target = null; this.done = this.quests.status('q.order') === 'complete';
    this.wanderers = this.level.wanderers.map((w) => ({ id: w.id, look: w.look, speed: w.speed, path: w.path, seg: 0,
      x: (w.path[0][0] + 0.5) * this.level.T, y: (w.path[0][1] + 1) * this.level.T - 2, dir: 'right', anim: 0 }));
    this.events = []; // lightweight log for UI feedback / tests
    this.lexById = new Map(content.LEXICON.map((e) => [e.id, e]));
    this.fired = new Set();
    this.noteArea();
  }

  // ---------- state helpers ----------
  gateOpen(gid) {
    const g = this.level.gates.find((x) => x.id === gid);
    return !!g?.opensWhen && this.quests.hasFlag(g.opensWhen.flag);
  }
  has(item, n = 1) { return (this.inv[item] || 0) >= n; }
  addItem(item, n = 1) { this.inv[item] = (this.inv[item] || 0) + n; }
  removeItem(item) { delete this.inv[item]; }
  log(kind, data = {}) { this.events.push({ kind, ...data }); if (this.events.length > 200) this.events.shift(); }

  visible(src) { return evalAll(src.visibleWhen, this.quests, this.inv) && !(this.taken.has(src.id) && (src.kind === 'pickup' || src.kind === 'goods')); }

  // ---------- movement / targeting ----------
  update(dt, move = { x: 0, y: 0 }) {
    if (this.mode !== 'play') { this.player.moving = false; return; }
    this.stats.seconds += dt;
    const mag = Math.min(1, Math.hypot(move.x, move.y));
    if (mag > 0.08) {
      const nx = move.x / Math.hypot(move.x, move.y), ny = move.y / Math.hypot(move.x, move.y);
      const before = { x: this.player.x, y: this.player.y };
      const pos = this.collider.move(this.player, nx * WALK_SPEED * mag * dt, ny * WALK_SPEED * mag * dt);
      this.player.x = pos.x; this.player.y = pos.y;
      this.player.dir = Math.abs(nx) > Math.abs(ny) ? (nx > 0 ? 'right' : 'left') : (ny > 0 ? 'down' : 'up');
      this.player.moving = Math.hypot(pos.x - before.x, pos.y - before.y) > 0.01;
      if (this.player.moving) { this.player.anim += dt; this.stats.steps += Math.hypot(pos.x - before.x, pos.y - before.y) / 16; }
    } else this.player.moving = false;
    for (const w of this.wanderers) this.stepWanderer(w, dt);
    this.noteArea(); this.checkTriggers();
    this.target = this.pickTarget();
  }

  stepWanderer(w, dt) {
    const T = this.level.T, to = w.path[(w.seg + 1) % w.path.length];
    const tx = (to[0] + 0.5) * T, ty = (to[1] + 1) * T - 2;
    const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy);
    if (d < 1) { w.seg = (w.seg + 1) % w.path.length; return; }
    const s = Math.min(d, w.speed * dt);
    w.x += (dx / d) * s; w.y += (dy / d) * s; w.anim += dt;
    w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }

  sources() {
    return [...this.level.npcs.map((n) => ({ ...n, kind: 'npc' })), ...this.level.interactables].filter((s) => this.visible(s));
  }

  pickTarget(pos = this.player, dir = this.player.dir) {
    const c = { x: pos.x, y: pos.y - 4 };
    const face = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, 1];
    let best = null, bestScore = Infinity;
    for (const s of this.sources()) {
      const a = anchorOf(this.level, s), d = Math.hypot(a.x - c.x, a.y - c.y);
      if (d > INTERACT_REACH) continue;
      const dot = d > 0 ? ((a.x - c.x) * face[0] + (a.y - c.y) * face[1]) / d : 1;
      const score = d - dot * 4; // nearest wins; facing breaks ties
      if (score < bestScore) { best = s; bestScore = score; }
    }
    return best;
  }

  noteArea() {
    const tx = Math.floor(this.player.x / this.level.T), ty = Math.floor((this.player.y - 2) / this.level.T);
    for (const a of this.level.areas) {
      const r = a.rect;
      if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h && !this.areas.has(a.id)) {
        this.areas.add(a.id); this.log('area', { area: a }); this.ui.areaEntered?.(a);
      }
    }
  }

  checkTriggers() {
    const tx = Math.floor(this.player.x / this.level.T), ty = Math.floor((this.player.y - 2) / this.level.T);
    for (const t of this.level.triggers) {
      const r = t.rect;
      if (tx < r.x || tx >= r.x + r.w || ty < r.y || ty >= r.y + r.h || this.fired.has(t.id)) continue;
      this.fired.add(t.id);
      for (const e of t.emits || []) if (evalAll(e.when, this.quests, this.inv)) this.emit(e);
    }
  }

  // ---------- quests ----------
  emit(ev) {
    const changes = this.quests.emit(ev);
    for (const c of changes) {
      if (c.kind === 'objective') {
        const q = this.content.QUESTS.find((x) => x.id === c.quest), o = q.objectives.find((x) => x.id === c.objective);
        this.log('objective', { quest: c.quest, objective: c.objective }); this.ui.sfx?.('objective');
        this.ui.toast?.(`${c.optional ? 'Bonus' : 'Objektif'} selesai: ${o.text}`, 'good');
      } else if (c.kind === 'flag' && c.flag === 'order_delivered') {
        this.ui.toast?.('Tirai biru di Lorong Roti kini terbuka.', 'good');
      } else if (c.kind === 'quest') {
        this.log('quest', { quest: c.quest, main: c.main });
        if (c.main) this.finishStage();
      }
    }
    if (changes.length) this.checkpoint();
    return changes;
  }

  discoverLex(ids = []) {
    const fresh = [];
    for (const id of ids) if (this.lexById.has(id) && discover(this.lexicon, id, this.day)) fresh.push(this.lexById.get(id));
    if (fresh.length) {
      this.log('discover', { ids: fresh.map((e) => e.id) });
      this.ui.sfx?.('discover');
      this.ui.toast?.(fresh.length === 1 ? `Kata baru: ${fresh[0].ar} — ${fresh[0].gloss}` : `${fresh.length} kata baru masuk Leksikon.`, 'word');
    }
  }

  // ---------- interaction ----------
  async interact() {
    if (this.mode !== 'play') return false;
    const s = this.pickTarget();
    if (!s) { this.ui.sfx?.('blocked'); return false; }
    this.mode = 'modal'; this.player.moving = false;
    try {
      if (s.kind === 'npc') await this.talk(s);
      else if (s.kind === 'inspect') await this.inspect(s);
      else if (s.kind === 'goods') await this.goods(s);
      else if (s.kind === 'pickup') await this.pickup(s);
      else if (s.kind === 'practice') await this.practice(s);
    } finally {
      if (this.mode === 'modal') this.mode = 'play';
      this.checkpoint();
    }
    return true;
  }

  async inspect(s) {
    const entries = (s.lex || []).map((id) => this.lexById.get(id)).filter(Boolean);
    this.discoverLex(s.lex);
    if (s.clue && !this.clues.includes(s.id)) this.clues.push(s.id);
    this.inspected.add(s.id);
    await this.ui.inspect({ title: s.title, ar: s.ar, text: s.text, note: s.note, words: entries });
    this.emit({ type: 'inspect', target: s.id });
  }

  async pickup(s) {
    if (!evalAll(s.requires, this.quests, this.inv)) {
      await this.ui.inspect({ title: s.title, text: s.blockedText, words: [] }); return;
    }
    const it = this.content.ITEMS[s.item];
    this.taken.add(s.id); this.addItem(s.item, s.qty || 1);
    this.ui.sfx?.('pickup'); this.ui.toast?.(`Diambil: ${it.name}`, 'good');
    this.discoverLex([it.lex]);
    this.emit({ type: 'collect', target: s.item });
  }

  async goods(s) {
    if (!evalAll(s.requires, this.quests, this.inv)) {
      await this.ui.inspect({ title: 'Bayar dulu', text: 'Bicaralah dengan penjual dan selesaikan pembayaran lebih dulu.', words: [] }); return;
    }
    this.discoverLex([s.lex]);
    const take = await this.ui.goods({ ar: s.ar, meaning: s.meaning, word: this.lexById.get(s.lex) });
    if (!take) return;
    if (s.item) {
      this.taken.add(s.id); this.addItem(s.item, s.qty || 1);
      this.ui.sfx?.('pickup'); this.ui.toast?.(`Diambil: ${this.content.ITEMS[s.item].name}`, 'good');
      this.emit({ type: 'collect', target: s.item });
    } else {
      this.stats.wrong++;
      const wanted = this.level.interactables.find((g) => g.kind === 'goods' && g.stallKind === s.stallKind && g.item);
      if (wanted) recordAnswer(this.lexicon, wanted.lex, { correct: false, direction: 'context', day: this.day });
      this.ui.sfx?.('wrong'); this.ui.shake?.();
      this.ui.toast?.(`Bukan itu. ${s.ar} = ${s.meaning}. Baca lagi pesananmu di Jurnal.`, 'warn');
      this.log('wrong-goods', { id: s.id });
    }
  }

  async talk(npc) {
    const spec = this.content.DIALOGUES[npc.dialogue];
    let nodeId = pickEntry(spec, this.quests, this.inv);
    this.emit({ type: 'talk', target: npc.id });
    this.log('talk', { npc: npc.id });
    let guard = 0;
    while (nodeId && guard++ < 60) {
      const node = spec.nodes[nodeId];
      if (node.challenge) {
        const ch = this.content.CHALLENGE_BY_ID.get(node.challenge.id);
        const res = await this.runChallenge(ch);
        nodeId = res.correct ? node.challenge.onCorrect : node.challenge.onWrong;
        continue;
      }
      this.discoverLex(node.lex);
      this.applyEffects(node.effects);
      const choices = visibleChoices(node, this.quests, this.inv);
      const idx = await this.ui.dialogue({ speaker: npc.name, speakerAr: npc.ar, ar: node.ar, text: node.text, words: (node.lex || []).map((i) => this.lexById.get(i)).filter(Boolean),
        choices: choices.map((c) => ({ ar: c.ar, text: c.text })), more: !!(node.next && !choices.length) });
      if (choices.length) {
        const c = choices[idx ?? choices.length - 1];
        this.applyEffects(c.effects);
        nodeId = c.end ? null : c.next;
      } else nodeId = node.end ? null : node.next || null;
    }
  }

  applyEffects(effects = []) {
    for (const ef of effects) {
      if ('flag' in ef) this.quests.setFlag(ef.flag);
      else if ('start' in ef) { if (this.quests.startQuest(ef.start)) { this.log('start', { quest: ef.start }); this.checkpoint(); } }
      else if ('give' in ef) { this.addItem(ef.give.item, ef.give.qty || 1); this.ui.sfx?.('pickup'); }
      else if ('take' in ef) { this.removeItem(ef.take.item); }
      else if ('deliver' in ef) {
        if (ef.deliver.items.every((i) => this.has(i))) { ef.deliver.items.forEach((i) => this.removeItem(i)); this.ui.sfx?.('deliver'); this.emit({ type: 'deliver', target: ef.deliver.to }); }
      }
      else if ('pay' in ef) { this.purse = Math.max(0, this.purse - ef.pay); this.ui.sfx?.('coin'); }
      else if ('discover' in ef) this.discoverLex(ef.discover);
      else if ('clue' in ef) { if (!this.clues.includes(ef.clue)) this.clues.push(ef.clue); }
      else if ('pack' in ef) this.discoverLex(this.content.POTTERY_PACK);
      else if ('toast' in ef) this.ui.toast?.(ef.toast, 'good');
      else if ('event' in ef) this.emit(ef.event);
    }
  }

  // ---------- learning ----------
  async runChallenge(ch) {
    const res = await this.ui.challenge(ch, { hints: this.save.settings.help === 'low' ? 0 : (this.save.settings.help === 'high' ? 3 : 1) });
    const ok = !!res.correct;
    for (const id of ch.lex || []) recordAnswer(this.lexicon, id, { correct: ok, direction: ch.direction || 'forward', day: this.day });
    if (ok) this.stats.right++; else this.stats.wrong++;
    this.stats.hints += res.hints || 0;
    this.practiced[ch.id] = (this.practiced[ch.id] || 0) + 1;
    this.ui.sfx?.(ok ? 'right' : 'wrong'); if (!ok) this.ui.shake?.();
    this.log('answer', { id: ch.id, correct: ok });
    if (ok) this.emit({ type: 'answer', target: ch.id });
    return { correct: ok };
  }

  buildPractice() {
    const known = new Set(Object.keys(this.lexicon));
    const authored = this.content.PRACTICE_POOL.map((id) => this.content.CHALLENGE_BY_ID.get(id))
      .filter((c) => c.prerequisites.every((p) => known.has(p)))            // teach before test
      .sort((a, b) => (this.practiced[a.id] || 0) - (this.practiced[b.id] || 0) || a.id.localeCompare(b.id));
    const weakFirst = pickReview(this.lexicon, this.day, 1, [...known].filter((id) => this.lexById.has(id)));
    const set = authored.slice(0, 2);
    if (weakFirst.length) {
      const e = this.lexById.get(weakFirst[0]), st = this.lexicon[e.id];
      set.push(makeVocabChallenge(e, this.content.LEXICON, st.fwd > st.rev ? 'reverse' : 'forward', this.day));
    }
    return set;
  }

  async practice() {
    const set = this.buildPractice();
    if (!set.length) { await this.ui.inspect({ title: 'Papan Latihan Pasar', text: 'Temui dan baca beberapa kata dulu — soal latihan hanya memuat kata yang sudah kamu temui.', words: [] }); return; }
    let right = 0;
    for (const ch of set) { if ((await this.runChallenge(ch)).correct) right++; }
    this.ui.toast?.(`Ronde latihan: ${right}/${set.length} benar.`, right === set.length ? 'good' : 'info');
    this.emit({ type: 'answer', target: 'practice.round' });
  }

  // ---------- persistence / completion ----------
  progressSnapshot() {
    return {
      stage: this.def.id, quests: this.quests.serialize(), inv: { ...this.inv }, purse: this.purse,
      taken: [...this.taken], clues: [...this.clues], inspected: [...this.inspected], areas: [...this.areas],
      pos: this.mode === 'done' ? null : { x: this.player.x, y: this.player.y }, practiced: { ...this.practiced },
      stats: { ...this.stats, seconds: Math.floor(this.stats.seconds), steps: Math.floor(this.stats.steps) },
    };
  }
  checkpoint() {
    this.save.progress = this.progressSnapshot(); this.save.lexicon = this.lexicon;
    const r = this.persist(this.save);
    if (r && r.ok === false) this.ui.toast?.('Progres tidak bisa disimpan di peramban ini.', 'warn');
  }

  summary() {
    const words = Object.keys(this.lexicon).filter((id) => this.lexById.has(id));
    const attempts = this.stats.right + this.stats.wrong;
    return {
      stage: this.def.id, name: this.def.name, seconds: Math.floor(this.stats.seconds), steps: Math.floor(this.stats.steps),
      right: this.stats.right, wrong: this.stats.wrong, hints: this.stats.hints,
      accuracy: attempts ? Math.round((this.stats.right / attempts) * 100) : null,
      words: words.length, wordStates: words.reduce((m, id) => { const s = stateOf(this.lexicon[id]); m[s] = (m[s] || 0) + 1; return m; }, {}),
      weak: words.filter((id) => this.lexicon[id].weak).map((id) => this.lexById.get(id)),
      sideDone: this.quests.status('q.key') === 'complete', practiceDone: this.quests.isDone('q.order', 'o_practice'),
      purse: this.purse,
    };
  }

  finishStage() {
    if (this.done) return;
    this.done = true; this.mode = 'done';
    if (!this.save.campaign.completed.includes(this.def.id)) this.save.campaign.completed.push(this.def.id);
    this.checkpoint();
    this.ui.sfx?.('victory'); this.ui.stageDone?.(this.summary());
  }

  // Objective markers: point at the person/place to go to, never at the correct basket (reading is the puzzle).
  markers() {
    const T = this.level.T, out = [];
    const npc = (id) => this.level.npcs.find((n) => n.id === id);
    const add = (n) => { const a = anchorOf(this.level, n); out.push({ x: a.x, y: a.y }); };
    for (const q of this.quests.summary()) {
      if (q.status !== 'active') continue;
      for (const o of q.objectives) {
        if (o.done || !o.available || o.optional) continue;
        if (o.type === 'talk' || o.type === 'deliver') { const n = npc(o.target); if (n) add(n); }
        else if (o.type === 'inspect') { const i = this.level.interactables.find((x) => x.id === o.target); if (i) add(i); }
        else if (o.type === 'answer') { const n = this.level.npcs.find((x) => (x.emits || []).some((e) => e.type === 'answer' && e.target === o.target)); if (n) add(n); }
        else if (o.type === 'collect') {
          const g = this.level.interactables.find((x) => (x.kind === 'goods' || x.kind === 'pickup') && x.item === o.target && !this.taken.has(x.id));
          if (g?.kind === 'goods') { const n = this.level.npcs.find((x) => x.anchor && x.anchor.y === g.y && Math.abs(x.anchor.x - g.x) <= 4); if (n) add(n); }
          else if (g) add(g);
        } else if (o.type === 'reach') { const t = this.level.triggers[0].rect; out.push({ x: (t.x + t.w / 2) * T, y: (t.y + t.h / 2) * T }); }
      }
    }
    return out;
  }

  // Journal data for UI
  journal() {
    return {
      quests: this.quests.summary(),
      clues: this.clues.map((id) => {
        const c = this.content.CLUES[id] || this.level.interactables.find((i) => i.id === id);
        return c ? { id, title: c.title, ar: c.ar, text: c.text, note: c.note } : null;
      }).filter(Boolean),
      bag: Object.entries(this.inv).map(([id, n]) => ({ id, n, ...this.content.ITEMS[id] })),
      areas: this.level.areas.map((a) => ({ ...a, found: this.areas.has(a.id) })),
      purse: this.purse,
    };
  }
}
export const cloneSave = clone;
