// Content validation (KM-011, KM-050, KM-112): schema + cross-reference checks with actionable, ID-addressed messages.
import { LEXICON } from './lexicon.js';
import { CHALLENGES, PRACTICE_POOL } from './challenges.js';
import { QUESTS, ITEMS, CLUES } from './quests.js';
import { DIALOGUES } from './dialogues.js';
import { STAGE_MORNING } from './stage1.js';
import { OBJECTIVE_TYPES } from '../quests/engine.js';
import { CHALLENGE_TYPES } from '../learning/challenges.js';
import { POLICIES } from '../learning/normalize.js';
import { compileStage, emitsOf } from '../world/level.js';
import { validateStage } from '../world/validate.js';
import { nodeTargets } from '../quests/dialogue.js';

export const REVIEW_STATUSES = ['draft', 'reviewed', 'disputed', 'derived'];
export const PRD_TARGETS = { lexicon: 150, nahwu: 60, sarf: 40, integrated: 20 };
const EFFECT_KEYS = ['flag', 'start', 'give', 'take', 'deliver', 'pay', 'discover', 'clue', 'pack', 'toast', 'event'];

export function validateContent(content = { LEXICON, CHALLENGES, QUESTS, ITEMS, CLUES, DIALOGUES, STAGES: [STAGE_MORNING], PRACTICE_POOL }) {
  const errors = [], warnings = [];
  const E = (m) => errors.push(m), W = (m) => warnings.push(m);
  const lexIds = new Set(), chIds = new Set();

  for (const e of content.LEXICON) {
    if (lexIds.has(e.id)) E(`Lexicon: duplicate id ${e.id}`); lexIds.add(e.id);
    for (const k of ['ar', 'gloss', 'pos', 'topic']) if (!e[k]) E(`Lexicon ${e.id}: missing ${k}`);
    if (!REVIEW_STATUSES.includes(e.review?.status)) E(`Lexicon ${e.id}: invalid review status`);
    if (e.review?.status === 'reviewed' && !(e.review.reviewer && e.review.date)) E(`Lexicon ${e.id}: marked reviewed without reviewer/date`);
  }
  const byPlain = new Map();
  for (const e of content.LEXICON) {
    const k = e.plain + '|' + e.gloss; if (byPlain.has(k)) W(`Lexicon: ${e.id} duplicates ${byPlain.get(k)}`); byPlain.set(k, e.id);
  }
  const byAr = new Map();
  for (const e of content.LEXICON) { if (byAr.has(e.ar)) W(`Lexicon: identical Arabic in ${e.id} and ${byAr.get(e.ar)} (check intentional)`); byAr.set(e.ar, e.id); }

  for (const c of content.CHALLENGES) {
    const at = `Challenge ${c.id}`;
    if (chIds.has(c.id)) E(`${at}: duplicate id`); chIds.add(c.id);
    if (!CHALLENGE_TYPES.includes(c.type)) E(`${at}: unsupported type ${c.type}`);
    for (const k of ['strand', 'topic', 'prompt', 'rationale']) if (!c[k]) E(`${at}: missing ${k}`);
    if (!Number.isInteger(c.difficulty)) E(`${at}: difficulty must be an integer`);
    if (!REVIEW_STATUSES.includes(c.review?.status)) E(`${at}: invalid review status`);
    if (c.review?.status === 'reviewed' && !(c.review.reviewer && c.review.date)) E(`${at}: marked reviewed without reviewer/date`);
    if (!c.provenance?.kind) E(`${at}: missing provenance`);
    if (!c.hints?.length) W(`${at}: no hint path`);
    for (const l of [...(c.lex || []), ...(c.prerequisites || [])]) if (!lexIds.has(l)) E(`${at}: unknown lexicon ref ${l}`);
    if (c.type === 'choice') {
      const ids = (c.options || []).map((o) => o.id);
      if (ids.length < 2) E(`${at}: needs ≥2 options`);
      if (new Set(ids).size !== ids.length) E(`${at}: duplicate option ids`);
      if (!ids.includes(c.answer)) E(`${at}: answer "${c.answer}" is not an option`);
      const labels = (c.options || []).map((o) => (o.ar || '') + '|' + (o.text || ''));
      if (new Set(labels).size !== labels.length) E(`${at}: two options have identical content`);
      for (const k of Object.keys(c.optionFeedback || {})) if (!ids.includes(k)) E(`${at}: feedback for unknown option ${k}`);
      for (const o of c.options || []) if (!o.ar && !o.text) E(`${at}: option ${o.id} is empty`);
    } else if (c.type === 'order') {
      const toks = (c.tokens || []).map((t) => t.id);
      for (const a of c.answers || [c.answer]) {
        if (!a || [...a].sort().join() !== [...toks].sort().join()) E(`${at}: an answer is not a permutation of the tokens`);
      }
    } else if (c.type === 'short') {
      if (!c.answers?.length) E(`${at}: missing answers`);
      if (c.policy && !POLICIES[c.policy]) E(`${at}: unknown normalization policy ${c.policy}`);
    }
  }
  for (const id of content.PRACTICE_POOL) if (!chIds.has(id)) E(`Practice pool references unknown challenge ${id}`);

  const itemIds = new Set(Object.keys(content.ITEMS));
  for (const [id, it] of Object.entries(content.ITEMS)) if (it.lex && !lexIds.has(it.lex)) E(`Item ${id}: unknown lexicon ref ${it.lex}`);
  const stage = content.STAGES[0];
  const npcIds = new Set(stage.npcs.map((n) => n.id));
  const inspectIds = new Set(stage.interactables.filter((i) => i.kind === 'inspect').map((i) => i.id));
  const areaIds = new Set(stage.areas.map((a) => a.id));

  // quests
  const qIds = new Set();
  for (const q of content.QUESTS) {
    if (qIds.has(q.id)) E(`Quest ${q.id}: duplicate`); qIds.add(q.id);
    const oIds = new Set();
    for (const o of q.objectives) {
      const at = `Quest ${q.id}/${o.id}`;
      if (oIds.has(o.id)) E(`${at}: duplicate objective id`); oIds.add(o.id);
      if (!OBJECTIVE_TYPES.includes(o.type)) E(`${at}: unknown objective type ${o.type}`);
      if (!o.text) E(`${at}: missing journal text`);
      const ok = {
        talk: npcIds.has(o.target), inspect: inspectIds.has(o.target), collect: itemIds.has(o.target),
        deliver: npcIds.has(o.target), answer: chIds.has(o.target) || o.target === 'practice.round',
        reach: areaIds.has(o.target), activate: true, unlock: true, survive: true, boss: true,
      }[o.type];
      if (!ok) E(`${at}: target "${o.target}" does not exist for type ${o.type}`);
    }
    for (const o of q.objectives) for (const r of o.requires || []) if (!oIds.has(r)) E(`Quest ${q.id}/${o.id}: requires unknown objective ${r}`);
    for (const r of q.startsWhen?.quests || []) if (!content.QUESTS.some((x) => x.id === r)) E(`Quest ${q.id}: startsWhen unknown quest ${r}`);
    if (!q.autoStart && !stage.npcs.some((n) => (n.emits || []).some((e) => e.type === 'start' && e.target === q.id))) W(`Quest ${q.id}: never started by anything`);
  }

  // dialogue graphs + effect references + coverage of declared emits (keeps validator data honest)
  for (const [key, d] of Object.entries(content.DIALOGUES)) {
    const at = `Dialogue ${key}`;
    const npc = stage.npcs.find((n) => n.id === d.npc);
    if (!npc) { E(`${at}: unknown npc ${d.npc}`); continue; }
    if (npc.dialogue !== key) E(`${at}: npc ${d.npc} points at dialogue "${npc.dialogue}"`);
    const emits = emitsOf({ ...npc, kind: 'npc' });
    const has = (type, target) => emits.some((e) => e.type === type && e.target === target);
    const seen = new Set(d.entries.map((e) => e.node));
    for (const e of d.entries) if (!d.nodes[e.node]) E(`${at}: entry → missing node ${e.node}`);
    const queue = [...seen];
    while (queue.length) {
      const nid = queue.pop(); const n = d.nodes[nid]; if (!n) continue;
      for (const t of nodeTargets(n)) { if (!d.nodes[t]) E(`${at}/${nid}: → missing node ${t}`); else if (!seen.has(t)) { seen.add(t); queue.push(t); } }
    }
    for (const [nid, n] of Object.entries(d.nodes)) {
      if (!seen.has(nid)) W(`${at}/${nid}: unreachable node`);
      if (!n.challenge && !n.text) E(`${at}/${nid}: no text`);
      if (!n.challenge && !n.next && !n.end && !n.choices) E(`${at}/${nid}: dead end (no next/end/choices)`);
      if (n.ar && !n.text) W(`${at}/${nid}: Arabic line without Indonesian meaning`);
      for (const l of n.lex || []) if (!lexIds.has(l)) E(`${at}/${nid}: unknown lexicon ref ${l}`);
      if (n.challenge) {
        if (!chIds.has(n.challenge.id)) E(`${at}/${nid}: unknown challenge ${n.challenge.id}`);
        if (!has('answer', n.challenge.id)) E(`${at}/${nid}: challenge ${n.challenge.id} not declared in ${d.npc} emits`);
      }
      for (const c of n.choices || []) if (!c.end && !c.next) E(`${at}/${nid}: choice "${c.text}" has no destination`);
      const effs = [...(n.effects || []), ...(n.choices || []).flatMap((c) => c.effects || [])];
      for (const ef of effs) {
        const k = Object.keys(ef)[0];
        if (!EFFECT_KEYS.includes(k)) { E(`${at}/${nid}: unknown effect ${k}`); continue; }
        if (k === 'give' && !itemIds.has(ef.give.item)) E(`${at}/${nid}: give unknown item ${ef.give.item}`);
        if (k === 'deliver') { for (const i of ef.deliver.items) if (!itemIds.has(i)) E(`${at}/${nid}: deliver unknown item ${i}`); if (!has('deliver', ef.deliver.to)) E(`${at}/${nid}: deliver to ${ef.deliver.to} not declared in emits`); }
        if (k === 'clue' && !content.CLUES[ef.clue]) E(`${at}/${nid}: unknown clue ${ef.clue}`);
        if (k === 'start' && (!qIds.has(ef.start) || !has('start', ef.start))) E(`${at}/${nid}: start ${ef.start} unknown or undeclared`);
        if (k === 'flag' && !has('flag', ef.flag)) E(`${at}/${nid}: flag ${ef.flag} not declared in emits`);
      }
    }
  }
  for (const n of stage.npcs) if (n.dialogue && !content.DIALOGUES[n.dialogue]) E(`NPC ${n.id}: dialogue "${n.dialogue}" missing`);
  for (const s of stage.interactables) {
    for (const l of [].concat(s.lex || [])) if (l && !lexIds.has(l)) E(`Interactable ${s.id}: unknown lexicon ref ${l}`);
    if (s.item && !itemIds.has(s.item)) E(`Interactable ${s.id}: unknown item ${s.item}`);
  }
  for (const c of Object.values(content.CLUES)) if (!c.ar || !c.text) E('Clue with missing text');

  // levels
  const levels = {};
  for (const st of content.STAGES) {
    const lvl = compileStage(st);
    const r = validateStage(lvl, content.QUESTS);
    levels[st.id] = { reachedTiles: r.reachedTiles };
    r.errors.forEach((m) => E(`Stage ${st.id}: ${m}`)); r.warnings.forEach((m) => W(`Stage ${st.id}: ${m}`));
  }

  const count = (f) => content.CHALLENGES.filter(f).length;
  const inventory = {
    lexicon: content.LEXICON.length,
    nahwu: count((c) => c.strand === 'nahwu'), sarf: count((c) => c.strand === 'sarf'), integrated: count((c) => c.strand === 'integrated'),
    vocabChallenges: count((c) => c.strand === 'vocab'),
    reviewed: content.LEXICON.filter((e) => e.review.status === 'reviewed').length + content.CHALLENGES.filter((c) => c.review.status === 'reviewed').length,
    draft: content.LEXICON.filter((e) => e.review.status === 'draft').length + content.CHALLENGES.filter((c) => c.review.status === 'draft').length,
  };
  return { errors, warnings, inventory, levels };
}
