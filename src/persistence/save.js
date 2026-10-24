// Versioned, validated local persistence (KM-016). No account, no personal data.
// Storage is injected so the same code is unit-tested in Node and used with localStorage in browsers.
import { clamp } from '../core/util.js';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'kalimah.chronicles.save';

export const DEFAULT_SETTINGS = Object.freeze({
  arSize: 'm',            // s | m | l | xl
  translation: true,      // show Indonesian meaning under Arabic lines
  control: 'auto',        // auto | joystick | dpad
  leftHanded: false,
  padSize: 1,             // 0.8 – 1.4
  padOpacity: 0.75,       // 0.3 – 1
  master: 0.8, music: 0.5, sfx: 0.8, mute: false,
  reducedMotion: 'auto',  // auto | on | off
  shake: 'normal',        // normal | reduced | off
  help: 'normal',         // low | normal | high  (hints + objective markers)
  keyInteract: 'KeyE',    // KeyE | KeyF | Space | Enter
  keyJournal: 'KeyJ',     // KeyJ | KeyI | Tab
});

const ENUMS = {
  arSize: ['s', 'm', 'l', 'xl'], control: ['auto', 'joystick', 'dpad'],
  reducedMotion: ['auto', 'on', 'off'], shake: ['normal', 'reduced', 'off'],
  help: ['low', 'normal', 'high'],
  keyInteract: ['KeyE', 'KeyF', 'Space', 'Enter'], keyJournal: ['KeyJ', 'KeyI', 'Tab'],
};

export function defaultProgress() {
  return {
    stage: 'morning', quests: { flags: [], quests: {} }, inv: {}, purse: 10,
    taken: [], clues: [], inspected: [], areas: [], pos: null, practiced: {},
    stats: { right: 0, wrong: 0, hints: 0, steps: 0, seconds: 0 },
  };
}

export function defaultSave() {
  return {
    version: SAVE_VERSION, settings: { ...DEFAULT_SETTINGS },
    campaign: { completed: [], current: 'morning' },
    progress: defaultProgress(), lexicon: {},
  };
}

const num = (v, d, lo, hi) => (Number.isFinite(v) ? clamp(v, lo, hi) : d);
const strArr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 2000) : []);

export function sanitizeSettings(s) {
  const out = { ...DEFAULT_SETTINGS };
  if (!s || typeof s !== 'object') return out;
  for (const [k, vals] of Object.entries(ENUMS)) if (vals.includes(s[k])) out[k] = s[k];
  for (const k of ['translation', 'leftHanded', 'mute']) if (typeof s[k] === 'boolean') out[k] = s[k];
  out.padSize = num(s.padSize, out.padSize, 0.8, 1.4);
  out.padOpacity = num(s.padOpacity, out.padOpacity, 0.3, 1);
  for (const k of ['master', 'music', 'sfx']) out[k] = num(s[k], out[k], 0, 1);
  return out;
}

export function sanitizeProgress(p) {
  const out = defaultProgress();
  if (!p || typeof p !== 'object') return out;
  if (typeof p.stage === 'string') out.stage = p.stage.slice(0, 40);
  if (p.quests && typeof p.quests === 'object') {
    out.quests = { flags: strArr(p.quests.flags), quests: {} };
    if (p.quests.quests && typeof p.quests.quests === 'object') {
      for (const [qid, q] of Object.entries(p.quests.quests)) {
        if (!q || !['locked', 'active', 'complete'].includes(q.status)) continue;
        const objectives = {};
        for (const [oid, o] of Object.entries(q.objectives || {})) {
          if (o && typeof o === 'object') objectives[oid] = { done: !!o.done, count: num(o.count, 0, 0, 9999) };
        }
        out.quests.quests[qid] = { status: q.status, objectives };
      }
    }
  }
  if (p.inv && typeof p.inv === 'object') {
    for (const [k, v] of Object.entries(p.inv)) if (Number.isFinite(v) && v > 0) out.inv[k] = Math.min(99, Math.floor(v));
  }
  out.purse = Math.floor(num(p.purse, out.purse, 0, 9999));
  out.taken = strArr(p.taken); out.clues = strArr(p.clues);
  out.inspected = strArr(p.inspected); out.areas = strArr(p.areas);
  if (p.pos && Number.isFinite(p.pos.x) && Number.isFinite(p.pos.y)) out.pos = { x: p.pos.x, y: p.pos.y };
  if (p.practiced && typeof p.practiced === 'object') {
    for (const [k, v] of Object.entries(p.practiced)) if (Number.isFinite(v) && v > 0) out.practiced[k] = Math.min(9999, Math.floor(v));
  }
  if (p.stats && typeof p.stats === 'object') {
    for (const k of Object.keys(out.stats)) out.stats[k] = Math.floor(num(p.stats[k], 0, 0, 1e9));
  }
  return out;
}

