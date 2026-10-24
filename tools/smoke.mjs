// Real-browser verification (Chromium via Playwright): desktop campaign, accessibility, settings, persistence,
// failure handling, touch on three viewports, offline/PWA. Prints PASS/FAIL per check; exit code 1 on any FAIL.
// Not covered (no hardware here): real phones/tablets, Safari/Firefox, audible audio, installed-app behaviour.
import { loadPlaywright } from './pw.mjs';
import { serve } from './serve.mjs';
import { interact, walkTo, driveModals, state } from './e2e-helpers.mjs';

const pw = loadPlaywright(); const port = 8300 + Math.floor(Math.random() * 500); const server = await serve(port);
const URL0 = `http://localhost:${port}/index.html`;
const results = []; const check = (name, ok, detail = '') => { results.push([name, !!ok]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const guard = async (name, fn) => { try { await fn(); } catch (e) { check(name + ' (threw)', false, String(e.message).split('\n')[0]); } };
const browser = await pw.chromium.launch();
const mk = async (opts = {}) => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...opts }); const page = await ctx.newPage(); page.errs = []; page.on('pageerror', (e) => page.errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && page.errs.push(m.text())); return { ctx, page }; };
const fast = (p) => p.evaluate(() => { window.__KM.timeScale = 4; });

