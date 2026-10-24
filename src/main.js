// Bootstrap: save → settings → title → session loop. Errors never leave a blank screen (KM-017/115).
import { SaveStore, defaultSave, defaultProgress, sanitizeSettings } from './persistence/save.js';
import { GameSession } from './game/session.js';
import { CONTENT, STAGES } from './game/content.js';
import { Renderer } from './render/renderer.js';
import { TitleScene } from './render/title.js';
import { Input } from './input/input.js';
import { TouchControls } from './input/touch.js';
import { AudioManager } from './audio/audio.js';
import { UI } from './ui/ui.js';
import { h, ar } from './ui/dom.js';
import { makeVocabChallenge } from './learning/challenges.js';
import { pickReview } from './learning/progress.js';

const $ = (id) => document.getElementById(id);
let storageOk = true;
const storage = (() => { try { localStorage.setItem('km.t', '1'); localStorage.removeItem('km.t'); return localStorage; } catch { storageOk = false; const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; } })();
const store = new SaveStore(storage);
let { save, status } = store.load();
let session = null, title = null, fatalShown = false;
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => save.settings.reducedMotion === 'on' || (save.settings.reducedMotion === 'auto' && mqReduce.matches);

const audio = new AudioManager();
const input = new Input(() => save.settings);
const renderer = new Renderer($('game'));
const touch = new TouchControls($('touch'), input);

function applyDom() {
  const s = save.settings, root = document.documentElement;
  root.dataset.ar = s.arSize; root.dataset.reduced = reduced() ? 'on' : 'off';
  audio.apply(s); touch.apply(s);
  $('app').dataset.touch = $('touch').hidden ? '0' : '1';
}
function persist() { return store.write(save); }
function applySettings(patch) { save.settings = sanitizeSettings({ ...save.settings, ...patch }); applyDom(); persist(); }
mqReduce.addEventListener?.('change', applyDom);

const ui = new UI({
  getSettings: () => save.settings, applySettings, audio, content: CONTENT, touch,
  getRenderer: () => renderer, getSession: () => session,
  onShake: () => renderer.kick(reduced() ? 0 : { normal: 1, reduced: 0.5, off: 0 }[save.settings.shake]),
  resetAll: () => { store.reset(); location.reload(); },
  startReview: () => review(),
});
ui.stageDone = (sum) => { audio.setMode('menu'); setTimeout(() => ui.showResults(sum, { lexicon: () => ui.openLexicon(session), replay: () => startGame(true), menu: showTitle }), 600); };

function fatal(e) { if (fatalShown) return; fatalShown = true; console.error(e); try { session?.checkpoint(); } catch { /* ignore */ } ui.fatal(e, { reset: () => { store.reset(); location.reload(); } }); }
addEventListener('error', (e) => fatal(e.error || e.message));
addEventListener('unhandledrejection', (e) => fatal(e.reason));

function hasProgress() { const p = save.progress; return save.campaign.completed.length > 0 || p.quests.flags.length > 0 || p.areas.length > 1 || Object.keys(p.inv).length > 0; }

function showTitle() {
  session = null; ui.modals.closeAll(); ui.setHudVisible(false); audio.setMode('menu');
  const cv = h('canvas', { 'aria-hidden': 'true' });
  const btn = (t, f, primary) => h('button', { class: primary ? 'primary' : '', type: 'button', text: t, 'data-autofocus': primary || null, onclick: () => { audio.unlock(); f(); } });
  const menu = h('div', { class: 'menu' },
    hasProgress() ? btn('Lanjutkan', () => startGame(false), true) : null,
    btn(hasProgress() ? 'Permainan baru' : 'Mulai petualangan', async () => { if (!hasProgress() || await ui.confirm('Mulai permainan baru?', 'Misi, tas, dan dompet akan diulang. Kata di Leksikon dan pengaturan tetap tersimpan.', 'Mulai baru')) startGame(true); }, !hasProgress()),
    btn('Pengaturan', () => ui.openSettings()),
    btn('Tentang', () => about()));
  const panel = h('div', { class: 'panel' }, h('p', { class: 'logo-ar' }, ar('كَلِمَة')), h('h1', { class: 'logo-en', text: 'Kalimah Maze' }), h('p', { class: 'logo-sub', text: 'Chronicles of the Lost Bazaar' }), menu,
    !storageOk ? h('p', { class: 'note', text: 'Penyimpanan peramban tidak tersedia: progres tidak akan tersimpan setelah halaman ditutup.' }) : null,
    status === 'recovered' ? h('p', { class: 'note', text: 'Data simpanan sebelumnya tidak terbaca dan telah diabaikan (salinannya disimpan terpisah).' }) : null);
  ui.showScreen(h('div', { class: 'title' }, cv, panel));
  title?.stop(); title = new TitleScene(cv); title.start(reduced());
  panel.querySelector('[data-autofocus]')?.focus() || panel.querySelector('button').focus();
}

