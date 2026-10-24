import test from 'node:test';
import assert from 'node:assert/strict';
import { QuestEngine, evalCond } from '../src/quests/engine.js';

const defs = [{
  id: 'q.a', title: 'A', main: true, autoStart: true, onComplete: { flags: ['a_done'] },
  objectives: [
    { id: 'o1', type: 'talk', target: 'npc.x', grants: ['met'] },
    { id: 'o2', type: 'collect', target: 'item.y', requires: ['o1'] },
    { id: 'o3', type: 'collect', target: 'item.z', requiresFlags: ['met'], count: 2 },
    { id: 'opt', type: 'inspect', target: 'sign', optional: true },
  ],
}, { id: 'q.b', title: 'B', startsWhen: { quests: ['q.a'] }, autoStart: true, objectives: [{ id: 'p1', type: 'reach', target: 'exit' }] }];

test('objectives cannot complete before their prerequisites', () => {
  const e = new QuestEngine(defs);
  assert.deepEqual(e.emit({ type: 'collect', target: 'item.y' }), []);
  assert.equal(e.isDone('q.a', 'o2'), false);
});
test('unrelated events never complete anything', () => {
  const e = new QuestEngine(defs);
  assert.deepEqual(e.emit({ type: 'inspect', target: 'item.y' }), []);
  assert.deepEqual(e.emit({ type: 'talk', target: 'npc.other' }), []);
});
test('grants set flags and unlock flag-gated objectives', () => {
  const e = new QuestEngine(defs);
  e.emit({ type: 'talk', target: 'npc.x' });
  assert.equal(e.hasFlag('met'), true);
  e.emit({ type: 'collect', target: 'item.z' });
  assert.equal(e.isDone('q.a', 'o3'), false);       // needs count 2
  e.emit({ type: 'collect', target: 'item.z' });
  assert.equal(e.isDone('q.a', 'o3'), true);
});
test('quest completes without optional objectives, sets onComplete flags, auto-starts followers', () => {
  const e = new QuestEngine(defs);
  assert.equal(e.status('q.b'), 'locked');
  for (const ev of [{ type: 'talk', target: 'npc.x' }, { type: 'collect', target: 'item.y' }, { type: 'collect', target: 'item.z' }, { type: 'collect', target: 'item.z' }]) e.emit(ev);
  assert.equal(e.status('q.a'), 'complete'); assert.equal(e.hasFlag('a_done'), true);
  assert.equal(e.status('q.b'), 'active');
});
test('completed objectives do not complete twice (no duplicate rewards)', () => {
  const e = new QuestEngine(defs);
  const first = e.emit({ type: 'talk', target: 'npc.x' });
  const second = e.emit({ type: 'talk', target: 'npc.x' });
  assert.ok(first.some((c) => c.kind === 'objective')); assert.deepEqual(second, []);
});
test('serialize → restore preserves state exactly', () => {
  const e = new QuestEngine(defs);
  e.emit({ type: 'talk', target: 'npc.x' }); e.emit({ type: 'collect', target: 'item.z' });
  const r = new QuestEngine(defs, JSON.parse(JSON.stringify(e.serialize())));
  assert.deepEqual(r.serialize(), e.serialize());
});
test('startQuest honours prerequisites; locked non-auto quests stay locked', () => {
  const d = [{ id: 'q.c', title: 'C', startsWhen: { flags: ['f'] }, objectives: [{ id: 'x', type: 'talk', target: 't' }] }];
  const e = new QuestEngine(d);
  assert.equal(e.startQuest('q.c'), false); e.setFlag('f'); assert.equal(e.startQuest('q.c'), true);
});
test('conditions', () => {
  const e = new QuestEngine(defs); e.setFlag('f');
  assert.equal(evalCond({ flag: 'f' }, e), true); assert.equal(evalCond({ notFlag: 'f' }, e), false);
  assert.equal(evalCond({ item: 'i', min: 2 }, e, { i: 2 }), true); assert.equal(evalCond({ item: 'i' }, e, {}), false);
  assert.equal(evalCond({ quest: ['q.a', 'active'] }, e), true);
  assert.throws(() => evalCond({ wat: 1 }, e), /Unknown condition/);
});