// ---------------- A. desktop campaign + accessibility + settings ----------------
await guard('desktop', async () => {
  const { ctx, page: p } = await mk(); await p.goto(URL0 + '?debug&nosw');
  check('title renders with Arabic logo and focused primary action', (await p.locator('.logo-ar').innerText()).includes('كَلِمَة') && await p.evaluate(() => document.activeElement?.textContent === 'Mulai petualangan'));
  await p.click('text=Mulai petualangan'); await fast(p);
  // real keyboard movement
  const y0 = await p.evaluate(() => window.__KM.session.player.y); await p.keyboard.down('ArrowUp'); await p.waitForTimeout(500); await p.keyboard.up('ArrowUp');
  check('keyboard arrow keys move the player', y0 - await p.evaluate(() => window.__KM.session.player.y) > 8);
  // dialogue: choice keys + a11y semantics
  await interact(p, 'npc.zainab');
  await walkTo(p, 'npc.abu_salih'); await p.keyboard.press('e'); await p.waitForTimeout(200);
  const dlg = await p.evaluate(() => { const c = document.querySelector('#overlay .card'); return c && { role: c.getAttribute('role'), modal: c.getAttribute('aria-modal'), label: c.getAttribute('aria-label') }; });
  check('dialogue is an aria-modal dialog with a label', dlg?.role === 'dialog' && dlg.modal === 'true' && /Abu Salih/.test(dlg.label || ''), JSON.stringify(dlg));
  await p.keyboard.press('1'); await p.waitForTimeout(250); await p.click('.layer .primary'); await p.waitForTimeout(250);
  check('number key selects the first dialogue choice (reaches the price challenge)', await p.locator('.layer.challenge').count() === 1);
  await p.keyboard.press('1'); await p.waitForTimeout(100);   // first option (may be wrong — fine)
  await driveModals(p);
  await p.keyboard.press('j'); await p.waitForTimeout(200);
  let inside = true; for (let i = 0; i < 18; i++) { await p.keyboard.press('Tab'); inside = inside && await p.evaluate(() => !!document.activeElement.closest('#overlay .card')); }
  check('Tab key stays trapped inside the open journal', inside);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  check('Escape closes the journal', await p.locator('#overlay .layer').count() === 0);
  // challenge types not hit by the main flow
  const types = await p.evaluate(async () => {
    const { CONTENT } = await import('/src/game/content.js'); const ui = window.__KM.ui; const out = {};
    const order = CONTENT.CHALLENGE_BY_ID.get('ch.m1.order.khubz'), short = CONTENT.CHALLENGE_BY_ID.get('ch.m1.short.suq');
    window.__r = {}; window.__KM.session.mode = 'modal';
    ui.challenge(order, { hints: 1 }).then((r) => { window.__r.order = r; });
    out.orderTokens = order.answer.map((id) => order.tokens.find((t) => t.id === id).ar);
    return out;
  });
  for (const ar of types.orderTokens) await p.locator('.bank .tok', { hasText: ar }).first().click();
  await p.click('text=Periksa'); await p.waitForTimeout(100); await p.click('.feedback .primary'); await p.waitForTimeout(100);
  check('sentence-building challenge: correct order accepted', await p.evaluate(() => window.__r.order?.correct === true));
  await p.evaluate(async () => { const { CONTENT } = await import('/src/game/content.js'); window.__KM.ui.challenge(CONTENT.CHALLENGE_BY_ID.get('ch.m1.short.suq'), { hints: 1 }).then((r) => { window.__r.short = r; }); });
  await p.fill('.ar-input', 'سوف'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  check('typed answer: one-letter slip gets a typo nudge and does not end the challenge', await p.locator('.layer.challenge').count() === 1 && /Hampir benar/.test(await p.locator('.layer .note').innerText()));
  await p.fill('.ar-input', 'سوق'); await p.keyboard.press('Enter'); await p.waitForTimeout(100); await p.click('.feedback .primary'); await p.waitForTimeout(100);
  check('typed answer: unvowelled correct word accepted under lenient policy', await p.evaluate(() => window.__r.short?.correct === true));
  await p.evaluate(() => { window.__KM.session.mode = 'play'; });
  // finish campaign via UI
  await interact(p, 'gd.b'); await interact(p, 'npc.khabbaz', { wrongFirst: true }); await interact(p, 'gb.b'); await interact(p, 'npc.saqqa'); await interact(p, 'gw.c'); await interact(p, 'npc.zainab');
  const s1 = await state(p);
  check('main shopping chain completed through the real UI (incl. a wrong price answer)', s1.flags.includes('order_delivered') && s1.purse === 0, `purse=${s1.purse}`);
  await interact(p, 'npc.potter'); await interact(p, 'pk.key'); await interact(p, 'npc.potter');
  check('side quest completed and key consumed', (await state(p)).q['q.key'].status === 'complete');
  // reload persistence (mid-stage) + Continue
  await p.reload(); await p.waitForTimeout(500);
  check('Continue is offered after reload', await p.locator('text=Lanjutkan').count() === 1);
  await p.click('text=Lanjutkan'); await p.waitForTimeout(400); await fast(p);
  const s2 = await state(p);
  check('progress survives a real page reload (flags, inventory, purse, side quest)', s2.flags.includes('order_delivered') && s2.inv['item.seal'] === 1 && s2.purse === 0 && s2.q['q.key'].status === 'complete');
  // exit → results
  await p.evaluate(async () => { const km = window.__KM, s = km.session, T = 16, W = s.level.w, fr = () => new Promise((r) => requestAnimationFrame(r)); const t = s.level.triggers[0].rect;
    const st = { x: Math.floor(s.player.x / T), y: Math.floor((s.player.y - 2) / T) }; const prev = new Map([[st.y * W + st.x, null]]); const q = [[st.x, st.y]]; let goal;
    while (q.length) { const [x, y] = q.shift(); if (x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h) { goal = [x, y]; break; } for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (s.collider.blockedTile(nx, ny) || prev.has(k)) continue; prev.set(k, y * W + x); q.push([nx, ny]); } }
    const path = []; let k = goal[1] * W + goal[0]; while (k !== null) { path.push([k % W, Math.floor(k / W)]); k = prev.get(k); } path.reverse();
    for (const [tx, ty] of path.slice(1)) { const cx = (tx + .5) * T, cy = (ty + .5) * T + 4; for (let i = 0; i < 400 && s.mode === 'play'; i++) { const dx = cx - s.player.x, dy = cy - s.player.y, d = Math.hypot(dx, dy); if (d < 4) break; km.input.stick.x = dx / d; km.input.stick.y = dy / d; await fr(); } }
    km.input.stick.x = km.input.stick.y = 0; });
  await p.waitForSelector('.results', { timeout: 5000 });
  const res = await p.locator('.results').innerText();
  check('results screen shows summary, honest next-stage placeholder, and no [object …] leaks', /Tahap selesai/.test(res) && /belum tersedia/.test(res) && !/\[object/.test(res));
  await p.screenshot({ path: 'smoke-results.png' });
  // settings
  await p.click('text=Menu utama'); await p.waitForTimeout(300); await p.click('text=Pengaturan'); await p.waitForTimeout(200);
  check('settings modal is on top of the title screen (hit-testable)', await p.evaluate(() => { const e = document.querySelector('#overlay .card select'); const r = e.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('#overlay') !== null; }));
  await p.selectOption('select >> nth=0', 'xl'); await p.waitForTimeout(100);
  check('text-size setting applies to Arabic text', await p.evaluate(() => document.documentElement.dataset.ar === 'xl'));
  await p.selectOption('select >> nth=1', 'dpad'); await p.locator('input[type=checkbox]').nth(1).check(); await p.waitForTimeout(100);
  const tc = await p.evaluate(() => ({ mode: document.getElementById('touch').dataset.mode, hand: document.getElementById('touch').dataset.hand, hidden: document.getElementById('touch').hidden }));
  check('control scheme + left-handed settings apply to on-screen controls', tc.mode === 'dpad' && tc.hand === 'left' && !tc.hidden, JSON.stringify(tc));
  await p.keyboard.press('Escape'); await p.reload(); await p.waitForTimeout(400);
  check('settings persist across reload', await p.evaluate(() => document.documentElement.dataset.ar === 'xl' && document.getElementById('touch').dataset.mode === 'dpad'));
  check('no console/page errors during the desktop run', p.errs.length === 0, p.errs.join(' | ').slice(0, 200));
  await ctx.close();
});

// ---------------- translation setting hides Indonesian meaning ----------------
await guard('translation-off', async () => {
  const { ctx, page: p } = await mk(); await p.goto(URL0 + '?debug&nosw'); await p.click('text=Mulai petualangan'); await fast(p);
  await p.evaluate(() => window.__KM.ui.d.applySettings({ translation: false }));
  await walkTo(p, 'npc.zainab'); await p.keyboard.press('e'); await p.waitForTimeout(250);
  check('translation off: Indonesian gloss hidden, Arabic and tap-to-reveal chips remain', await p.locator('.layer .line-id').count() === 0 && await p.locator('.layer .line-ar').count() === 1 && await p.locator('.wordchip').count() > 0);
  await p.locator('.wordchip').first().click(); check('tapping a word chip reveals its meaning', (await p.locator('.wordchip .gl').first().innerText()).length > 0);
  await ctx.close();
});

// ---------------- failure handling ----------------
await guard('corrupt-save', async () => {
  const { ctx, page: p } = await mk(); await p.addInitScript(() => { localStorage.setItem('kalimah.chronicles.save', '{"version":1,"progress":'); });
  await p.goto(URL0 + '?debug&nosw'); await p.waitForTimeout(400);
  check('corrupt save: title still loads, user is told, no errors', await p.locator('text=tidak terbaca').count() === 1 && p.errs.length === 0);
  await p.click('text=Mulai petualangan'); await p.waitForTimeout(400); check('corrupt save: new game starts', await p.evaluate(() => !!window.__KM.session));
  await ctx.close();
});
await guard('no-storage', async () => {
  const { ctx, page: p } = await mk(); await p.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }); });
  await p.goto(URL0 + '?debug&nosw'); await p.waitForTimeout(400);
  check('storage blocked: warning shown and game is still playable', await p.locator('text=Penyimpanan peramban tidak tersedia').count() === 1);
  await p.click('text=Mulai petualangan'); await p.waitForTimeout(300); await fast(p); await interact(p, 'npc.zainab');
  check('storage blocked: dialogue flow works without persistence', (await state(p)).flags.includes('order_received') && p.errs.filter((e) => !/denied/.test(e)).length === 0, p.errs.join('|').slice(0, 160));
  await ctx.close();
});
await guard('reduced-motion', async () => {
  const { ctx, page: p } = await mk({ reducedMotion: 'reduce' }); await p.goto(URL0 + '?debug&nosw');
  check('prefers-reduced-motion is honoured', await p.evaluate(() => document.documentElement.dataset.reduced === 'on')); await ctx.close();
});

