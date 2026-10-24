import test from 'node:test';
import assert from 'node:assert/strict';
import { compileStage, makeCollider, reachableTiles, anchorOf, PLAYER_BOX, INTERACT_REACH, tileCenter } from '../src/world/level.js';
import { validateStage } from '../src/world/validate.js';
import { STAGE_MORNING } from '../src/content/stage1.js';
import { QUESTS } from '../src/content/quests.js';
import { validateContent } from '../src/content/schema.js';

const legend = { '#': { solid: true }, '.': {} };
const mk = (rows, extra = {}) => compileStage({ id: 't', tile: 16, grid: rows, legend, spawn: { x: 1, y: 1 }, areas: [], props: [], npcs: [], interactables: [], triggers: [], gates: [], ...extra });
const Q = (objectives, extra = {}) => [{ id: 'q', title: 'q', main: true, autoStart: true, objectives, ...extra }];

test('authored Morning Market passes full level + quest validation with no errors', () => {
  const r = validateStage(compileStage(STAGE_MORNING), QUESTS);
  assert.deepEqual(r.errors, []);
});
test('all authored content validates (schema + cross references)', () => {
  assert.deepEqual(validateContent().errors, []);
});
test('fixture: spawn on a wall is rejected', () => {
  const r = validateStage(mk(['###', '#.#', '###'], { spawn: { x: 0, y: 0 } }), []);
  assert.ok(r.errors.some((e) => /Spawn .* blocked/.test(e)));
});
test('fixture: required objective behind a never-opening gate is a soft-lock error', () => {
  const lvl = mk(['#####', '#.G.#', '#####'].map((r) => r.replace('G', '.')), {
    gates: [{ id: 'g', x: 2, y: 1, w: 1, h: 1, opensWhen: { flag: 'never' } }],
    interactables: [{ id: 'sign', kind: 'inspect', x: 3, y: 1 }],
  });
  const r = validateStage(lvl, Q([{ id: 'o', type: 'inspect', target: 'sign' }]));
  assert.ok(r.errors.some((e) => /can never complete/.test(e)), r.errors.join('\n'));
  assert.ok(r.errors.some((e) => /Gate g never opens/.test(e)));
});
test('fixture: a key placed behind the gate it unlocks is detected', () => {
  const lvl = mk(['######', '#....#', '######'], {
    spawn: { x: 1, y: 1 },
    gates: [{ id: 'g', x: 2, y: 1, w: 1, h: 1, opensWhen: { flag: 'has_key' } }],
    interactables: [{ id: 'key', kind: 'pickup', x: 4, y: 1, item: 'item.k' }],
  });
  const r = validateStage(lvl, Q([{ id: 'o', type: 'collect', target: 'item.k', grants: ['has_key'] }]));
  assert.ok(r.errors.some((e) => /soft-lock/.test(e)));
});
test('fixture: the same key in front of the gate passes', () => {
  const lvl = mk(['######', '#....#', '######'], {
    spawn: { x: 3, y: 1 },
    gates: [{ id: 'g', x: 2, y: 1, w: 1, h: 1, opensWhen: { flag: 'has_key' } }],
    interactables: [{ id: 'key', kind: 'pickup', x: 4, y: 1, item: 'item.k' }, { id: 'door', kind: 'inspect', x: 1, y: 1 }],
  });
  const r = validateStage(lvl, Q([{ id: 'o', type: 'collect', target: 'item.k', grants: ['has_key'] }, { id: 'p', type: 'inspect', target: 'door', requires: ['o'] }]));
  assert.deepEqual(r.errors, []);
});
test('fixture: unreachable required trigger and overlapping solid props are reported', () => {
  const lvl = mk(['#####', '#.#.#', '#####'], {
    triggers: [{ id: 'exit', rect: { x: 3, y: 1, w: 1, h: 1 }, required: true, emits: [] }],
    props: [{ id: 'a', type: 'crate', x: 1, y: 1, w: 1, h: 1 }, { id: 'b', type: 'crate', x: 1, y: 1, w: 1, h: 1 }],
  });
  const r = validateStage(lvl, []);
  assert.ok(r.errors.some((e) => /Trigger exit is unreachable/.test(e)));
  assert.ok(r.errors.some((e) => /overlap/.test(e)));
});
test('fixture: diagonal or blocked wanderer routes are rejected', () => {
  const lvl = mk(['#####', '#...#', '#.#.#', '#...#', '#####'], { wanderers: [{ id: 'w', path: [[1, 1], [3, 3]] }, { id: 'w2', path: [[1, 1], [1, 3]] }, { id: 'w3', path: [[1, 2], [3, 2]] }] });
  const r = validateStage(lvl, []);
  assert.ok(r.errors.some((e) => /Wanderer w segment .* diagonal/.test(e)));
  assert.ok(r.errors.some((e) => /Wanderer w3 .* blocked/.test(e)));
});
test('fixture: unknown tile characters are reported', () => {
  const r = validateStage(mk(['###', '#?#', '###']), []);
  assert.ok(r.errors.some((e) => /Unknown tile character/.test(e)));
});

