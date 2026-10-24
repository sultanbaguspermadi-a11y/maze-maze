// Lexicon progress + deterministic spaced review (KM-056).
// States describe OBSERVED in-game performance only; discovery alone never counts as mastery.
export const STATES = ['unseen', 'discovered', 'recalled', 'reversed', 'contextual', 'mastered'];
export const STATE_LABEL = {
  unseen: 'Belum ditemui', discovered: 'Ditemukan', recalled: 'Diingat',
  reversed: 'Dua arah', contextual: 'Dalam konteks', mastered: 'Dikuasai',
};
const INTERVALS = [0, 0, 1, 3, 7, 14]; // days by Leitner box 1..5

export function newEntry(day) {
  return { seen: day, box: 0, due: null, fwd: 0, rev: 0, ctx: 0, wrong: 0, spaced: 0, lastDay: day, weak: false };
}

export function discover(progress, id, day) {
  if (!progress[id]) { progress[id] = newEntry(day); return true; }
  return false;
}

export function stateOf(e) {
  if (!e) return 'unseen';
  if (e.spaced >= 2 && e.rev >= 1 && e.ctx >= 1 && e.box >= 4) return 'mastered';
  if (e.ctx >= 1) return 'contextual';
  if (e.rev >= 1) return 'reversed';
  if (e.fwd >= 1) return 'recalled';
  return 'discovered';
}

// direction: 'forward' | 'reverse' | 'context'
export function recordAnswer(progress, id, { correct, direction = 'forward', day }) {
  let e = progress[id];
  if (!e) { e = progress[id] = newEntry(day); }
  const wasDue = e.due !== null && day >= e.due && day > e.lastDay;
  if (correct) {
    if (direction === 'reverse') e.rev++; else if (direction === 'context') e.ctx++; else e.fwd++;
    if (wasDue) e.spaced++;
    e.box = Math.min(5, Math.max(1, e.box + 1));
    e.weak = false;
  } else {
    e.wrong++; e.box = 1; e.weak = true;
  }
  e.due = day + INTERVALS[e.box];
  e.lastDay = day;
  return stateOf(e);
}

export function isDue(e, day) { return !!e && (e.weak || (e.due !== null && day >= e.due)); }

// Weak items first, then oldest-due. Stable + deterministic.
export function dueItems(progress, day) {
  return Object.keys(progress)
    .filter((id) => isDue(progress[id], day))
    .sort((a, b) => {
      const A = progress[a], B = progress[b];
      if (A.weak !== B.weak) return A.weak ? -1 : 1;
      return (A.due ?? 0) - (B.due ?? 0) || a.localeCompare(b);
    });
}

export function pickReview(progress, day, n, allIds) {
  const due = dueItems(progress, day);
  const rest = allIds.filter((id) => progress[id] && !due.includes(id))
    .sort((a, b) => (progress[a].fwd + progress[a].rev) - (progress[b].fwd + progress[b].rev) || a.localeCompare(b));
  return due.concat(rest).slice(0, n);
}
