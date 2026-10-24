// Arabic normalization with EXPLICIT per-exercise policies (KM-051).
// A policy never silently equates letters an exercise might be testing:
// every equivalence is a named flag, and presets are the only shortcuts.

const TASHKEEL = /[\u064B-\u065F\u0670]/g; // fathatan…sukun, extended marks, dagger alef
const TATWEEL = /\u0640/g;
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g; // آ أ إ ٱ
const SHADDA = '\u0651';

export const POLICIES = Object.freeze({
  // Keeps every diacritic and letter; only removes tatweel, collapses spaces,
  // and canonicalises the typing ORDER of marks (shadda before vowel).
  exact: { collapseSpace: true, stripTatweel: true },
  // Typed answers may omit short vowels/shadda. Letters stay distinct (أ ≠ ا).
  'lenient-tashkeel': { collapseSpace: true, stripTatweel: true, stripTashkeel: true },
  // Also unify alef shapes. Only for vocabulary typing, never for hamza/orthography tests.
  'lenient-orthography': {
    collapseSpace: true, stripTatweel: true, stripTashkeel: true, unifyAlef: true,
  },
});

export function resolvePolicy(p) {
  if (typeof p === 'string') {
    const found = POLICIES[p];
    if (!found) throw new Error(`Unknown normalization policy: ${p}`);
    return found;
  }
  return p || POLICIES.exact;
}

export function stripTashkeel(s) {
  return String(s).replace(TASHKEEL, '');
}

const markRank = (ch) => {
  if (ch === SHADDA) return 0;
  if (ch === '\u0670') return 2;
  return 1;
};

// Reorders combining marks after each base letter into a canonical order so
// shadda+vowel typed in either order compares equal.
export function canonicalMarks(s) {
  const out = [];
  let marks = [];
  const flush = () => {
    if (marks.length) {
      marks.sort((a, b) => markRank(a) - markRank(b));
      out.push(...marks);
      marks = [];
    }
  };
  for (const ch of String(s)) {
    if (/[\u064B-\u065F\u0670]/.test(ch)) marks.push(ch);
    else { flush(); out.push(ch); }
  }
  flush();
  return out.join('');
}

export function normalizeArabic(s, policy = 'exact') {
  const p = resolvePolicy(policy);
  let t = String(s ?? '').normalize('NFC');
  if (p.stripTatweel) t = t.replace(TATWEEL, '');
  if (p.stripTashkeel) t = t.replace(TASHKEEL, '');
  else t = canonicalMarks(t);
  if (p.unifyAlef) t = t.replace(ALEF_VARIANTS, '\u0627');
  if (p.unifyYaa) t = t.replace(/\u0649/g, '\u064A');
  if (p.unifyTaaMarbuta) t = t.replace(/\u0629/g, '\u0647');
  if (p.collapseSpace) t = t.replace(/\s+/g, ' ').trim();
  return t;
}

export function levenshtein(a, b) {
  const A = [...a], B = [...b];
  const dp = Array.from({ length: A.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= B.length; j++) dp[0][j] = j;
  for (let i = 1; i <= A.length; i++) {
    for (let j = 1; j <= B.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[A.length][B.length];
}
