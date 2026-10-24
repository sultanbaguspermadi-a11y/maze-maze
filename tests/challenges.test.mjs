import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, makeVocabChallenge, shuffledOptions, hintFor } from '../src/learning/challenges.js';

const choice = {
  id: 'c', type: 'choice', rationale: 'ok', answer: 'b',
  options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }],
  optionFeedback: { a: 'why-a-wrong' }, hints: ['h0', 'h1'],
};
test('choice: correct, wrong with option feedback, wrong fallback, invalid', () => {
  assert.equal(evaluate(choice, 'b').correct, true);
  const wa = evaluate(choice, 'a');
  assert.equal(wa.correct, false); assert.equal(wa.feedback, 'why-a-wrong');
  assert.equal(evaluate(choice, 'c').feedback, 'ok');
  assert.equal(evaluate(choice, 'zzz').invalid, true);
});
test('order: accepts every authored variant, rejects others', () => {
  const o = { id: 'o', type: 'order', answers: [['a', 'b', 'c'], ['b', 'a', 'c']], rationale: 'r', tokens: [] };
  assert.equal(evaluate(o, ['b', 'a', 'c']).correct, true);
  assert.equal(evaluate(o, ['c', 'b', 'a']).correct, false);
  assert.equal(evaluate(o, null).correct, false);
});
test('unsupported type throws', () => assert.throws(() => evaluate({ id: 'x', type: 'drag' }, 1), /Unsupported/));
test('hints are sequential and bounded', () => {
  assert.equal(hintFor(choice, 0), 'h0'); assert.equal(hintFor(choice, 1), 'h1');
  assert.equal(hintFor(choice, 2), null); assert.equal(hintFor(choice, -1), null);
});
test('option shuffle is deterministic per challenge+seed and keeps all options', () => {
  const a = shuffledOptions(choice, 3).map((o) => o.id), b = shuffledOptions(choice, 3).map((o) => o.id);
  assert.deepEqual(a, b); assert.deepEqual([...a].sort(), ['a', 'b', 'c']);
});
const lex = ['a', 'b', 'c', 'd', 'e'].map((k, i) => ({ id: 'lex.' + k, ar: 'ك' + k, gloss: 'g' + i, topic: 'vocab.x', pos: 'n', stage: 'morning' }));
test('generated vocab challenge has exactly one right answer and unique glosses', () => {
  for (const dir of ['forward', 'reverse']) {
    const ch = makeVocabChallenge(lex[0], lex, dir, 1);
    assert.equal(ch.options.length, 4);
    assert.equal(evaluate(ch, ch.answer).correct, true);
    const texts = ch.options.map((o) => o.text ?? o.ar);
    assert.equal(new Set(texts).size, 4);
  }
});