// ---------------- B. touch devices ----------------
for (const [name, vp] of [['phone-portrait 390x844', { width: 390, height: 844 }], ['phone-landscape 844x390', { width: 844, height: 390 }], ['tablet 820x1180', { width: 820, height: 1180 }]]) {
  await guard(name, async () => {
    const { ctx, page: p } = await mk({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); await p.goto(URL0 + '?debug&nosw'); await p.tap('text=Mulai petualangan'); await p.waitForTimeout(700); await fast(p);
    const cdp = await ctx.newCDPSession(p); const bb = await p.locator('.tc-base').boundingBox(); const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
    const y0 = await p.evaluate(() => window.__KM.session.player.y);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy - i * 8, id: 1 }] }); await p.waitForTimeout(40); }
    await p.waitForTimeout(400); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const moved = y0 - await p.evaluate(() => window.__KM.session.player.y);
    check(`${name}: analog joystick moves the player and releases to zero`, moved > 12 && await p.evaluate(() => window.__KM.input.stick.x === 0 && window.__KM.input.stick.y === 0), `moved ${Math.round(moved)}px`);
    const g = await p.evaluate(() => { const sel = ['#btn-menu', '#btn-journal', '.tc-a', '.tc-j']; const m = {}; for (const s of sel) { const b = document.querySelector(s).getBoundingClientRect(); m[s] = [Math.round(b.width), Math.round(b.height)]; } return { m, sw: document.scrollingElement.scrollWidth, sh: document.scrollingElement.scrollHeight, iw: innerWidth, ih: innerHeight, scale: window.__KM.renderer.scale }; });
    check(`${name}: no page overflow, integer pixel scale ${g.scale}`, g.sw <= g.iw && g.sh <= g.ih && Number.isInteger(g.scale));
    check(`${name}: every touch control ≥ 44×44 CSS px`, Object.values(g.m).every(([w, h]) => w >= 44 && h >= 44), JSON.stringify(g.m));
    await walkTo(p, 'npc.zainab'); await p.tap('.tc-a'); await p.waitForTimeout(300);
    const card = await p.evaluate(() => { const b = document.querySelector('#overlay .card')?.getBoundingClientRect(); return b && { t: b.top, b: b.bottom, l: b.left, r: b.right, ih: innerHeight, iw: innerWidth }; });
    check(`${name}: tapping Aksi opens the dialogue and it fits the screen`, card && card.t >= 0 && card.b <= card.ih + 1 && card.l >= 0 && card.r <= card.iw + 1, JSON.stringify(card));
    await p.waitForTimeout(700); // let the camera ease toward the visible area
    const vis = await p.evaluate(() => { const r = window.__KM.renderer, s = window.__KM.session, c = document.querySelector('#overlay .card').getBoundingClientRect(); const feet = (s.player.y - r.cam.y) * r.scale, head = (s.player.y - 24 - r.cam.y) * r.scale; return { head: Math.round(head), feet: Math.round(feet), cardTop: Math.round(c.top) }; });
    check(`${name}: the player is still visible above the open dialogue sheet`, vis.head >= 0 && vis.feet <= vis.cardTop, JSON.stringify(vis));
    await p.screenshot({ path: `smoke-${name.split(' ')[0]}-dialogue.png` });
    for (let i = 0; i < 6 && await p.locator('#overlay .layer').count(); i++) { await p.tap(await p.locator('.layer .choice').count() ? '.layer .choice >> nth=0' : '.layer .primary'); await p.waitForTimeout(200); }
    check(`${name}: no console/page errors`, p.errs.length === 0, p.errs.join('|').slice(0, 160)); await ctx.close();
  });
}

