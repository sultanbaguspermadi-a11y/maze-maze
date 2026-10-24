// Automatic level validation (KM-031): bounds, overlaps, reachability, soft-locks and
// quest-state simulation. Walks the quest graph the way a player could: each pass opens gates whose
// flags are set, floods the reachable area, fires every reachable source's events whose conditions hold,
// and repeats until nothing changes. Anything left undone is a soft-lock (error) or unreachable extra (warning).
import { INTERACT_REACH, anchorOf, emitsOf, makeCollider, reachableTiles, tileCenter } from './level.js';
import { QuestEngine, evalAll } from '../quests/engine.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function reachesAnchor(level, reach, anchor) {
  const { w, h, T } = level;
  const r = Math.ceil(INTERACT_REACH / T) + 1;
  const ax = Math.floor(anchor.x / T), ay = Math.floor(anchor.y / T);
  for (let y = Math.max(0, ay - r); y <= Math.min(h - 1, ay + r); y++) {
    for (let x = Math.max(0, ax - r); x <= Math.min(w - 1, ax + r); x++) {
      if (reach[y * w + x] && dist(tileCenter(T, x, y), anchor) <= INTERACT_REACH) return true;
    }
  }
  return false;
}

function rectReached(level, reach, rect) {
  for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) {
    if (reach[y * level.w + x]) return true;
  }
  return false;
}

export function validateStage(level, questDefs) {
  const errors = [], warnings = [];
  const E = (m) => errors.push(m), W = (m) => warnings.push(m);
  const { w, h, def } = level;
  level.issues.forEach(E);

  const inMap = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const ids = new Set();
  const uniq = (id, what) => { if (ids.has(id)) E(`Duplicate id "${id}" (${what})`); ids.add(id); };

  const col0 = makeCollider(level, () => false);
  const spawn = level.spawn;
  if (!spawn || !inMap(spawn.x, spawn.y)) E('Spawn is missing or outside the map');
  else if (col0.blockedTile(spawn.x, spawn.y)) E(`Spawn ${spawn.x},${spawn.y} is on a blocked tile`);

  for (const p of level.props) {
    uniq(p.id, 'prop');
    if (!inMap(p.x, p.y) || !inMap(p.x + p.w - 1, p.y + p.h - 1)) E(`Prop ${p.id} extends outside the map`);
  }
  // Solid props must not overlap each other (visual + collision ambiguity).
  const solidProps = level.props.filter((p) => p.solid !== false);
  for (let i = 0; i < solidProps.length; i++) for (let j = i + 1; j < solidProps.length; j++) {
    const a = solidProps[i], b = solidProps[j];
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) E(`Solid props ${a.id} and ${b.id} overlap`);
  }
  for (const p of solidProps) {
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
      if (inMap(x, y) && def.legend[def.grid[y][x]]?.solid) W(`Solid prop ${p.id} sits on a wall tile at ${x},${y}`);
    }
  }
  for (const n of level.npcs) {
    uniq(n.id, 'npc');
    if (!inMap(n.x, n.y)) E(`NPC ${n.id} outside the map`);
    if (spawn && n.x === spawn.x && n.y === spawn.y) E(`NPC ${n.id} stands on the spawn tile`);
  }
  for (const s of level.interactables) uniq(s.id, 'interactable');
  for (const g of level.gates) {
    uniq(g.id, 'gate');
    for (const [x, y] of g.tiles) if (!inMap(x, y)) E(`Gate ${g.id} tile ${x},${y} outside the map`);
  }
  for (const a of level.areas) {
    if (!inMap(a.rect.x, a.rect.y) || !inMap(a.rect.x + a.rect.w - 1, a.rect.y + a.rect.h - 1)) E(`Area ${a.id} outside the map`);
  }

  // Wanderer patrols: every tile along each straight segment must be walkable.
  for (const wd of level.wanderers) {
    for (let i = 0; i < wd.path.length; i++) {
      const [x, y] = wd.path[i];
      if (col0.blockedTile(x, y)) E(`Wanderer ${wd.id} waypoint ${x},${y} is blocked`);
      const [nx, ny] = wd.path[(i + 1) % wd.path.length];
      if (x !== nx && y !== ny) E(`Wanderer ${wd.id} segment ${i} is diagonal (use axis-aligned segments)`);
      for (let tx = Math.min(x, nx); tx <= Math.max(x, nx); tx++) for (let ty = Math.min(y, ny); ty <= Math.max(y, ny); ty++) {
        if (col0.blockedTile(tx, ty)) E(`Wanderer ${wd.id} segment ${i} crosses blocked tile ${tx},${ty}`);
      }
    }
  }

  // ---- Quest-state reachability simulation ---------------------------------
  const sources = [
    ...level.npcs.map((n) => ({ ...n, kind: 'npc' })),
    ...level.interactables,
  ].map((s) => ({ src: s, anchor: anchorOf(level, s), emits: emitsOf(s) }));

  const engine = new QuestEngine(questDefs);
  const inv = {};
  const gateOpen = (gid) => {
    const g = level.gates.find((x) => x.id === gid);
    return !!g && !!g.opensWhen && engine.hasFlag(g.opensWhen.flag);
  };
  let reach = reachableTiles(level, spawn, gateOpen);
  const snapshot = () => JSON.stringify([engine.serialize(), inv]);
  let before = '';
  for (let pass = 0; pass < 200 && snapshot() !== before; pass++) {
    before = snapshot();
    reach = reachableTiles(level, spawn, gateOpen);
    for (const s of sources) {
      if (!reachesAnchor(level, reach, s.anchor)) continue;
      for (const e of s.emits) {
        if (!evalAll(e.when, engine, inv)) continue;
        if (e.type === 'flag') engine.setFlag(e.target);
        else if (e.type === 'start') engine.startQuest(e.target);
        else {
          if (e.type === 'collect') inv[e.target] = (inv[e.target] || 0) + 1;
          engine.emit(e);
        }
      }
    }
    for (const t of level.triggers) {
      if (!rectReached(level, reach, t.rect)) continue;
      for (const e of t.emits || []) if (evalAll(e.when, engine, inv)) engine.emit(e);
    }
  }

  const targeted = new Set();
  for (const d of questDefs) for (const o of d.objectives) targeted.add(o.target);
  for (const d of questDefs) {
    for (const o of d.objectives) {
      if (engine.isDone(d.id, o.id)) continue;
      const msg = `Objective ${d.id}/${o.id} (${o.type} → ${o.target}) can never complete`;
      if (o.optional || !d.main && d.optional) W(msg + ' [optional]'); else E(msg + ' — soft-lock');
    }
    if (d.main && engine.status(d.id) !== 'complete') E(`Main quest ${d.id} cannot be completed (status ${engine.status(d.id)})`);
  }
  for (const s of sources) {
    if (!reachesAnchor(level, reach, s.anchor)) {
      const needed = s.emits.some((e) => targeted.has(e.target));
      (needed ? E : W)(`Source ${s.src.id} is unreachable${needed ? ' but quests depend on it' : ''}`);
    }
  }
  for (const t of level.triggers) {
    if (!rectReached(level, reach, t.rect)) (t.required ? E : W)(`Trigger ${t.id} is unreachable${t.required ? ' (required)' : ''}`);
  }
  // A closed gate must be opened by a flag that something can actually grant.
  for (const g of level.gates) {
    if (!g.opensWhen || !engine.hasFlag(g.opensWhen.flag)) E(`Gate ${g.id} never opens (flag ${g.opensWhen?.flag})`);
  }
  return { errors, warnings, reachedTiles: reach.reduce((a, v) => a + v, 0) };
}
