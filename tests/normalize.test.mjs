import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArabic, stripTashkeel, canonicalMarks } from '../src/learning/normalize.js';
import { evaluate } from '../src/learning/challenges.js';

test('exact policy keeps diacritics: different vowels are different answers', () => {
  assert.notEqual(normalizeArabic('رَغِيفَانِ'), normalizeArabic('رَغِيفَيْنِ'));
  assert.notEqual(normalizeArabic('تَمْرٌ'), normalizeArabic('تَمْرًا'));
});
test('exact policy removes tatweel and collapses spaces but nothing else', () => {
  assert.equal(normalizeArabic('  خـــبز   جديد '), 'خبز جديد');
});
test('exact policy canonicalises shadda/vowel typing order', () => {
  assert.equal(normalizeArabic('جَرَّة'), normalizeArabic('جَرَّة'.replace('\u064E\u0651', '\u0651\u064E'))); // fatha+shadda vs shadda+fatha
  assert.equal(canonicalMarks('ب\u064E\u0651'), 'ب\u0651\u064E');
});
test('lenient-tashkeel drops marks but keeps hamza letters distinct', () => {
  assert.equal(normalizeArabic('خُبْز', 'lenient-tashkeel'), 'خبز');
  assert.notEqual(normalizeArabic('أَخ', 'lenient-tashkeel'), normalizeArabic('اخ', 'lenient-tashkeel'));
});
test('lenient-orthography unifies alef shapes only when explicitly chosen', () => {
  assert.equal(normalizeArabic('أَخ', 'lenient-orthography'), normalizeArabic('اخ', 'lenient-orthography'));
});
test('taa marbuta and haa stay distinct under every preset', () => {
  for (const p of ['exact', 'lenient-tashkeel', 'lenient-orthography']) {
    assert.notEqual(normalizeArabic('جَرَّة', p), normalizeArabic('جَرَّه', p));
  }
});
test('unknown policy fails loudly', () => {
  assert.throws(() => normalizeArabic('x', 'nope'), /Unknown normalization policy/);
});
test('stripTashkeel', () => assert.equal(stripTashkeel('مَاءٌ'), 'ماء'));

const short = { id: 't', type: 'short', answers: ['خُبْز'], policy: 'lenient-tashkeel', rationale: 'r' };
test('short answer accepts unvowelled input under lenient policy', () => {
  assert.equal(evaluate(short, 'خبز').correct, true);
  assert.equal(evaluate(short, ' خُبْز ').correct, true);
});
test('short answer flags a one-letter slip as typo, not as wrong-concept', () => {
  const r = evaluate(short, 'خبر');
  assert.equal(r.correct, false);
  assert.equal(r.typo, true);
});
test('short answer: unrelated word is wrong and not a typo', () => {
  const r = evaluate(short, 'ماء');
  assert.equal(r.correct, false);
  assert.equal(!!r.typo, false);
});
test('short answer: empty is reported as empty', () => assert.equal(evaluate(short, '  ').empty, true));
test('exact short answer rejects missing vowels', () => {
  const ex = { ...short, policy: 'exact' };
  assert.equal(evaluate(ex, 'خبز').correct, false);
});
