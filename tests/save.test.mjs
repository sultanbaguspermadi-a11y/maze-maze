import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveStore, defaultSave, sanitizeSave, migrate, SAVE_VERSION, SAVE_KEY } from '../src/persistence/save.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), _m: m }; };

test('fresh storage → new default save', () => {
  const r = new SaveStore(mem()).load();
  assert.equal(r.status, 'new'); assert.equal(r.save.version, SAVE_VERSION);
});
test('round trip preserves progress, settings, lexicon', () => {
  const st = mem(), store = new SaveStore(st);
  const s = defaultSave();
  s.settings.arSize = 'xl'; s.progress.purse = 4; s.progress.quests.flags = ['a'];
  s.lexicon['lex.x'] = { seen: 1, box: 2, due: 3, fwd: 1, rev: 0, ctx: 0, wrong: 0, spaced: 0, lastDay: 1, weak: false };
  assert.equal(store.write(s).ok, true);
  const r = store.load();
  assert.equal(r.status, 'loaded');
  assert.equal(r.save.settings.arSize, 'xl'); assert.equal(r.save.progress.purse, 4);
  assert.deepEqual(r.save.progress.quests.flags, ['a']); assert.equal(r.save.lexicon['lex.x'].box, 2);
});
test('corrupt JSON is recovered with defaults and the bad payload is kept aside', () => {
  const st = mem(); st.setItem(SAVE_KEY, '{not json');
  const r = new SaveStore(st).load();
  assert.equal(r.status, 'recovered'); assert.equal(st.getItem(SAVE_KEY + '.corrupt'), '{not json');
});
test('save from a future version is not loaded', () => {
  const st = mem(); st.setItem(SAVE_KEY, JSON.stringify({ version: 999 }));
  assert.equal(new SaveStore(st).load().status, 'recovered');
});
test('sanitizer clamps and drops invalid values', () => {
  const s = sanitizeSave({ settings: { master: 7, padSize: 'x', arSize: 'huge', keyInteract: 'KeyZ' }, progress: { purse: -5, inv: { a: 2, b: -1, c: 'z' }, pos: { x: 'a', y: 1 } } });
  assert.equal(s.settings.master, 1); assert.equal(s.settings.arSize, 'm'); assert.equal(s.settings.keyInteract, 'KeyE');
  assert.equal(s.progress.purse, 0); assert.deepEqual(s.progress.inv, { a: 2 }); assert.equal(s.progress.pos, null);
});
test('migration chain runs in order and fails clearly when a step is missing', () => {
  const m = { 1: (r) => ({ ...r, a: 1 }), 2: (r) => ({ ...r, b: r.a + 1 }) };
  const ok = migrate({ version: 1 }, m, 3);
  assert.equal(ok.ok, true); assert.equal(ok.save.b, 2); assert.equal(ok.save.version, 3);
  assert.equal(migrate({ version: 1 }, { 1: (r) => r }, 3).reason, 'no-migration-2');
  assert.equal(migrate({}, m, 3).reason, 'missing-version');
});
test('failed writes are reported, not thrown', () => {
  const bad = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  const r = new SaveStore(bad).write(defaultSave());
  assert.equal(r.ok, false); assert.match(r.error, /quota/);
});
test('unavailable storage does not crash load', () => {
  const bad = { getItem: () => { throw new Error('denied'); } };
  assert.equal(new SaveStore(bad).load().status, 'unavailable');
});
test('reset removes the save', () => {
  const st = mem(), store = new SaveStore(st); store.write(defaultSave()); store.reset();
  assert.equal(store.load().status, 'new');
});
