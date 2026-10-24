// HTML UI layer: HUD, dialogue, inspection, challenge runtime, journal, lexicon, settings, screens (KM-015/034/042/061/092/094).
import { h, ar, clear, Modals, mixedNodes } from './dom.js';
import { evaluate, hintFor, shuffledOptions, shuffledTokens, makeVocabChallenge } from '../learning/challenges.js';
import { stateOf, STATE_LABEL, pickReview } from '../learning/progress.js';
import { stripTashkeel } from '../learning/normalize.js';

const TOPIC_LABEL = { 'vocab.food': 'Makanan', 'vocab.objects': 'Benda', 'vocab.place': 'Tempat', 'vocab.people': 'Orang', 'vocab.money': 'Uang', 'vocab.numbers': 'Bilangan', 'vocab.colors': 'Warna', 'vocab.direction': 'Arah', 'vocab.adjectives': 'Sifat', 'vocab.verbs': 'Kata kerja', 'vocab.phrases': 'Ungkapan', 'vocab.function': 'Kata fungsi' };
const PROMPT_VERB = { npc: 'Bicara', inspect: 'Periksa', goods: 'Lihat', pickup: 'Ambil', practice: 'Latihan' };

export class UI {
  constructor(deps) {
    this.d = deps; // { getSettings, applySettings, audio, getSession, getRenderer, resetAll, startReview }
    this.$ = (id) => document.getElementById(id);
    this.modals = new Modals(this.$('overlay'));
    this.hudSig = '';
  }
  get s() { return this.d.getSettings(); }
  isModal() { return this.modals.count > 0; }
  sheetInset() { if (!this.modals.count) return 0; const c = this.$('overlay').querySelector('.layer.sheet .card'); return c ? c.getBoundingClientRect().height + 12 : 0; }
  sfx(n) { this.d.audio?.play(n); }
  shake() { this.d.onShake?.(); }

  // ---------- toasts ----------
  toast(text, kind = 'info') {
    const box = this.$('toasts'), icon = { good: '✓', warn: '!', word: '+', info: 'i' }[kind] || 'i';
    // Word-discovery toasts merge into one running counter instead of stacking.
    if (kind === 'word' && this.wordToast?.isConnected && !this.wordToast.classList.contains('out')) {
      this.wordN = (this.wordN || 1) + (text.startsWith('Kata baru:') ? 1 : Number.parseInt(text, 10) || 1);
      this.wordToast.lastChild.textContent = `${this.wordN} kata baru masuk Leksikon.`;
      clearTimeout(this.wordT1); clearTimeout(this.wordT2);
      this.wordT1 = setTimeout(() => this.wordToast.classList.add('out'), 3200); this.wordT2 = setTimeout(() => this.wordToast.remove(), 3600); return;
    }
    const t = h('div', { class: `toast ${kind}` }, h('span', { class: 'ti', 'aria-hidden': 'true', text: icon }), h('span', { mixed: text }));
    if (kind === 'word') { this.wordToast = t; this.wordN = text.startsWith('Kata baru:') ? 1 : Number.parseInt(text, 10) || 1; this.wordT1 = setTimeout(() => t.classList.add('out'), 3200); this.wordT2 = setTimeout(() => t.remove(), 3600); }
    box.append(t); while (box.children.length > 3) box.firstChild.remove();
    if (kind !== 'word') { setTimeout(() => t.classList.add('out'), 3600); setTimeout(() => t.remove(), 4000); }
  }
  areaEntered(a) { this.toast(`Lokasi: ${a.label} — ${a.ar}`, 'info'); }

