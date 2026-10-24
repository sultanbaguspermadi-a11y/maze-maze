// Challenge runtime (KM-053): pure evaluation of a response against authored data.
// Types: choice | order | short. Returns structured feedback; the UI decides presentation.
import { normalizeArabic, levenshtein, stripTashkeel } from './normalize.js';
import { mulberry32, hashString, shuffle } from '../core/util.js';

export const CHALLENGE_TYPES = ['choice', 'order', 'short'];

export function evaluate(ch, response) {
  switch (ch.type) {
    case 'choice': return evalChoice(ch, response);
    case 'order': return evalOrder(ch, response);
    case 'short': return evalShort(ch, response);
    default: throw new Error(`Unsupported challenge type: ${ch.type} (${ch.id})`);
  }
}

function evalChoice(ch, optionId) {
  const opt = ch.options.find((o) => o.id === optionId);
  if (!opt) return { correct: false, invalid: true, feedback: '' };
  const correct = optionId === ch.answer;
  return {
    correct,
    feedback: correct ? ch.rationale : (ch.optionFeedback?.[optionId] || ch.rationale),
    expected: ch.answer,
  };
}

function evalOrder(ch, ids) {
  const accepted = ch.answers || [ch.answer];
  const got = Array.isArray(ids) ? ids.join('|') : '';
  const correct = accepted.some((a) => a.join('|') === got);
  return { correct, feedback: ch.rationale, expected: accepted[0] };
}

function evalShort(ch, text) {
  const policy = ch.policy || 'exact';
  const got = normalizeArabic(text, policy);
  if (!got) return { correct: false, empty: true, feedback: '' };
  const answers = ch.answers.map((a) => normalizeArabic(a, policy));
  if (answers.includes(got)) return { correct: true, feedback: ch.rationale, expected: ch.answers[0] };
  // Distinguish a probable typo from a wrong answer (compare letters only).
  const gl = stripTashkeel(got);
  const near = answers.some((a) => {
    const al = stripTashkeel(a);
    return al.length > 2 && levenshtein(gl, al) === 1;
  });
  return { correct: false, typo: near, feedback: near ? '' : ch.rationale, expected: ch.answers[0] };
}

export function hintFor(ch, level) {
  const hints = ch.hints || [];
  return level >= 0 && level < hints.length ? hints[level] : null;
}

// Deterministic option order so the correct answer isn't always first.
export function shuffledOptions(ch, seed = 0) {
  const rng = mulberry32(hashString(ch.id) ^ seed);
  return shuffle(ch.options, rng);
}
export function shuffledTokens(ch, seed = 0) {
  const rng = mulberry32(hashString(ch.id) ^ (seed + 7));
  return shuffle(ch.tokens, rng);
}

// ---- Generated review items (adaptive review, KM-056) -------------------
// Built from lexicon entries; distractors come from the same topic so recall
// isn't solved by category. Marked generated:true and review.status 'derived'.
export function makeVocabChallenge(entry, lexicon, direction, seed = 0) {
  const rng = mulberry32(hashString(entry.id) ^ seed ^ (direction === 'reverse' ? 91 : 13));
  const pool = lexicon.filter((e) => e.id !== entry.id && e.topic === entry.topic);
  const fallback = lexicon.filter((e) => e.id !== entry.id && e.pos === entry.pos);
  const distract = shuffle(pool.length >= 3 ? pool : pool.concat(fallback), rng)
    .filter((e, i, a) => a.findIndex((x) => x.gloss === e.gloss) === i && e.gloss !== entry.gloss)
    .slice(0, 3);
  const fwd = direction !== 'reverse';
  const opts = shuffle([entry, ...distract], rng).map((e, i) => ({
    id: 'o' + i, ar: fwd ? undefined : e.ar, text: fwd ? e.gloss : undefined, _e: e.id,
  }));
  const answer = opts.find((o) => o._e === entry.id).id;
  return {
    id: `gen.${direction}.${entry.id}`, v: 1, type: 'choice', generated: true,
    stage: entry.stage, topic: entry.topic, difficulty: 1, direction: fwd ? 'forward' : 'reverse',
    lex: [entry.id],
    prompt: fwd ? 'Apa arti kata ini?' : `Pilih kata Arab untuk: “${entry.gloss}”`,
    ar: fwd ? entry.ar : undefined,
    options: opts.map(({ _e, ...o }) => o), answer,
    rationale: `${entry.ar} = ${entry.gloss}.`,
    hints: [`Kategori: ${entry.topic.replace('vocab.', '')}.`],
    review: { status: 'derived' },
  };
}
