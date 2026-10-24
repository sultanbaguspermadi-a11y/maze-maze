// Authored level format → compiled level (KM-030). Positions in the stage definition are in tiles.
// The collision model is a tile bitmap (walls + solid prop footprints + solid NPC tiles + closed gates),
// so physics, pathfinding and validation all agree.
export const TILE = 16;
export const PLAYER_BOX = { w: 10, h: 6 };   // collision box at the feet; position = feet centre
export const INTERACT_REACH = 30;            // px, player centre → anchor (validator uses the same value)

export function compileStage(def) {
  const T = def.tile || TILE;
  const h = def.grid.length;
  const w = def.grid[0].length;
  def.grid.forEach((row, i) => {
    if (row.length !== w) throw new Error(`Stage ${def.id}: grid row ${i} has width ${row.length}, expected ${w}`);
  });
  const legend = def.legend || {};
  const base = new Uint8Array(w * h);
  const level = {
    id: def.id, def, T, w, h, base, gateAt: new Map(), gates: [], areas: def.areas || [],
    props: def.props || [], foreground: def.foreground || [], npcs: def.npcs || [],
    interactables: def.interactables || [], triggers: def.triggers || [], wanderers: def.wanderers || [],
    spawn: def.spawn, issues: [],
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = def.grid[y][x];
      const L = legend[ch];
      if (!L) level.issues.push(`Unknown tile character "${ch}" at ${x},${y}`);
      else if (L.solid) base[y * w + x] = 1;
    }
  }
  for (const p of level.props) {
    if (p.solid === false) continue;
    const f = p.foot || { dx: 0, dy: 0, w: p.w, h: p.h };
    for (let yy = 0; yy < f.h; yy++) for (let xx = 0; xx < f.w; xx++) {
      const tx = p.x + f.dx + xx, ty = p.y + f.dy + yy;
      if (tx >= 0 && ty >= 0 && tx < w && ty < h) base[ty * w + tx] = 1;
      else level.issues.push(`Prop ${p.id} footprint outside map at ${tx},${ty}`);
    }
  }
  for (const n of level.npcs) {
    if (n.solid !== false && !n.behind) base[n.y * w + n.x] = 1;
  }
  for (const g of def.gates || []) {
    const tiles = [];
    for (let yy = 0; yy < g.h; yy++) for (let xx = 0; xx < g.w; xx++) {
      const tx = g.x + xx, ty = g.y + yy;
      tiles.push([tx, ty]);
      level.gateAt.set(ty * w + tx, g.id);
    }
    level.gates.push({ ...g, tiles });
  }
  return level;
}

export const tileCenter = (T, tx, ty) => ({ x: (tx + 0.5) * T, y: (ty + 0.5) * T });

// A collider closes over a gate-state callback so the same level works for every quest state.
export function makeCollider(level, isGateOpen = () => false) {
  const { w, h, base, gateAt, T } = level;
  const blockedTile = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= w || ty >= h) return true;
    const i = ty * w + tx;
    if (base[i]) return true;
    const g = gateAt.get(i);
    return g !== undefined && !isGateOpen(g);
  };
  const overlaps = (x, y, bw, bh) => {
    const x0 = Math.floor(x / T), x1 = Math.floor((x + bw - 1e-6) / T);
    const y0 = Math.floor(y / T), y1 = Math.floor((y + bh - 1e-6) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (blockedTile(tx, ty)) return true;
    return false;
  };
  // Move the feet-centre position (x,y) by (dx,dy); axes resolved separately in ≤4px sub-steps.
  const move = (pos, dx, dy) => {
    let { x, y } = pos;
    const bw = PLAYER_BOX.w, bh = PLAYER_BOX.h;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
    const sx = dx / steps, sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (sx && !overlaps(x + sx - bw / 2, y - bh, bw, bh)) x += sx;
      if (sy && !overlaps(x - bw / 2, y + sy - bh, bw, bh)) y += sy;
    }
    return { x, y };
  };
  const standable = (x, y) => !overlaps(x - PLAYER_BOX.w / 2, y - PLAYER_BOX.h, PLAYER_BOX.w, PLAYER_BOX.h);
  return { blockedTile, move, standable, overlaps };
}

// 4-connected flood fill over unblocked tiles.
export function reachableTiles(level, startTile, isGateOpen = () => false) {
  const { w, h } = level;
  const col = makeCollider(level, isGateOpen);
  const seen = new Uint8Array(w * h);
  if (col.blockedTile(startTile.x, startTile.y)) return seen;
  const q = [[startTile.x, startTile.y]];
  seen[startTile.y * w + startTile.x] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (col.blockedTile(nx, ny) || seen[ny * w + nx]) continue;
      seen[ny * w + nx] = 1;
      q.push([nx, ny]);
    }
  }
  return seen;
}

// Source anchor in pixels. Default: centre of its tile rect.
export function anchorOf(level, src) {
  if (src.anchor) return tileCenter(level.T, src.anchor.x, src.anchor.y);
  const w = src.w || 1, h = src.h || 1;
  return { x: (src.x + w / 2) * level.T, y: (src.y + h / 2) * level.T };
}

// Events a source can produce. Explicit `emits` win; otherwise derived from its kind.
export function emitsOf(src) {
  if (src.kind === 'npc') return [{ type: 'talk', target: src.id }, ...(src.emits || [])];
  if (src.emits) return src.emits;
  switch (src.kind) {
    case 'inspect': return [{ type: 'inspect', target: src.id }];
    case 'goods': return src.item ? [{ type: 'collect', target: src.item, when: src.requires }] : [];
    case 'pickup': return [{ type: 'collect', target: src.item, when: src.requires }];
    case 'practice': return [{ type: 'answer', target: 'practice.round' }];
    default: return [];
  }
}