  // ---------- HUD ----------
  setHudVisible(v) { this.$('hud').hidden = !v; }
  updateHud(session) {
    const j = session.journal(), main = j.quests.find((q) => q.main);
    let obj = 'Tahap selesai', prog = '';
    if (main) {
      const req = main.objectives.filter((o) => !o.optional), done = req.filter((o) => o.done).length;
      const cur = req.find((o) => o.available && !o.done) || req.find((o) => !o.done);
      obj = main.status === 'complete' ? 'Tahap selesai' : (cur ? cur.text : '—'); prog = `${done}/${req.length}`;
    }
    const t = session.target; const prompt = t && session.mode === 'play' ? `${PROMPT_VERB[t.kind] || 'Periksa'}: ${t.name || t.title || t.ar || ''}` : '';
    const sig = JSON.stringify([obj, prog, j.purse, j.bag.map((b) => b.id + b.n), prompt]);
    this.d.touch?.setTarget(!!prompt);
    if (sig === this.hudSig) return; this.hudSig = sig;
    clear(this.$('obj-text')).append(...mixedNodes(obj)); this.$('obj-prog').textContent = prog;
    this.$('purse').textContent = `${j.purse}`;
    const bag = clear(this.$('bag'));
    for (const b of j.bag) bag.append(h('span', { class: 'chip', title: b.name }, h('span', { class: 'ico', 'aria-hidden': 'true', text: ({ dates: '●', bread: '◖', jar: '▲', seal: '✦', key: '⚷' })[b.icon] || '•' }), `${b.name}${b.n > 1 ? ' ×' + b.n : ''}`));
    const p = clear(this.$('prompt')); p.append(...mixedNodes(prompt)); p.hidden = !prompt;
  }

  // ---------- shared pieces ----------
  words(words) {
    if (!words?.length) return null;
    const show = this.s.translation;
    return h('div', { class: 'words', 'aria-label': 'Kata pada baris ini' }, words.slice(0, 8).map((w) => {
      const gl = h('span', { class: 'gl', text: show ? w.gloss : '' });
      const b = h('button', { class: 'wordchip', type: 'button', 'aria-label': `${w.plain}: ${w.gloss}` }, ar(w.ar), gl);
      b.addEventListener('click', () => { gl.textContent = gl.textContent ? (show ? w.gloss : '') : w.gloss; });
      return b;
    }));
  }
  line(ar_, text, words) {
    return [ar_ ? h('p', { class: 'line-ar' }, ar(ar_)) : null, text && (this.s.translation || !ar_) ? h('p', { class: 'line-id', mixed: text }) : null, this.words(words)];
  }

  // ---------- dialogue ----------
  dialogue({ speaker, speakerAr, ar: arText, text, words, choices, more }) {
    return new Promise((resolve) => {
      let done = false; const finish = (v) => { if (done) return; done = true; hnd.close(v); resolve(v); };
      const head = h('div', { class: 'who' }, h('strong', { text: speaker }), speakerAr ? ar(speakerAr, 'who-ar') : null);
      const body = h('div', { class: 'sheet-body' }, this.line(arText, text, words));
      let actions;
      if (choices.length) {
        actions = h('div', { class: 'choices', role: 'group', 'aria-label': 'Pilihan jawaban' }, choices.map((c, i) => h('button', { class: 'choice', type: 'button', 'data-autofocus': i === 0 || null, onclick: () => { this.sfx('click'); finish(i); } },
          h('span', { class: 'num', text: String(i + 1) }), c.ar ? ar(c.ar, 'ch-ar') : null, h('span', { class: 'ch-id', text: c.text }))));
      } else actions = h('div', { class: 'choices' }, h('button', { class: 'primary', type: 'button', 'data-autofocus': true, text: more ? 'Lanjut' : 'Tutup', onclick: () => { this.sfx('click'); finish(null); } }));
      const hnd = this.modals.open({ node: [head, body, actions], label: `Percakapan dengan ${speaker}`, variant: 'sheet', dismiss: false });
      hnd.layer.addEventListener('keydown', (e) => {
        if (/^[1-9]$/.test(e.key) && choices[+e.key - 1]) finish(+e.key - 1);
        else if (!choices.length && (e.key === 'Escape' || e.key === ' ')) { e.preventDefault(); finish(null); }
      });
    });
  }

