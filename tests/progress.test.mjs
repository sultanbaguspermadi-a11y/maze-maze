import test from 'node:test';
import assert from 'node:assert/strict';
import { discover, recordAnswer, stateOf, dueItems, pickReview } from '../src/learning/progress.js';

test('discovery alone is never mastery', () => {
  const p = {}; discover(p, 'w', 100);
  assert.equal(stateOf(p.w), 'discovered');
});
test('states advance only through the matching direction of correct answers', () => {
  const p = {}; discover(p, 'w', 100);
  assert.equal(recordAnswer(p, 'w', { correct: true, direction: 'forward', day: 100 }), 'recalled');
  assert.equal(recordAnswer(p, 'w', { correct: true, direction: 'reverse', day: 100 }), 'reversed');
  assert.equal(recordAnswer(p, 'w', { correct: true, direction: 'context', day: 100 }), 'contextual');
});
test('mastery needs reverse + context + two spaced successful reviews on later days', () => {
  const p = {}; discover(p, 'w', 0);
  recordAnswer(p, 'w', { correct: true, direction: 'forward', day: 0 });
  recordAnswer(p, 'w', { correct: true, direction: 'reverse', day: 0 });
  recordAnswer(p, 'w', { correct: true, direction: 'context', day: 0 });
  assert.notEqual(stateOf(p.w), 'mastered');
  // same-day repeats do not count as spaced
  recordAnswer(p, 'w', { correct: true, direction: 'forward', day: 0 });
  assert.equal(p.w.spaced, 0);
  let day = 0;
  for (let i = 0; i < 6; i++) { day = p.w.due; recordAnswer(p, 'w', { correct: true, direction: 'forward', day }); }
  assert.equal(stateOf(p.w), 'mastered');
});
test('a wrong answer resets the box, flags weak and makes it due immediately', () => {
  const p = {}; discover(p, 'w', 5);
  recordAnswer(p, 'w', { correct: true, day: 5 });
  recordAnswer(p, 'w', { correct: false, day: 5 });
  assert.equal(p.w.box, 1); assert.equal(p.w.weak, true);
  assert.deepEqual(dueItems(p, 5), ['w']);
});
test('review picker puts weak items first, then least practised, deterministically', () => {
  const p = {}; for (const id of ['a', 'b', 'c']) discover(p, id, 1);
  recordAnswer(p, 'a', { correct: true, day: 1 }); recordAnswer(p, 'a', { correct: true, day: 1 });
  recordAnswer(p, 'c', { correct: false, day: 1 });
  const got = pickReview(p, 1, 3, ['a', 'b', 'c']);
  assert.equal(got[0], 'c');
  assert.deepEqual(got, pickReview(p, 1, 3, ['a', 'b', 'c']));
});
