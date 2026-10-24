// Tiny DOM helpers. All data-backed text goes through textContent: no innerHTML for content (KM-115).
// Wraps Arabic runs inside Indonesian text in bidi-isolated spans so punctuation and word order stay correct.
const AR_RUN = /[\u0600-\u06FF\u0750-\u077F][\u0600-\u06FF\u0750-\u077F\u064B-\u065F\s]*[\u0600-\u06FF\u0750-\u077F\u064B-\u065F]|[\u0600-\u06FF\u0750-\u077F]/g;
export function mixedNodes(text) {
  const out = []; let last = 0; const str = String(text ?? '');
  for (const m of str.matchAll(AR_RUN)) {
    if (m.index > last) out.push(document.createTextNode(str.slice(last, m.index)));
    const b = document.createElement('bdi'); b.dir = 'rtl'; b.lang = 'ar'; b.className = 'ar inline'; b.textContent = m[0]; out.push(b); last = m.index + m[0].length;
  }
  if (last < str.length) out.push(document.createTextNode(str.slice(last)));
  return out;
}
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'mixed') e.append(...mixedNodes(v));
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return e;
}
export const ar = (text, cls = '') => h('span', { class: ('ar ' + cls).trim(), dir: 'rtl', lang: 'ar', text });
export const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); return n; };

// Modal stack with focus trap + restore, Escape handling and aria-modal semantics.
export class Modals {
  constructor(root) { this.root = root; this.stack = []; }
  get count() { return this.stack.length; }
  open({ node, label, dismiss = true, variant = '', onClose }) {
    const prev = document.activeElement;
    const layer = h('div', { class: `layer ${variant}` });
    const card = h('div', { class: 'card', role: 'dialog', 'aria-modal': 'true', 'aria-label': label || 'Dialog', tabindex: '-1' }, node);
    layer.append(card); this.root.append(layer);
    const handle = { layer, card, closed: false, close: (val) => { if (handle.closed) return; handle.closed = true; this.stack = this.stack.filter((m) => m !== handle); layer.remove(); this.root.dataset.open = String(this.stack.length); try { prev?.focus?.({ preventScroll: true }); } catch { /* ignore */ } onClose?.(val); } };
    layer.addEventListener('keydown', (e) => {
      if (this.stack[this.stack.length - 1] !== handle) return;
      if (e.key === 'Escape' && dismiss) { e.preventDefault(); e.stopPropagation(); handle.close(null); return; }
      if (e.key === 'Tab') {
        const f = [...card.querySelectorAll('button:not([disabled]), input, select, [tabindex="0"]')].filter((x) => x.offsetParent !== null);
        if (!f.length) return; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    this.stack.push(handle); this.root.dataset.open = String(this.stack.length);
    queueMicrotask(() => { (card.querySelector('[data-autofocus]') || card.querySelector('button, input, select') || card).focus({ preventScroll: true }); });
    return handle;
  }
  closeAll() { [...this.stack].reverse().forEach((m) => m.close(null)); }
}