  inspect({ title, ar: arText, text, note, words }) {
    return new Promise((resolve) => {
      const hnd = this.modals.open({ label: title || 'Periksa', variant: 'center', onClose: resolve, node: [
        h('h2', { text: title || 'Periksa' }), this.line(arText, text, words), note ? h('p', { class: 'note', mixed: note }) : null,
        h('div', { class: 'choices' }, h('button', { class: 'primary', type: 'button', 'data-autofocus': true, text: 'Tutup', onclick: () => hnd.close() })),
      ] });
    });
  }

  goods({ ar: arText, meaning, word }) {
    return new Promise((resolve) => {
      const hnd = this.modals.open({ label: 'Label barang', variant: 'center', onClose: (v) => resolve(!!v), node: [
        h('h2', { text: 'Label barang' }), h('p', { class: 'line-ar big' }, ar(arText)),
        this.s.translation ? h('p', { class: 'line-id', text: meaning }) : h('button', { class: 'reveal', type: 'button', text: 'Tampilkan arti', onclick: (e) => { e.currentTarget.replaceWith(h('p', { class: 'line-id', text: meaning })); } }),
        h('p', { class: 'note', text: 'Cocokkan dengan daftar pesananmu di Jurnal (J).' }),
        h('div', { class: 'choices row' }, h('button', { class: 'primary', type: 'button', 'data-autofocus': true, text: 'Ambil', onclick: () => { hnd.close(true); } }), h('button', { type: 'button', text: 'Tinggalkan', onclick: () => hnd.close(false) })),
      ] });
      void word;
    });
  }