// ---------------- C. offline / PWA ----------------
await guard('pwa', async () => {
  const { ctx, page: p } = await mk(); await p.goto(URL0); await p.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready, null, { timeout: 8000 });
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(800);
  const man = await p.evaluate(async () => { const r = await fetch(document.querySelector('link[rel=manifest]').href); const m = await r.json(); const icons = await Promise.all(m.icons.map((i) => fetch(i.src).then((x) => x.ok))); return { name: m.name, display: m.display, icons }; });
  check('manifest is valid with reachable icons', man.name && man.icons.every(Boolean), JSON.stringify(man));
  check('service worker controls the page', await p.evaluate(() => !!navigator.serviceWorker.controller));
  await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(800);
  check('offline: app shell loads from cache after reload', await p.locator('text=Mulai petualangan').count() + await p.locator('text=Lanjutkan').count() > 0);
  await p.locator('.title button.primary').first().click(); await p.waitForTimeout(600);
  check('offline: a new game starts and renders', await p.evaluate(() => { const c = document.getElementById('game'); return c.width > 0 && !document.getElementById('hud').hidden; }));
  check('no errors while offline', p.errs.filter((e) => !/net::ERR|Failed to load resource/.test(e)).length === 0, p.errs.join('|').slice(0, 160));
  await ctx.close();
});

await browser.close(); server.close();
const fails = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - fails.length}/${results.length} browser checks passed${fails.length ? '; FAILED: ' + fails.map(([n]) => n).join('; ') : ''}`);
process.exit(fails.length ? 1 : 0);
