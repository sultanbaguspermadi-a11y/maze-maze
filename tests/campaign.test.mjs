// Headless end-to-end campaign tests (KM-111, partial): drive the real GameSession with a scripted UI,
// walking the real collider along BFS paths. No teleporting.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/game/session.js';
import { CONTENT, STAGES } from '../src/game/content.js';
import { defaultSave, SaveStore } from '../src/persistence/save.js';
import { tileCenter, anchorOf } from '../src/world/level.js';
import { evaluate } from '../src/learning/challenges.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };

function scriptedUi(opts = {}) {
  const ui = { lines: [], toasts: [], sfx: [], inspects: [], done: null, challenges: [], shakes: 0,
    wrongFirst: opts.wrongFirst || false, takeWrong: opts.takeWrong || false,
    async dialogue(d) { ui.lines.push(d); return d.choices.length ? (opts.pick?.(d) ?? 0) : null; },
    async inspect(i) { ui.inspects.push(i); },
    async goods() { return true; },
    async challenge(ch) {
      ui.challenges.push(ch.id);
      if (ui.wrongFirst && !ui.seen?.has(ch.id)) { (ui.seen ||= new Set()).add(ch.id); const bad = ch.options.find((o) => o.id !== ch.answer); return { correct: evaluate(ch, bad.id).correct, hints: 0 }; }
      return { correct: evaluate(ch, ch.type === 'choice' ? ch.answer : ch.type === 'order' ? (ch.answers || [ch.answer])[0] : ch.answers[0]).correct, hints: 0 };
    },
    toast(t, k) { ui.toasts.push([t, k]); }, sfxLog: [], shake() { ui.shakes++; }, stageDone(s) { ui.done = s; },
  };
  ui.sfx = (n) => ui.sfxLog.push(n);
  return ui;
}

function pathTiles(s, goal) {
  const { w } = s.level; const start = { x: Math.floor(s.player.x / 16), y: Math.floor((s.player.y - 2) / 16) };
  const prev = new Map([[start.y * w + start.x, null]]); const q = [[start.x, start.y]];
  while (q.length) {
    const [x, y] = q.shift();
    if (goal(x, y)) { const out = []; let k = y * w + x; while (k !== null) { out.push([k % w, Math.floor(k / w)]); k = prev.get(k); } return out.reverse(); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * w + nx;
      if (s.collider.blockedTile(nx, ny) || prev.has(k)) continue; prev.set(k, y * w + x); q.push([nx, ny]);
    }
  }
  return null;
}
function walkPath(s, path) {
  for (const [tx, ty] of path.slice(1)) {
    if (s.mode === 'done') return;
    const c = tileCenter(16, tx, ty); c.y += 4;
    for (let i = 0; i < 500 && Math.hypot(c.x - s.player.x, c.y - s.player.y) > 1.5; i++) {
      if (s.mode === 'done') return;
      const dx = c.x - s.player.x, dy = c.y - s.player.y, d = Math.hypot(dx, dy);
      s.update(1 / 30, { x: dx / d, y: dy / d });
    }
    assert.ok(Math.hypot(c.x - s.player.x, c.y - s.player.y) <= 1.5, `stuck before ${tx},${ty}`);
  }
}
// Stand where the nearest/facing target is exactly `id`, then interact.
async function useTarget(s, id) {
  const src = s.sources().find((x) => x.id === id); assert.ok(src, `${id} not visible/available`);
  const a = anchorOf(s.level, src);
  const ok = (x, y) => {
    const pos = { x: (x + 0.5) * 16, y: (y + 0.5) * 16 + 4 };
    if (s.collider.blockedTile(x, y)) return false;
    return ['up', 'down', 'left', 'right'].every((d) => s.pickTarget(pos, d)?.id === id) && Math.hypot(a.x - pos.x, a.y - (pos.y - 4)) <= 30;
  };
  const path = pathTiles(s, ok); assert.ok(path, `no standing spot for ${id}`);
  walkPath(s, path); s.update(1 / 30, { x: 0, y: 0 });
  assert.equal(s.target?.id, id, `target is ${s.target?.id}, wanted ${id}`);
  assert.equal(await s.interact(), true);
}
function newSession(ui = scriptedUi(), save = defaultSave(), store = new SaveStore(mem())) {
  return { s: new GameSession({ stageDef: STAGES.morning, content: CONTENT, save, ui, persist: (sv) => store.write(sv), day: 20000 }), ui, store, save };
}