  // ---------- challenge runtime ----------
  challenge(ch, { hints = 1 } = {}) {
    return new Promise((resolve) => {
      let hintLevel = 0, settled = false, picked = null; const bank = [], line = [];
      const fb = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
      const body = h('div', { class: 'ch-body' });
      const hintBox = h('p', { class: 'hint', hidden: true });
      const hintBtn = h('button', { class: 'ghost', type: 'button', text: hints > 0 ? `Petunjuk (${hints})` : 'Petunjuk dimatikan', disabled: hints <= 0, onclick: () => {
        const t = hintFor(ch, hintLevel); if (!t) { hintBtn.disabled = true; return; }
        hintLevel++; hintBox.hidden = false; hintBox.textContent = `Petunjuk ${hintLevel}: ${t}`;
        if (hintLevel >= hints || !hintFor(ch, hintLevel)) { hintBtn.disabled = true; hintBtn.textContent = 'Petunjuk habis'; } else hintBtn.textContent = `Petunjuk (${hints - hintLevel})`;
      } });
      const finish = (correct) => { settled = true; hnd.close({ correct, hints: hintLevel }); };
      const show = (res, markFn) => {
        const ok = res.correct; markFn?.(res);
        clear(fb).append(h('p', { class: `verdict ${ok ? 'ok' : 'no'}` }, h('span', { class: 'vi', 'aria-hidden': 'true', text: ok ? '✓' : '✗' }), ok ? 'Benar' : 'Belum tepat'),
          h('p', { mixed: res.feedback || '' }), h('button', { class: 'primary', type: 'button', 'data-autofocus': true, text: 'Lanjut', onclick: () => finish(ok) }));
        fb.querySelector('button').focus(); actionRow.hidden = true;
      };
      const actionRow = h('div', { class: 'choices row' }, hintBtn);
      const stim = ch.ar ? h('p', { class: 'line-ar big stim' }, ar(ch.ar)) : null;

      if (ch.type === 'choice') {
        const opts = shuffledOptions(ch, 0); const btns = [];
        opts.forEach((o, i) => {
          const b = h('button', { class: 'opt', type: 'button', 'data-id': o.id, onclick: () => { if (settled || picked) return; picked = o.id; this.sfx('click'); const res = evaluate(ch, o.id);
            show(res, () => { btns.forEach((x) => { x.disabled = true; if (x.dataset.id === ch.answer) { x.classList.add('right'); x.prepend(h('span', { class: 'mk', 'aria-hidden': 'true', text: '✓' })); } else if (x.dataset.id === o.id) { x.classList.add('wrong'); x.prepend(h('span', { class: 'mk', 'aria-hidden': 'true', text: '✗' })); } }); }); } },
            h('span', { class: 'num', text: String(i + 1) }), o.ar ? ar(o.ar, 'opt-ar') : null, o.text ? h('span', { class: 'opt-id', text: o.text }) : null);
          btns.push(b);
        });
        body.append(h('div', { class: 'opts', role: 'group', 'aria-label': 'Pilihan jawaban' }, btns));
        setTimeout(() => btns[0]?.focus(), 0);
        var onKey = (e) => { if (/^[1-9]$/.test(e.key) && btns[+e.key - 1] && !picked) btns[+e.key - 1].click(); };
      } else if (ch.type === 'order') {
        const toks = shuffledTokens(ch, 0); const bankEl = h('div', { class: 'bank', dir: 'rtl' }), lineEl = h('div', { class: 'answerline', dir: 'rtl', 'aria-label': 'Susunan jawabanmu' });
        const check = h('button', { class: 'primary', type: 'button', text: 'Periksa', disabled: true, onclick: () => { const res = evaluate(ch, line.map((t) => t.id)); show(res); } });
        const render = () => { clear(bankEl); clear(lineEl);
          bank.forEach((t) => bankEl.append(h('button', { class: 'tok', type: 'button', onclick: () => { bank.splice(bank.indexOf(t), 1); line.push(t); render(); } }, ar(t.ar))));
          line.forEach((t) => lineEl.append(h('button', { class: 'tok placed', type: 'button', 'aria-label': `Lepas ${t.ar}`, onclick: () => { line.splice(line.indexOf(t), 1); bank.push(t); render(); } }, ar(t.ar))));
          if (!line.length) lineEl.append(h('span', { class: 'ph', text: 'Ketuk kata di bawah untuk menyusun kalimat (dibaca dari kanan).' }));
          check.disabled = bank.length > 0; };
        bank.push(...toks); render(); body.append(lineEl, bankEl); actionRow.append(check);
      } else if (ch.type === 'short') {
        const inp = h('input', { class: 'ar-input', type: 'text', dir: 'rtl', lang: 'ar', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Jawaban dalam bahasa Arab', 'data-autofocus': true });
        const msg = h('p', { class: 'note', hidden: true });
        const send = () => { const res = evaluate(ch, inp.value); if (res.empty) return; if (res.typo) { msg.hidden = false; msg.textContent = 'Hampir benar — periksa lagi ejaannya, lalu coba kirim ulang.'; inp.focus(); return; } show(res, () => { inp.disabled = true; }); };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); send(); } });
        body.append(inp, msg); actionRow.append(h('button', { class: 'primary', type: 'button', text: 'Kirim', onclick: send }));
      }
      const hnd = this.modals.open({ label: 'Tantangan', variant: 'center challenge', dismiss: false, onClose: (v) => resolve(v ?? { correct: false, hints: hintLevel }), node: [
        h('p', { class: 'ch-topic', text: ({ vocab: 'Kosakata', nahwu: 'Nahwu', sarf: 'Sarf', integrated: 'Analisis terpadu' })[ch.strand] || 'Latihan' }),
        h('p', { class: 'ch-prompt', mixed: ch.prompt }), stim, body, hintBox, actionRow, fb] });
      if (onKey) hnd.layer.addEventListener('keydown', onKey);
    });
  }

  // ---------- journal ----------
  openJournal(session, tab = 'misi') {
    const j = session.journal(), help = this.s.help, tabs = { misi: 'Misi', petunjuk: 'Petunjuk', peta: 'Peta', tas: 'Tas' };
    const content = h('div', { class: 'tabpanel', role: 'tabpanel' });
    const bar = h('div', { class: 'tabs', role: 'tablist' });
    let hnd;
    const draw = (t) => {
      clear(content); [...bar.children].forEach((b) => { b.setAttribute('aria-selected', String(b.dataset.t === t)); });
      if (t === 'misi') {
        for (const q of j.quests) content.append(h('section', { class: 'quest' }, h('h3', {}, q.title, ' ', ar(q.ar, 'inline'), h('span', { class: 'tag', text: q.status === 'complete' ? 'selesai' : q.main ? 'utama' : 'sampingan' })),
          h('ul', { class: 'objs' }, q.objectives.map((o) => h('li', { class: o.done ? 'done' : o.available ? 'avail' : 'wait' },
            h('span', { class: 'ck', 'aria-hidden': 'true', text: o.done ? '✓' : o.available ? '▸' : '·' }),
            h('span', {}, h('span', { mixed: o.text }), o.optional ? h('em', { text: ' (opsional)' }) : null, o.done ? h('span', { class: 'sr', text: ' — selesai' }) : !o.available ? h('span', { class: 'sr', text: ' — belum tersedia' }) : null,
              o.available && !o.done && help !== 'low' && o.hint ? h('small', { class: 'sub', mixed: o.hint }) : null))))));
      } else if (t === 'petunjuk') {
        if (!j.clues.length) content.append(h('p', { class: 'empty', text: 'Belum ada petunjuk. Bicaralah dengan orang-orang dan periksa papan serta tanda.' }));
        for (const c of j.clues) content.append(h('article', { class: 'clue' }, h('h3', { text: c.title }), h('p', { class: 'line-ar' }, ar(c.ar)), this.s.translation ? h('p', { class: 'line-id', text: c.text }) : null, c.note ? h('p', { class: 'note', mixed: c.note }) : null));
      } else if (t === 'peta') {
        const cv = h('canvas', { class: 'map', width: 336, height: 276, role: 'img', 'aria-label': 'Peta Pasar Pagi. Daftar lokasi ada di bawah peta.' });
        content.append(cv, h('p', { class: 'legend' }, '▲ posisimu  ·  ◆ tujuan  ·  bingkai kuning = lokasi yang sudah ditemukan'),
          h('ul', { class: 'areas' }, j.areas.map((a) => h('li', { class: a.found ? 'found' : '' }, h('span', { 'aria-hidden': 'true', text: a.found ? '✓ ' : '? ' }), a.found ? [a.label, ' ', ar(a.ar, 'inline')] : 'Lokasi belum ditemukan', a.found ? null : h('span', { class: 'sr', text: ' (belum ditemukan)' })))));
        this.d.getRenderer().drawMap(cv, session, help);
      } else {
        content.append(h('p', { class: 'purse-line', text: `Dompet: ${j.purse} dirham` }));
        if (!j.bag.length) content.append(h('p', { class: 'empty', text: 'Tas kosong.' }));
        for (const b of j.bag) content.append(h('p', { class: 'bagrow' }, h('strong', { text: `${b.name}${b.n > 1 ? ' ×' + b.n : ''}` }), ' ', ar(b.ar, 'inline')));
      }
    };
    for (const [k, v] of Object.entries(tabs)) bar.append(h('button', { class: 'tab', type: 'button', role: 'tab', 'data-t': k, text: v, onclick: () => draw(k) }));
    hnd = this.modals.open({ label: 'Jurnal', variant: 'center wide', node: [h('div', { class: 'cardhead' }, h('h2', { text: 'Jurnal' }), h('button', { class: 'x', type: 'button', 'aria-label': 'Tutup jurnal', text: '✕', onclick: () => hnd.close() })), bar, content] });
    draw(tab); return hnd;
  }

  // ---------- lexicon ----------
  openLexicon(session) {
    const L = this.d.content.LEXICON, prog = session.lexicon; let q = '', topic = '', state = '';
    const list = h('ul', { class: 'lexlist' }), count = h('p', { class: 'note' });
    const draw = () => {
      clear(list); const qq = stripTashkeel(q.trim()).toLowerCase(); let n = 0;
      for (const e of L) {
        const p = prog[e.id]; if (!p) continue; const st = stateOf(p);
        if ((topic && e.topic !== topic) || (state && st !== state)) continue;
        if (qq && !(e.plain.includes(qq) || e.gloss.toLowerCase().includes(qq))) continue; n++;
        list.append(h('li', { class: 'lexrow' }, ar(e.ar, 'lexar'), h('span', { class: 'lexgl', text: e.gloss }), h('span', { class: 'tag', text: TOPIC_LABEL[e.topic] || e.topic }),
          h('span', { class: `tag st-${st}`, text: STATE_LABEL[st] }), p.weak ? h('span', { class: 'tag warn', text: '! perlu diulang' }) : null,
          e.review.status !== 'reviewed' ? h('span', { class: 'tag muted', title: 'Isi ini belum ditinjau ahli bahasa Arab.', text: 'draf' }) : null));
      }
      if (!n) list.append(h('li', { class: 'empty', text: Object.keys(prog).length ? 'Tidak ada kata yang cocok dengan filter.' : 'Belum ada kata. Bicaralah dengan penduduk pasar dan periksa papan.' }));
      count.textContent = `${Object.keys(prog).filter((id) => L.some((e) => e.id === id)).length} dari ${L.length} kata ditemukan.`;
    };
    const search = h('input', { type: 'search', class: 'search', placeholder: 'Cari Arab atau Indonesia', 'aria-label': 'Cari kata', oninput: (e) => { q = e.target.value; draw(); } });
    const topics = h('select', { 'aria-label': 'Filter topik', onchange: (e) => { topic = e.target.value; draw(); } }, h('option', { value: '', text: 'Semua topik' }), Object.entries(TOPIC_LABEL).map(([k, v]) => h('option', { value: k, text: v })));
    const states = h('select', { 'aria-label': 'Filter status belajar', onchange: (e) => { state = e.target.value; draw(); } }, h('option', { value: '', text: 'Semua status' }), Object.entries(STATE_LABEL).filter(([k]) => k !== 'unseen').map(([k, v]) => h('option', { value: k, text: v })));
    const hnd = this.modals.open({ label: 'Leksikon', variant: 'center wide', node: [h('div', { class: 'cardhead' }, h('h2', { text: 'Leksikon' }), h('button', { class: 'x', type: 'button', 'aria-label': 'Tutup leksikon', text: '✕', onclick: () => hnd.close() })),
      h('div', { class: 'filters' }, search, topics, states), count,
      h('button', { class: 'primary', type: 'button', text: 'Ronde ulasan (kata lemah dulu)', onclick: () => { hnd.close(); this.d.startReview?.(); } }), list] });
    draw();
  }

  // ---------- pause / settings / confirm ----------
  confirm(title, text, yes, no = 'Batal') {
    return new Promise((resolve) => { const hnd = this.modals.open({ label: title, variant: 'center small', onClose: (v) => resolve(!!v), node: [h('h2', { text: title }), h('p', { text }),
      h('div', { class: 'choices row' }, h('button', { class: 'danger', type: 'button', text: yes, onclick: () => hnd.close(true) }), h('button', { type: 'button', 'data-autofocus': true, text: no, onclick: () => hnd.close(false) }))] }); });
  }

  openPause(session, cb) {
    const btn = (t, f, primary) => h('button', { class: primary ? 'primary' : '', type: 'button', text: t, 'data-autofocus': primary || null, onclick: f });
    const hnd = this.modals.open({ label: 'Jeda', variant: 'center small', node: [h('h2', { text: 'Jeda' }), h('div', { class: 'menu' },
      btn('Lanjutkan', () => hnd.close(), true), btn('Jurnal', () => { hnd.close(); this.openJournal(session); }), btn('Leksikon', () => { hnd.close(); this.openLexicon(session); }),
      btn('Pengaturan', () => { hnd.close(); this.openSettings(); }),
      btn('Ulangi tahap ini', async () => { if (await this.confirm('Ulangi tahap?', 'Progres tahap ini (misi, tas, dompet) akan diulang dari awal. Kata di Leksikon tetap tersimpan.', 'Ulangi')) { hnd.close(); cb.restart(); } }),
      btn('Menu utama', () => { hnd.close(); cb.menu(); }))] });
  }

  openSettings() {
    const s = this.s, d = this.d;
    const sel = (key, label, opts) => h('label', { class: 'field' }, h('span', { text: label }), h('select', { onchange: (e) => d.applySettings({ [key]: e.target.value }) }, opts.map(([v, t]) => h('option', { value: v, text: t, selected: s[key] === v }))));
    const chk = (key, label) => h('label', { class: 'field check' }, h('input', { type: 'checkbox', checked: s[key] || null, onchange: (e) => d.applySettings({ [key]: e.target.checked }) }), h('span', { text: label }));
    const rng = (key, label, min, max, step) => h('label', { class: 'field' }, h('span', { text: label }), h('input', { type: 'range', min, max, step, value: s[key], oninput: (e) => d.applySettings({ [key]: +e.target.value }) }));
    const sample = h('p', { class: 'sample' }, ar('صَبَاحُ الْخَيْرِ يَا سُوقُ'));
    const hnd = this.modals.open({ label: 'Pengaturan', variant: 'center wide', node: [h('div', { class: 'cardhead' }, h('h2', { text: 'Pengaturan' }), h('button', { class: 'x', type: 'button', 'aria-label': 'Tutup pengaturan', text: '✕', onclick: () => hnd.close() })),
      h('div', { class: 'settings' },
        h('fieldset', {}, h('legend', { text: 'Teks' }), sel('arSize', 'Ukuran teks Arab', [['s', 'Kecil'], ['m', 'Sedang'], ['l', 'Besar'], ['xl', 'Sangat besar']]), sample, chk('translation', 'Tampilkan arti Indonesia di dialog dan petunjuk')),
        h('fieldset', {}, h('legend', { text: 'Kontrol' }), sel('control', 'Kontrol layar sentuh', [['auto', 'Otomatis (tampil di layar sentuh)'], ['joystick', 'Joystick analog'], ['dpad', 'Tombol arah (D-pad)']]), chk('leftHanded', 'Mode kidal (kontrol gerak di kanan)'),
          rng('padSize', 'Ukuran kontrol', 0.8, 1.4, 0.1), rng('padOpacity', 'Kejernihan kontrol', 0.3, 1, 0.05),
          sel('keyInteract', 'Tombol interaksi (papan ketik)', [['KeyE', 'E'], ['KeyF', 'F'], ['Space', 'Spasi'], ['Enter', 'Enter']]), sel('keyJournal', 'Tombol Jurnal', [['KeyJ', 'J'], ['KeyI', 'I'], ['Tab', 'Tab']])),
        h('fieldset', {}, h('legend', { text: 'Suara' }), rng('master', 'Volume utama', 0, 1, 0.05), rng('music', 'Musik dan suasana', 0, 1, 0.05), rng('sfx', 'Efek suara', 0, 1, 0.05), chk('mute', 'Bisukan semua suara')),
        h('fieldset', {}, h('legend', { text: 'Gerak dan bantuan' }), sel('reducedMotion', 'Kurangi gerakan', [['auto', 'Ikuti sistem'], ['on', 'Aktif'], ['off', 'Nonaktif']]), sel('shake', 'Guncangan layar', [['normal', 'Normal'], ['reduced', 'Dikurangi'], ['off', 'Mati']]),
          sel('help', 'Tingkat bantuan', [['low', 'Sedikit (tanpa penanda & petunjuk)'], ['normal', 'Normal'], ['high', 'Banyak (3 petunjuk per soal)']])),
        h('fieldset', {}, h('legend', { text: 'Data' }), h('button', { class: 'danger', type: 'button', text: 'Hapus semua progres…', onclick: async () => { if (await this.confirm('Hapus semua progres?', 'Misi, tas, dompet, Leksikon, dan pengaturan akan dihapus dari peramban ini. Ini tidak bisa dibatalkan.', 'Ya, hapus semuanya')) { hnd.close(); d.resetAll(); } } })))] });
  }

  // ---------- screens ----------
  showScreen(node) { const sc = clear(this.$('screen')); sc.hidden = false; sc.append(node); }
  hideScreen() { const sc = this.$('screen'); sc.hidden = true; clear(sc); }

  showResults(sum, cb) {
    const pct = sum.accuracy == null ? '—' : sum.accuracy + '%';
    const st = Object.entries(sum.wordStates || {}).map(([k, v]) => `${STATE_LABEL[k]}: ${v}`).join(' · ') || '—';
    const m = Math.floor(sum.seconds / 60), s = sum.seconds % 60;
    const node = h('div', { class: 'results', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Hasil tahap' },
      h('h1', { class: 'rtitle' }, 'Tahap selesai', ' ', ar('سُوقُ الصَّبَاحِ', 'inline')),
      h('div', { class: 'cols' },
        h('section', {}, h('h2', { text: 'Permainan' }), h('dl', {}, h('dt', { text: 'Waktu' }), h('dd', { text: `${m} mnt ${String(s).padStart(2, '0')} dtk` }), h('dt', { text: 'Dompet tersisa' }), h('dd', { text: `${sum.purse} dirham` }),
          h('dt', { text: 'Misi sampingan' }), h('dd', { text: sum.sideDone ? 'Selesai ✓' : 'Belum dikerjakan' }), h('dt', { text: 'Ronde latihan' }), h('dd', { text: sum.practiceDone ? 'Selesai ✓' : 'Belum dikerjakan' }))),
        h('section', {}, h('h2', { text: 'Belajar' }), h('p', { class: 'note', text: 'Angka ini hanya mencatat performamu dalam permainan, bukan penilaian kemampuan bahasa.' }),
          h('dl', {}, h('dt', { text: 'Jawaban benar' }), h('dd', { text: `${sum.right} dari ${sum.right + sum.wrong} (${pct})` }), h('dt', { text: 'Petunjuk dipakai' }), h('dd', { text: String(sum.hints) }), h('dt', { text: 'Kata ditemukan' }), h('dd', { text: String(sum.words) }), h('dt', { text: 'Status kata' }), h('dd', { text: st })),
          sum.weak.length ? h('p', {}, 'Perlu diulang: ', sum.weak.slice(0, 6).map((w) => [ar(w.ar, 'inline'), ' ']) ) : null)),
      h('div', { class: 'menu row' }, h('button', { class: 'primary', type: 'button', 'data-autofocus': true, text: 'Leksikon', onclick: cb.lexicon }), h('button', { type: 'button', text: 'Main ulang tahap', onclick: cb.replay }), h('button', { type: 'button', text: 'Menu utama', onclick: cb.menu }),
        h('button', { type: 'button', disabled: true, 'aria-disabled': 'true', text: 'Lorong Pedagang — belum tersedia' })),
      h('p', { class: 'note', text: 'Tahap berikutnya (أَزِقَّةُ التُّجَّارِ) belum dibuat dalam versi ini.' }));
    this.showScreen(node); node.querySelector('[data-autofocus]').focus();
  }

  fatal(err, cb) {
    this.setHudVisible(false);
    const node = h('div', { class: 'fatal', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': 'Terjadi kesalahan' }, h('h1', { text: 'Terjadi kesalahan' }),
      h('p', { text: 'Permainan berhenti karena galat. Progresmu yang sudah tersimpan tidak hilang.' }), h('pre', { text: String(err?.message || err).slice(0, 400) }),
      h('div', { class: 'menu row' }, h('button', { class: 'primary', type: 'button', 'data-autofocus': true, text: 'Muat ulang', onclick: () => location.reload() }), cb?.reset ? h('button', { class: 'danger', type: 'button', text: 'Hapus data & muat ulang', onclick: cb.reset }) : null));
    this.showScreen(node); node.querySelector('[data-autofocus]').focus();
  }
}
export { makeVocabChallenge, pickReview };
