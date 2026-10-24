// Objective / quest evaluator (KM-033). Deterministic, serialisable, DOM-free.
// An event can complete an objective only if: the quest is active, the objective's type+target
// match, every `requires` objective is done and every `requiresFlags` flag is set.
export const OBJECTIVE_TYPES = ['talk', 'inspect', 'collect', 'deliver', 'answer', 'activate', 'unlock', 'survive', 'reach', 'boss'];

export class QuestEngine {
  constructor(defs, saved = null) {
    this.defs = new Map(defs.map((d) => [d.id, d]));
    this.flags = new Set(Array.isArray(saved?.flags) ? saved.flags : []);
    this.state = {};
    for (const d of defs) {
      const s = saved?.quests?.[d.id];
      const objectives = {};
      for (const o of d.objectives) {
        const so = s?.objectives?.[o.id];
        objectives[o.id] = { done: !!so?.done, count: so?.count || 0 };
      }
      this.state[d.id] = { status: s?.status || 'locked', objectives };
    }
    this._autoStart();
  }

  hasFlag(f) { return this.flags.has(f); }
  setFlag(f) { const had = this.flags.has(f); this.flags.add(f); return !had; }
  status(qid) { return this.state[qid]?.status ?? 'unknown'; }
  isDone(qid, oid) { return !!this.state[qid]?.objectives[oid]?.done; }

  _prereqOk(def) {
    const sw = def.startsWhen || {};
    return (sw.flags || []).every((f) => this.flags.has(f))
      && (sw.quests || []).every((q) => this.status(q) === 'complete');
  }

  _autoStart() {
    let changed = true;
    const started = [];
    while (changed) {
      changed = false;
      for (const d of this.defs.values()) {
        if (this.state[d.id].status === 'locked' && d.autoStart && this._prereqOk(d)) {
          this.state[d.id].status = 'active'; started.push(d.id); changed = true;
        }
      }
    }
    return started;
  }

  startQuest(qid) {
    const d = this.defs.get(qid);
    if (!d || this.state[qid].status !== 'locked' || !this._prereqOk(d)) return false;
    this.state[qid].status = 'active';
    return true;
  }

  available(def, obj) {
    const q = this.state[def.id];
    if (q.status !== 'active' || q.objectives[obj.id].done) return false;
    return (obj.requires || []).every((r) => q.objectives[r]?.done)
      && (obj.requiresFlags || []).every((f) => this.flags.has(f));
  }

  // Returns a list of change records: {kind:'objective'|'quest'|'flag', ...}
  emit(ev) {
    const changes = [];
    for (const def of this.defs.values()) {
      for (const obj of def.objectives) {
        if (obj.type !== ev.type || obj.target !== ev.target || !this.available(def, obj)) continue;
        const so = this.state[def.id].objectives[obj.id];
        so.count++;
        if (so.count < (obj.count || 1)) { changes.push({ kind: 'progress', quest: def.id, objective: obj.id, count: so.count }); continue; }
        so.done = true;
        changes.push({ kind: 'objective', quest: def.id, objective: obj.id, optional: !!obj.optional });
        for (const f of obj.grants || []) if (this.setFlag(f)) changes.push({ kind: 'flag', flag: f });
      }
      const q = this.state[def.id];
      if (q.status === 'active' && def.objectives.filter((o) => !o.optional).every((o) => q.objectives[o.id].done)) {
        q.status = 'complete';
        changes.push({ kind: 'quest', quest: def.id, main: !!def.main });
        for (const f of def.onComplete?.flags || []) if (this.setFlag(f)) changes.push({ kind: 'flag', flag: f });
      }
    }
    for (const qid of this._autoStart()) changes.push({ kind: 'start', quest: qid });
    return changes;
  }

  // Journal view: what is available now, what is done.
  summary() {
    const out = [];
    for (const d of this.defs.values()) {
      const q = this.state[d.id];
      if (q.status === 'locked') continue;
      out.push({
        id: d.id, title: d.title, ar: d.ar, main: !!d.main, status: q.status,
        objectives: d.objectives.map((o) => ({
          id: o.id, text: o.text, optional: !!o.optional, done: q.objectives[o.id].done,
          available: this.available(d, o), count: q.objectives[o.id].count, need: o.count || 1,
          hint: o.hint, target: o.target, type: o.type,
        })),
      });
    }
    return out;
  }

  serialize() {
    return { flags: [...this.flags].sort(), quests: JSON.parse(JSON.stringify(this.state)) };
  }
}

// Condition language shared by dialogue, interactables and the level validator.
export function evalCond(cond, engine, inv = {}) {
  if ('flag' in cond) return engine.hasFlag(cond.flag);
  if ('notFlag' in cond) return !engine.hasFlag(cond.notFlag);
  if ('quest' in cond) return engine.status(cond.quest[0]) === cond.quest[1];
  if ('objective' in cond) return engine.isDone(cond.objective[0], cond.objective[1]);
  if ('item' in cond) return (inv[cond.item] || 0) >= (cond.min || 1);
  if ('notItem' in cond) return !(inv[cond.notItem] > 0);
  throw new Error(`Unknown condition: ${JSON.stringify(cond)}`);
}
export const evalAll = (conds, engine, inv) => (conds || []).every((c) => evalCond(c, engine, inv));