async function playMain(s) {
  await useTarget(s, 'npc.zainab');
  await useTarget(s, 'insp.board_dates');
  await useTarget(s, 'npc.abu_salih'); await useTarget(s, 'gd.b');
  await useTarget(s, 'npc.khabbaz'); await useTarget(s, 'gb.b');
  await useTarget(s, 'npc.saqqa'); await useTarget(s, 'gw.c');
  await useTarget(s, 'npc.zainab');
}

test('FULL MAIN QUEST from a clean save: shop, deliver, curtain opens, walk out, stage completes', async () => {
  const { s, ui } = newSession();
  assert.equal(s.purse, 10);
  await playMain(s);
  assert.equal(s.quests.isDone('q.order', 'o_deliver'), true);
  assert.equal(s.gateOpen('gate.curtain'), true);
  assert.equal(s.purse, 0, 'exactly 10 dirhams spent: 3 + 2 + 5');
  assert.equal(s.has('item.seal'), true);
  for (const i of ['item.dates', 'item.bread', 'item.jar']) assert.equal(s.has(i), false, 'delivered items are consumed');
  const t = s.level.triggers[0].rect;
  walkPath(s, pathTiles(s, (x, y) => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h));
  assert.equal(s.quests.status('q.order'), 'complete');
  assert.ok(ui.done, 'results screen requested'); assert.equal(s.mode, 'done');
  assert.equal(ui.done.words >= 20, true);
});

test('shopping can be done in any order of stalls', async () => {
  const { s } = newSession();
  await useTarget(s, 'npc.zainab');
  await useTarget(s, 'npc.saqqa'); await useTarget(s, 'gw.c');
  await useTarget(s, 'npc.abu_salih'); await useTarget(s, 'gd.b');
  await useTarget(s, 'npc.khabbaz'); await useTarget(s, 'gb.b');
  await useTarget(s, 'npc.zainab');
  assert.equal(s.quests.isDone('q.order', 'o_deliver'), true);
});

test('goods cannot be taken before paying, and paying cannot happen before the order is received', async () => {
  const { s, ui } = newSession();
  await useTarget(s, 'gd.b');                                   // before talking to anyone
  assert.equal(s.has('item.dates'), false);
  assert.match(ui.inspects.at(-1).title, /Bayar dulu/);
  await useTarget(s, 'npc.abu_salih');                          // vendor greets but does not sell yet
  assert.equal(s.quests.isDone('q.order', 'o_pay_dates'), false);
  assert.equal(s.purse, 10);
});

test('a wrong basket gives nothing, is explained, counts as a miss, and keeps the quest solvable', async () => {
  const { s, ui } = newSession();
  await useTarget(s, 'npc.zainab'); await useTarget(s, 'npc.abu_salih');
  await useTarget(s, 'gd.a');                                   // figs
  assert.equal(s.has('item.dates'), false); assert.equal(ui.shakes, 1);
  assert.ok(ui.toasts.some(([t]) => /Bukan itu/.test(t)));
  assert.equal(s.lexicon['lex.tamr'].weak, true, 'the needed word is flagged for adaptive review');
  await useTarget(s, 'gd.b'); assert.equal(s.has('item.dates'), true);
});

test('wrong price answer loops back through the vendor and does not charge or complete', async () => {
  const { s, ui } = newSession(scriptedUi({ wrongFirst: true }));
  await useTarget(s, 'npc.zainab'); await useTarget(s, 'npc.abu_salih');
  assert.equal(s.purse, 3 === 3 ? 7 : 0, 'paid once, after the retry');
  assert.deepEqual(ui.challenges.filter((c) => c === 'ch.price.dates').length, 2, 'asked twice (wrong, then right)');
  assert.ok(ui.lines.some((l) => /مَرَّةً أُخْرَى/.test(l.ar || '')), 'vendor explained and re-asked');
});

test('re-talking after completion never pays or rewards twice', async () => {
  const { s } = newSession();
  await playMain(s);
  const purse = s.purse, seal = s.inv['item.seal'];
  await useTarget(s, 'npc.zainab'); await useTarget(s, 'npc.abu_salih');
  assert.equal(s.purse, purse); assert.equal(s.inv['item.seal'], seal);
});

