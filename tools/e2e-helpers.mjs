// Browser end-to-end helpers: walk via the real joystick input path, press real keys, click real DOM controls.
export async function walkTo(page, id) {
  await page.evaluate(async (id) => {
    const km = window.__KM, s = km.session, T = s.level.T;
    const src = s.sources().find((x) => x.id === id); if (!src) throw new Error('target not available: ' + id);
    const { anchorOf } = await import('/src/world/level.js'); const a = anchorOf(s.level, src);
    const ok = (x, y) => { if (s.collider.blockedTile(x, y)) return false; const pos = { x: (x + 0.5) * T, y: (y + 0.5) * T + 4 };
      return ['up', 'down', 'left', 'right'].every((d) => s.pickTarget(pos, d)?.id === id) && Math.hypot(a.x - pos.x, a.y - (pos.y - 4)) <= 24; };
    const start = { x: Math.floor(s.player.x / T), y: Math.floor((s.player.y - 2) / T) }, W = s.level.w;
    const prev = new Map([[start.y * W + start.x, null]]); const q = [[start.x, start.y]]; let goal = null;
    while (q.length) { const [x, y] = q.shift(); if (ok(x, y)) { goal = [x, y]; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (s.collider.blockedTile(nx, ny) || prev.has(k)) continue; prev.set(k, y * W + x); q.push([nx, ny]); } }
    if (!goal) throw new Error('no path to ' + id);
    const path = []; let k = goal[1] * W + goal[0]; while (k !== null) { path.push([k % W, Math.floor(k / W)]); k = prev.get(k); } path.reverse();
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const th = Math.max(1.6, 1.3 * 58 * 0.0167 * (km.timeScale || 1));
    for (const [tx, ty] of path.slice(1)) {
      const cx = (tx + 0.5) * T, cy = (ty + 0.5) * T + 4;
      for (let i = 0; i < 600; i++) {
        const dx = cx - s.player.x, dy = cy - s.player.y, d = Math.hypot(dx, dy); if (d < th) break;
        km.input.stick.x = dx / d; km.input.stick.y = dy / d; await frame();
      }
    }
    km.input.stick.x = 0; km.input.stick.y = 0; await frame(); await frame();
  }, id);
}

// Dismiss/answer modals until none remain. attempt[chId] rotates which option is clicked after a wrong answer.
export async function driveModals(page, { wrongFirst = false, log = [], maxSteps = 80 } = {}) {
  const attempts = (driveModals.attempts ||= {});
  for (let i = 0; i < maxSteps; i++) {
    await page.waitForTimeout(60);
    const state = await page.evaluate(() => {
      const L = document.querySelector('#overlay .layer'); if (!L) return { none: true };
      const q = (s) => L.querySelector(s);
      return { sheet: L.classList.contains('sheet'), challenge: L.classList.contains('challenge'), fb: !!q('.feedback .primary'), choices: L.querySelectorAll('.choice').length,
        opts: L.querySelectorAll('.opt').length, tok: L.querySelectorAll('.bank .tok').length, input: !!q('.ar-input'), title: q('h2')?.textContent || '', prompt: q('.ch-prompt')?.textContent || '' };
    });
    if (state.none) return true;
    if (state.fb) { log.push('feedback'); await page.click('.feedback .primary'); continue; }
    if (state.challenge) {
      if (state.opts) { const key = state.prompt; const n = (attempts[key] = (attempts[key] ?? (wrongFirst ? -1 : 0)) + 1); const idx = Math.max(0, n) % state.opts;
        if (wrongFirst && n === 0) { /* deliberately try a probably-wrong one first */ }
        log.push(`opt${idx}`); await page.locator('.opt').nth(idx).click(); continue; }
      if (state.tok || state.input) throw new Error('unexpected challenge type in main flow');
    }
    if (state.sheet) { if (state.choices) await page.locator('.choice').first().click(); else await page.click('.layer .primary'); continue; }
    const primary = page.locator('#overlay .layer .primary').first(); if (await primary.count()) { await primary.click(); continue; }
    await page.keyboard.press('Escape');
  }
  throw new Error('modals did not settle');
}
export async function interact(page, id, opts) {
  await walkTo(page, id); await page.keyboard.press('e'); await page.waitForTimeout(120); return driveModals(page, opts);
}
export const state = (page) => page.evaluate(() => { const s = window.__KM.session; return { flags: [...s.quests.flags], inv: { ...s.inv }, purse: s.purse, mode: s.mode, done: s.done, q: s.quests.serialize().quests }; });