test('collision: walls block, sliding along walls works, no tunnelling at high speed', () => {
  const lvl = mk(['#####', '#...#', '#####']);
  const c = makeCollider(lvl);
  const start = { x: 24, y: 24 };
  const p = c.move(start, 400, 0);
  assert.ok(p.x < 4 * 16 && p.x > 3 * 16 - 6, 'stopped before the east wall');
  const q = c.move(start, 10, 100);
  assert.ok(q.y <= 32 && q.x > 24, 'slides along the wall on the free axis');
});
test('closed gate blocks and open gate lets the player through', () => {
  const lvl = mk(['#####', '#...#', '#####'], { gates: [{ id: 'g', x: 2, y: 1, w: 1, h: 1, opensWhen: { flag: 'f' } }] });
  let open = false;
  const c = makeCollider(lvl, () => open);
  const p0 = c.move({ x: 24, y: 24 }, 40, 0);
  assert.ok(p0.x < 32, 'blocked by the gate');
  open = true;
  assert.ok(c.move({ x: 24, y: 24 }, 40, 0).x > 40, 'passes once open');
});

// ---- physics walkthrough: the BFS validator and the real collider must agree ----
function pathTo(lvl, from, goalTiles, open) {
  const { w, h } = lvl; const col = makeCollider(lvl, open);
  const prev = new Map([[from.y * w + from.x, null]]); const q = [[from.x, from.y]];
  while (q.length) {
    const [x, y] = q.shift();
    if (goalTiles(x, y)) { const out = []; let k = y * w + x; while (k !== null) { out.push([k % w, Math.floor(k / w)]); k = prev.get(k); } return out.reverse(); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * w + nx;
      if (col.blockedTile(nx, ny) || prev.has(k)) continue;
      prev.set(k, y * w + x); q.push([nx, ny]);
    }
  }
  return null;
}
function walk(lvl, col, pos, path) {
  for (const [tx, ty] of path.slice(1)) {
    const c = tileCenter(lvl.T, tx, ty);
    for (let i = 0; i < 400 && Math.hypot(c.x - pos.x, c.y - pos.y) > 1.5; i++) {
      const dx = c.x - pos.x, dy = c.y - pos.y, d = Math.hypot(dx, dy), s = Math.min(2, d);
      pos = col.move(pos, (dx / d) * s, (dy / d) * s);
    }
    assert.ok(Math.hypot(c.x - pos.x, c.y - pos.y) <= 1.5, `physics got stuck before tile ${tx},${ty}`);
  }
  return pos;
}
test('physics bot can walk the real collider to every NPC, interactable and the exit', () => {
  const lvl = compileStage(STAGE_MORNING);
  const open = () => true; // gate open: a player can only be here after delivering the order
  const col = makeCollider(lvl, open);
  const sources = [...lvl.npcs.map((n) => ({ ...n, kind: 'npc' })), ...lvl.interactables];
  for (const s of sources) {
    const a = anchorOf(lvl, s);
    const path = pathTo(lvl, lvl.spawn, (x, y) => Math.hypot(tileCenter(16, x, y).x - a.x, tileCenter(16, x, y).y - a.y) <= INTERACT_REACH, open);
    assert.ok(path, `no path to ${s.id}`);
    const end = walk(lvl, col, tileCenter(16, lvl.spawn.x, lvl.spawn.y), path);
    assert.ok(Math.hypot(end.x - a.x, end.y - a.y) <= INTERACT_REACH + 8, `${s.id} not within reach after walking`);
  }
  const t = lvl.triggers[0].rect;
  const path = pathTo(lvl, lvl.spawn, (x, y) => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h, open);
  assert.ok(path); walk(lvl, col, tileCenter(16, lvl.spawn.x, lvl.spawn.y), path);
});
test('before the order is delivered the curtain gate truly blocks the exit', () => {
  const lvl = compileStage(STAGE_MORNING);
  const reach = reachableTiles(lvl, lvl.spawn, () => false);
  const t = lvl.triggers[0].rect;
  assert.equal(reach[t.y * lvl.w + t.x], 0);
});
test('player box fits through every one-tile corridor assumption', () => { assert.ok(PLAYER_BOX.w < 16 && PLAYER_BOX.h < 16); });