test('side quest: key is blocked until asked, then fetch → return → pottery word pack once', async () => {
  const { s, ui } = newSession();
  await useTarget(s, 'pk.key');
  assert.equal(s.has('item.key'), false); assert.match(ui.inspects.at(-1).text, /belum jelas/);
  await useTarget(s, 'npc.potter');
  assert.equal(s.quests.status('q.key'), 'active');
  await useTarget(s, 'pk.key'); assert.equal(s.has('item.key'), true);
  assert.equal(s.visible(s.level.interactables.find((i) => i.id === 'pk.key')), false, 'key disappears once taken');
  const before = Object.keys(s.lexicon).length;
  await useTarget(s, 'npc.potter');
  assert.equal(s.quests.status('q.key'), 'complete'); assert.equal(s.has('item.key'), false);
  assert.ok(Object.keys(s.lexicon).length > before - 1 && 'lex.ibriq' in s.lexicon, 'pack words discovered');
  assert.equal(s.quests.status('q.order') !== 'complete', true, 'side quest does not finish the stage');
});

test('practice board teaches before testing: nothing known → refuses; later uses only met prerequisites', async () => {
  const { s, ui } = newSession();
  await useTarget(s, 'prac.board');
  assert.match(ui.inspects.at(-1).text, /Temui dan baca/);
  assert.equal(s.quests.isDone('q.order', 'o_practice'), false);
  await useTarget(s, 'npc.zainab');
  await useTarget(s, 'prac.board');
  const asked = ui.challenges.filter((c) => !c.startsWith('ch.price'));
  assert.ok(asked.length >= 1);
  for (const id of asked.filter((c) => c.startsWith('ch.m1.'))) {
    const ch = CONTENT.CHALLENGE_BY_ID.get(id);
    assert.ok(ch.prerequisites.every((p) => p in s.lexicon), `${id} asked before its words were met`);
  }
  assert.equal(s.quests.isDone('q.order', 'o_practice'), true);
});

test('reload mid-quest restores flags, inventory, purse, objectives and position', async () => {
  const a = newSession();
  await useTarget(a.s, 'npc.zainab'); await useTarget(a.s, 'npc.abu_salih'); await useTarget(a.s, 'gd.b');
  const loaded = a.store.load();
  assert.equal(loaded.status, 'loaded');
  const b = newSession(scriptedUi(), loaded.save, a.store);
  assert.deepEqual(b.s.quests.serialize(), a.s.quests.serialize());
  assert.equal(b.s.has('item.dates'), true); assert.equal(b.s.purse, 7);
  assert.ok(Math.hypot(b.s.player.x - a.s.player.x, b.s.player.y - a.s.player.y) < 1);
  assert.equal(b.s.visible(b.s.level.interactables.find((i) => i.id === 'gd.b')), false, 'taken basket stays empty after reload');
  await useTarget(b.s, 'npc.khabbaz'); await useTarget(b.s, 'gb.b'); await useTarget(b.s, 'npc.saqqa'); await useTarget(b.s, 'gw.c'); await useTarget(b.s, 'npc.zainab');
  assert.equal(b.s.quests.isDone('q.order', 'o_deliver'), true, 'campaign finishable after reload');
});

test('a corrupted saved position falls back to the safe spawn', () => {
  const save = defaultSave(); save.progress.pos = { x: 5, y: 5 };       // inside a wall
  const { s } = newSession(scriptedUi(), save);
  assert.ok(s.collider.standable(s.player.x, s.player.y));
});

test('lexicon states only advance via real answers (discovery ≠ mastery)', async () => {
  const { s } = newSession();
  await useTarget(s, 'npc.zainab');
  assert.ok(s.lexicon['lex.tamr']); assert.equal(s.lexicon['lex.tamr'].fwd + s.lexicon['lex.tamr'].ctx, 0);
});

test('failed saves surface a warning instead of crashing', async () => {
  const bad = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem() {} };
  const ui = scriptedUi();
  const s = new GameSession({ stageDef: STAGES.morning, content: CONTENT, save: defaultSave(), ui, persist: (sv) => new SaveStore(bad).write(sv), day: 1 });
  await useTarget(s, 'npc.zainab');
  assert.ok(ui.toasts.some(([t]) => /tidak bisa disimpan/.test(t)));
});

test('movement is blocked while a modal is active and wanderers keep to their routes', async () => {
  const { s } = newSession();
  s.mode = 'modal'; const p = { ...s.player };
  s.update(0.5, { x: 1, y: 0 });
  assert.equal(s.player.x, p.x); s.mode = 'play';
  for (let i = 0; i < 3000; i++) s.update(1 / 30, { x: 0, y: 0 });
  for (const w of s.wanderers) assert.equal(s.collider.blockedTile(Math.floor(w.x / 16), Math.floor((w.y - 2) / 16)), false, `${w.id} left its route`);
});