export function sanitizeLexicon(l) {
  const out = {};
  if (!l || typeof l !== 'object') return out;
  for (const [id, e] of Object.entries(l)) {
    if (!e || typeof e !== 'object' || typeof id !== 'string') continue;
    out[id] = {
      seen: Math.floor(num(e.seen, 0, 0, 1e7)), box: Math.floor(num(e.box, 0, 0, 5)),
      due: Number.isFinite(e.due) ? e.due : null,
      fwd: Math.floor(num(e.fwd, 0, 0, 9999)), rev: Math.floor(num(e.rev, 0, 0, 9999)),
      ctx: Math.floor(num(e.ctx, 0, 0, 9999)), wrong: Math.floor(num(e.wrong, 0, 0, 9999)),
      spaced: Math.floor(num(e.spaced, 0, 0, 9999)), lastDay: Math.floor(num(e.lastDay, 0, 0, 1e7)),
      weak: !!e.weak,
    };
  }
  return out;
}

// MIGRATIONS[n] upgrades a save at version n to version n+1.
// Empty today: there is no earlier chapter-save format to map from. The legacy single-file
// prototype used different, undocumented keys, so no legacy import is attempted (see docs).
export const MIGRATIONS = {};

export function migrate(raw, migrations = MIGRATIONS, target = SAVE_VERSION) {
  if (!raw || typeof raw !== 'object' || !Number.isInteger(raw.version)) {
    return { ok: false, reason: 'missing-version' };
  }
  if (raw.version > target) return { ok: false, reason: 'from-future' };
  let cur = raw;
  while (cur.version < target) {
    const step = migrations[cur.version];
    if (!step) return { ok: false, reason: `no-migration-${cur.version}` };
    cur = { ...step(cur), version: cur.version + 1 };
  }
  return { ok: true, save: cur };
}

export function sanitizeSave(raw) {
  const save = defaultSave();
  save.settings = sanitizeSettings(raw?.settings);
  if (raw?.campaign && typeof raw.campaign === 'object') {
    save.campaign.completed = strArr(raw.campaign.completed);
    if (typeof raw.campaign.current === 'string') save.campaign.current = raw.campaign.current.slice(0, 40);
  }
  save.progress = sanitizeProgress(raw?.progress);
  save.lexicon = sanitizeLexicon(raw?.lexicon);
  return save;
}

export class SaveStore {
  constructor(storage, key = SAVE_KEY) { this.storage = storage; this.key = key; }

  load() {
    let text = null;
    try { text = this.storage?.getItem(this.key) ?? null; } catch { return { save: defaultSave(), status: 'unavailable' }; }
    if (text === null) return { save: defaultSave(), status: 'new' };
    let raw;
    try { raw = JSON.parse(text); } catch { raw = null; }
    const m = migrate(raw);
    if (!m.ok) {
      try { this.storage.setItem(this.key + '.corrupt', text); } catch { /* ignore */ }
      return { save: defaultSave(), status: 'recovered', reason: m.reason };
    }
    return { save: sanitizeSave(m.save), status: 'loaded' };
  }

  write(save) {
    try { this.storage.setItem(this.key, JSON.stringify({ ...save, version: SAVE_VERSION })); return { ok: true }; }
    catch (error) { return { ok: false, error: String(error?.message || error) }; }
  }

  reset() {
    try { this.storage.removeItem(this.key); return { ok: true }; }
    catch (error) { return { ok: false, error: String(error?.message || error) }; }
  }
}