function about() {
  const hnd = ui.modals.open({ label: 'Tentang', variant: 'center', node: [h('h2', { text: 'Tentang versi ini' }),
    h('p', { text: 'Tahap 1 dari 4 (Pasar Pagi) dapat dimainkan. Lorong Pedagang, Ruang Rahasia, dan Penjaga Kata belum dibuat.' }),
    h('p', { text: 'Seluruh seni piksel dan suara dihasilkan lewat kode untuk proyek ini; tidak ada aset pihak ketiga.' }),
    h('p', { class: 'note', text: 'Seluruh materi bahasa Arab berstatus draf: belum ditinjau ahli bahasa Arab. Jangan dijadikan rujukan otoritatif.' }),
    h('button', { class: 'primary', type: 'button', 'data-autofocus': true, text: 'Tutup', onclick: () => hnd.close() })] });
}

function startGame(fresh) {
  title?.stop(); ui.hideScreen(); ui.modals.closeAll();
  if (fresh) { save.progress = defaultProgress(); save.campaign.completed = save.campaign.completed.filter((s) => s !== 'morning'); }
  session = new GameSession({ stageDef: STAGES.morning, content: CONTENT, save, ui, persist: (s) => { save = s; return persist(); } });
  renderer.setSession(session); renderer.resize($('viewport').clientWidth, $('viewport').clientHeight);
  ui.setHudVisible(true); ui.hudSig = ''; audio.setMode('play'); input.reset(); persist();
  if (session.done && !fresh) { session.mode = 'play'; }
  setTimeout(() => ui.toast(session.quests.hasFlag('order_received') ? 'Lanjutkan tujuanmu — lihat pojok kiri atas.' : 'Berjalanlah ke utara dan temui Hajjah Zainab.', 'info'), 400);
}

async function review() {
  if (!session || session.mode !== 'play') return;
  const known = Object.keys(session.lexicon).filter((id) => session.lexById.has(id));
  const ids = pickReview(session.lexicon, session.day, 5, known);
  if (!ids.length) { ui.toast('Belum ada kata untuk diulas. Temui beberapa kata dulu.', 'info'); return; }
  session.mode = 'modal'; let right = 0;
  try { for (const id of ids) { const e = session.lexById.get(id), st = session.lexicon[id]; if ((await session.runChallenge(makeVocabChallenge(e, CONTENT.LEXICON, st.fwd > st.rev ? 'reverse' : 'forward', session.day))).correct) right++; } }
  finally { session.mode = 'play'; session.checkpoint(); }
  ui.toast(`Ulasan: ${right}/${ids.length} benar.`, right === ids.length ? 'good' : 'info');
}

function openPause() {
  if (!session || ui.isModal() || session.mode !== 'play') return;
  audio.setMode('modal'); ui.openPause(session, { restart: () => startGame(true), menu: () => { session.checkpoint(); showTitle(); } });
  watchModals();
}
let watching = false;
function watchModals() { if (watching) return; watching = true; const iv = setInterval(() => { if (!ui.isModal()) { clearInterval(iv); watching = false; if (session) audio.setMode(session.mode === 'done' ? 'menu' : 'play'); } }, 150); }

input.on('interact', () => { if (session && !ui.isModal() && session.mode === 'play') { audio.unlock(); session.interact().then(() => { audio.setMode('play'); }).catch(fatal); } });
input.on('pause', openPause);
input.on('journal', () => { if (session && !ui.isModal() && session.mode === 'play') { audio.setMode('modal'); ui.openJournal(session); watchModals(); } });
input.on('lexicon', () => { if (session && !ui.isModal() && session.mode === 'play') { audio.setMode('modal'); ui.openLexicon(session); watchModals(); } });
input.on('map', () => { if (session && !ui.isModal() && session.mode === 'play') { audio.setMode('modal'); ui.openJournal(session, 'peta'); watchModals(); } });
$('btn-journal').addEventListener('click', () => { audio.unlock(); input.fire('journal'); });
$('btn-menu').addEventListener('click', () => { audio.unlock(); openPause(); });
addEventListener('pointerdown', () => audio.unlock(), { once: false, passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) { session?.checkpoint(); audio.suspend(); input.reset(); if (session && session.mode === 'play' && !ui.isModal()) openPause(); } else audio.resume(); });
addEventListener('pagehide', () => { try { session?.checkpoint(); } catch { /* ignore */ } });

function resize() { const v = $('viewport'); renderer.resize(v.clientWidth, v.clientHeight); }
new ResizeObserver(resize).observe($('viewport'));

let last = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
  try {
    if (session) {
      const paused = ui.isModal(); input.enabled = !paused && session.mode === 'play';
      if (!paused) session.update(dt * (window.__KM?.timeScale || 1), input.vec());
      renderer.inset = ui.sheetInset();
      renderer.render(dt, { reduced: reduced(), shake: reduced() ? 0 : { normal: 1, reduced: 0.5, off: 0 }[save.settings.shake], help: save.settings.help });
      ui.updateHud(session);
    }
  } catch (e) { fatal(e); return; }
  requestAnimationFrame(frame);
}

applyDom(); resize();
if (location.search.includes('debug')) window.__KM = { timeScale: 1, get session() { return session; }, ui, input, renderer, audio, get save() { return save; }, store };
showTitle(); requestAnimationFrame(frame);
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !location.search.includes('nosw')) navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
