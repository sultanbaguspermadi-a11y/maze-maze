// Data-driven dialogue helpers (KM-041). A dialogue spec is
// { npc, entries:[{when:[cond], node}], nodes:{ id:{ speaker?, ar, text, lex?, effects?, choices?, challenge?, next?, end? } } }
import { evalAll } from './engine.js';

export function pickEntry(spec, engine, inv) {
  const hit = spec.entries.find((e) => evalAll(e.when, engine, inv));
  return hit ? hit.node : null;
}

export function visibleChoices(node, engine, inv) {
  return (node.choices || [])
    .map((c, index) => ({ ...c, index }))
    .filter((c) => evalAll(c.when, engine, inv));
}

// All node ids referenced from a node (for graph validation).
export function nodeTargets(node) {
  const t = [];
  if (node.next) t.push(node.next);
  for (const c of node.choices || []) if (c.next) t.push(c.next);
  if (node.challenge) { t.push(node.challenge.onCorrect); t.push(node.challenge.onWrong); }
  return t;
}
