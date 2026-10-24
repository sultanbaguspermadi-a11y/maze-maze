// Stage 1 — سُوقُ الصَّبَاحِ (Morning Market). Authored layout (KM-070).
// Composition: south gate → lane → central plaza (fountain landmark) with three destinations:
// west lane (dates + optional crate alley), east courtyard (water + potter, reached through an arch),
// north bread aisle whose oven hides the blue curtain that leads out of the stage.
const W = 56, H = 46;
const g = Array.from({ length: H }, () => Array(W).fill('#'));
const fill = (x, y, w, h, ch) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = ch; };

fill(18, 39, 20, 5, '.'); fill(26, 44, 4, 1, '.');      // gate forecourt + threshold
fill(22, 33, 12, 6, '.');                                // south lane
fill(14, 18, 28, 15, 'p');                               // plaza
fill(5, 19, 8, 20, '.'); fill(13, 24, 1, 6, '.');        // west lane + opening to plaza
fill(2, 22, 2, 15, 's'); fill(4, 34, 1, 2, 's');         // crate alley + opening to west lane
fill(44, 19, 10, 18, 't'); fill(42, 25, 2, 4, 't');      // east courtyard + archway
fill(22, 9, 12, 9, '.');                                 // north bread aisle
fill(26, 3, 4, 5, 'k'); fill(27, 8, 2, 1, 'k');          // hidden passage + curtain tiles

const stall = (id, x, y, w, variant) => ({ id, type: 'stall', variant, x, y, w, h: 2 });
const one = (id, type, x, y) => ({ id, type, x, y, w: 1, h: 1 });

const ART = { 'gd.a': 'fig', 'gd.b': 'dates', 'gd.c': 'grape', 'gb.a': 'bread1', 'gb.b': 'bread2', 'gb.c': 'bread3', 'gw.a': 'jar-s', 'gw.b': 'jar-twin', 'gw.c': 'jar-l' };
const lookZ = { skin: '#c68b5c', top: '#6a3f7a', trim: '#e8c36a', hair: '#e9e4d8', scarf: '#6a3f7a' };

export const STAGE_MORNING = {
  id: 'morning', v: 1, name: 'Pasar Pagi', ar: 'سُوقُ الصَّبَاحِ', tile: 16, w: W, h: H,
  grid: g.map((r) => r.join('')),
  legend: { '#': { solid: true }, '.': {}, p: {}, s: {}, t: {}, w: {}, k: {} },
  spawn: { x: 27, y: 42 },
  areas: [
    { id: 'area.gate', label: 'Gerbang Pasar', ar: 'بَوَّابَةُ السُّوقِ', rect: { x: 18, y: 39, w: 20, h: 5 } },
    { id: 'area.lane', label: 'Lorong Selatan', ar: 'الزُّقَاقُ الْجَنُوبِيُّ', rect: { x: 22, y: 33, w: 12, h: 6 } },
    { id: 'area.plaza', label: 'Alun-alun', ar: 'السَّاحَةُ', rect: { x: 14, y: 18, w: 28, h: 15 } },
    { id: 'area.west', label: 'Lorong Barat', ar: 'الشَّارِعُ الْغَرْبِيُّ', rect: { x: 5, y: 19, w: 8, h: 20 } },
    { id: 'area.alley', label: 'Gang Peti', ar: 'زُقَاقُ الصَّنَادِيقِ', rect: { x: 2, y: 22, w: 2, h: 15 } },
    { id: 'area.east', label: 'Halaman Timur', ar: 'الْفِنَاءُ الشَّرْقِيُّ', rect: { x: 44, y: 19, w: 10, h: 18 } },
    { id: 'area.bread', label: 'Lorong Roti', ar: 'زُقَاقُ الْخَبَّازِ', rect: { x: 22, y: 9, w: 12, h: 9 } },
    { id: 'area.exit', label: 'Jalan Tersembunyi', ar: 'الطَّرِيقُ الْخَفِيُّ', rect: { x: 26, y: 3, w: 4, h: 5 } },
  ],
  decals: [
    { type: 'rug', x: 33, y: 31, w: 6, h: 2, pal: 'teal' }, { type: 'rug', x: 15, y: 31, w: 6, h: 2, pal: 'wine' },
    { type: 'rug', x: 25, y: 37, w: 4, h: 2, pal: 'saffron' }, { type: 'rug', x: 7, y: 21, w: 4, h: 1, pal: 'teal' },
    { type: 'rug', x: 45, y: 21, w: 4, h: 1, pal: 'wine' },
  ],
  props: [
    stall('stall.dates', 5, 19, 5, 'dates'), stall('stall.bread', 30, 10, 4, 'bread'),
    stall('stall.water', 44, 19, 5, 'water'), stall('stall.potter', 50, 19, 4, 'pots'),
    stall('stall.spice', 16, 29, 4, 'spice'), stall('stall.fabric', 34, 29, 4, 'fabric'),
    { id: 'oven', type: 'oven', x: 25, y: 10, w: 4, h: 2 },
    { id: 'fountain', type: 'fountain', x: 26, y: 23, w: 4, h: 4 },
    { id: 'well', type: 'well', x: 47, y: 26, w: 3, h: 3 },
    one('palm.1', 'palm', 16, 21), one('palm.2', 'palm', 39, 21), one('palm.3', 'palm', 39, 30), one('palm.4', 'palm', 52, 33),
    { id: 'board.practice', type: 'noticeboard', x: 37, y: 23, w: 2, h: 1 },
    one('pb.dates', 'priceboard', 11, 20), one('pb.bread', 'priceboard', 29, 11), one('pb.water', 'priceboard', 49, 20),
    { id: 'crates.w', type: 'crate', x: 5, y: 27, w: 2, h: 2 },
    one('barrel.1', 'barrel', 11, 22), one('barrel.2', 'barrel', 12, 22), one('sack.1', 'sack', 11, 30), one('sack.2', 'sack', 12, 30),
    one('jars.w', 'jarstack', 9, 35), { id: 'cart.s', type: 'cart', x: 29, y: 35, w: 3, h: 2 }, one('barrel.3', 'barrel', 23, 34),
    one('barrel.4', 'barrel', 19, 40), one('barrel.5', 'barrel', 36, 40), one('crate.f', 'crate', 19, 41),
    one('crate.a1', 'crate', 2, 30), one('crate.a2', 'crate', 3, 27), one('crate.a3', 'crate', 2, 24),
    one('jars.e1', 'jarstack', 52, 24), one('jars.e2', 'jarstack', 44, 31), { id: 'shelf.e', type: 'potshelf', x: 52, y: 28, w: 2, h: 2 },
    { id: 'gatearch', type: 'gatearch', x: 26, y: 44, w: 4, h: 1, solid: false },
    { id: 'exitdoor', type: 'exitdoor', x: 26, y: 2, w: 4, h: 1, solid: false },
  ],
  foreground: [
    { type: 'beam', x: 22, y: 34, w: 12, h: 1 }, { type: 'beam', x: 22, y: 17, w: 12, h: 1 },
    { type: 'arch', x: 42, y: 25, w: 2, h: 4 }, { type: 'arch', x: 13, y: 24, w: 1, h: 6 },
    ...['stall.dates', 'stall.bread', 'stall.water', 'stall.potter', 'stall.spice', 'stall.fabric'].map((id, i) => ({ type: 'awning', stall: id, i })),
  ],
  gates: [{ id: 'gate.curtain', type: 'curtain', x: 27, y: 8, w: 2, h: 1, opensWhen: { flag: 'order_delivered' } }],
  lights: [
    { x: 27, y: 12.2, r: 60, color: '#ff9a3c', flicker: true }, { x: 28, y: 34.4, r: 44, color: '#ffc866' },
    { x: 28, y: 17.4, r: 44, color: '#ffc866' }, { x: 42.5, y: 24.6, r: 30, color: '#ffc866' }, { x: 13.5, y: 23.6, r: 30, color: '#ffc866' },
    { x: 3, y: 22.5, r: 26, color: '#ffc866' },
  ],
  npcs: [
    { id: 'npc.zainab', name: 'Hajjah Zainab', ar: 'الْحَاجَّةُ زَيْنَب', x: 24, y: 36, dialogue: 'zainab', look: lookZ,
      emits: [{ type: 'deliver', target: 'npc.zainab', when: [{ item: 'item.dates' }, { item: 'item.bread' }, { item: 'item.jar' }] }] },
    { id: 'npc.abu_salih', name: 'Abu Salih', ar: 'أَبُو صَالِح', x: 8, y: 19, behind: true, anchor: { x: 8, y: 20 }, dialogue: 'abu_salih',
      look: { skin: '#b97a4f', top: '#7a5a2a', trim: '#e8d9a8', hair: '#f2efe6', cap: '#f2efe6' },
      emits: [{ type: 'answer', target: 'ch.price.dates', when: [{ flag: 'order_received' }] }] },
    { id: 'npc.khabbaz', name: 'Pak Khabbaz', ar: 'الْخَبَّازُ', x: 31, y: 10, behind: true, anchor: { x: 31, y: 11 }, dialogue: 'khabbaz',
      look: { skin: '#d09a6a', top: '#e9e2d0', trim: '#c9b98e', hair: '#3a2a22', cap: '#e9e2d0' },
      emits: [{ type: 'answer', target: 'ch.price.bread', when: [{ flag: 'order_received' }] }] },
    { id: 'npc.saqqa', name: 'Pak Saqqa', ar: 'السَّقَّاءُ', x: 46, y: 19, behind: true, anchor: { x: 46, y: 20 }, dialogue: 'saqqa',
      look: { skin: '#a96b42', top: '#2f6f8f', trim: '#9fd0dc', hair: '#2a1d18', cap: '#2f6f8f' },
      emits: [{ type: 'answer', target: 'ch.price.jar', when: [{ flag: 'order_received' }] }] },
    { id: 'npc.potter', name: 'Bu Khazzaf', ar: 'الْخَزَّافُ', x: 51, y: 19, behind: true, anchor: { x: 51, y: 20 }, dialogue: 'potter',
      look: { skin: '#c48a5a', top: '#a5622e', trim: '#e0b070', hair: '#4a2f22', scarf: '#a5622e' },
      emits: [{ type: 'flag', target: 'potter_asked' }, { type: 'start', target: 'q.key' },
        { type: 'deliver', target: 'npc.potter', when: [{ item: 'item.key' }] }] },
  ],
  interactables: [
    { id: 'insp.gate_sign', kind: 'inspect', x: 26, y: 43, w: 4, h: 1, title: 'Gerbang pasar', ar: 'سُوقُ الصَّبَاحِ', text: 'Pasar Pagi.',
      note: 'صَبَاح = pagi, سُوق = pasar. Dua kata ini membentuk idhafah: "pasar pagi".', lex: ['lex.suq', 'lex.sabah'] },
    { id: 'insp.fountain', kind: 'inspect', x: 26, y: 23, w: 4, h: 4, anchor: { x: 27, y: 27 }, title: 'Air mancur pasar', ar: 'نَافُورَةُ السُّوقِ',
      text: 'Air mancur pasar, tempat orang berkumpul.', lex: ['lex.nafura', 'lex.suq', 'lex.ma'] },
    { id: 'insp.board_dates', kind: 'inspect', x: 11, y: 20, clue: true, title: 'Papan harga kurma', ar: 'التَّمْرُ بِثَلَاثَةِ دَرَاهِمَ', text: 'Kurma: tiga dirham.',
      lex: ['lex.tamr', 'lex.thalatha', 'lex.dirham'] },
    { id: 'insp.board_bread', kind: 'inspect', x: 29, y: 11, clue: true, title: 'Papan harga roti', ar: 'الرَّغِيفَانِ بِدِرْهَمَيْنِ', text: 'Dua roti: dua dirham.',
      note: 'Akhiran ـَانِ / ـَيْنِ menandai mutsanna (dua).', lex: ['lex.raghif', 'lex.dirham'] },
    { id: 'insp.board_water', kind: 'inspect', x: 49, y: 20, clue: true, title: 'Papan harga kendi', ar: 'الْجَرَّةُ الْكَبِيرَةُ بِخَمْسَةِ دَرَاهِمَ', text: 'Kendi besar: lima dirham.',
      note: 'Sifat (الْكَبِيرَةُ) sepadan dengan kata yang disifati (الْجَرَّةُ): sama-sama muannats dan memakai ال.', lex: ['lex.jarra', 'lex.kabir', 'lex.khamsa'] },
    { id: 'insp.curtain', kind: 'inspect', x: 27, y: 8, w: 2, h: 1, visibleWhen: [{ notFlag: 'order_delivered' }], title: 'Tirai biru',
      ar: 'مُغْلَقٌ', text: 'Tirai biru tertutup rapat. Mungkin segel pasar bisa membukanya.', lex: ['lex.sitara'] },
    { id: 'insp.alley_sign', kind: 'inspect', x: 3, y: 22, title: 'Papan gang', ar: 'زُقَاقُ الصَّنَادِيقِ', text: 'Gang Peti.', lex: ['lex.zuqaq', 'lex.sunduq'] },
    { id: 'pk.key', kind: 'pickup', x: 2, y: 22, item: 'item.key', requires: [{ flag: 'potter_asked' }], title: 'Kunci perunggu',
      blockedText: 'Ada kunci kecil di sini, tetapi belum jelas milik siapa.' },
    { id: 'prac.board', kind: 'practice', x: 37, y: 23, w: 2, h: 1, title: 'Papan Latihan Pasar', ar: 'لَوْحَةُ التَّدْرِيبِ' },
    // goods on counters (each stall: one right answer, two distractors)
    ...[
      ['gd.a', 5, 20, 'تِينٌ', 'lex.tin', 'buah ara', null, 'paid_dates', 'dates'],
      ['gd.b', 6, 20, 'تَمْرٌ', 'lex.tamr', 'kurma', 'item.dates', 'paid_dates', 'dates'],
      ['gd.c', 7, 20, 'عِنَبٌ', 'lex.inab', 'anggur', null, 'paid_dates', 'dates'],
      ['gb.a', 30, 11, 'رَغِيفٌ وَاحِدٌ', 'lex.raghif', 'satu roti', null, 'paid_bread', 'bread'],
      ['gb.b', 32, 11, 'رَغِيفَانِ', 'lex.raghif', 'dua roti', 'item.bread', 'paid_bread', 'bread'],
      ['gb.c', 33, 11, 'ثَلَاثَةُ أَرْغِفَةٍ', 'lex.raghif', 'tiga roti', null, 'paid_bread', 'bread'],
      ['gw.a', 44, 20, 'جَرَّةٌ صَغِيرَةٌ', 'lex.jarra', 'satu kendi kecil', null, 'paid_jar', 'water'],
      ['gw.b', 45, 20, 'جَرَّتَانِ صَغِيرَتَانِ', 'lex.jarra', 'dua kendi kecil', null, 'paid_jar', 'water'],
      ['gw.c', 47, 20, 'جَرَّةٌ كَبِيرَةٌ', 'lex.jarra', 'satu kendi besar', 'item.jar', 'paid_jar', 'water'],
    ].map(([id, x, y, ar, lex, meaning, item, flag, stallKind]) => ({
      id, kind: 'goods', art: ART[id], x, y, ar, lex, meaning, item, qty: item === 'item.bread' ? 2 : 1, stallKind, requires: [{ flag }],
    })),
  ],
  triggers: [{ id: 'trg.exit', rect: { x: 26, y: 3, w: 4, h: 2 }, required: true, emits: [{ type: 'reach', target: 'area.exit' }] }],
  wanderers: [
    { id: 'wd.a', look: { skin: '#b57a50', top: '#3f6f5a', trim: '#d9c98a', hair: '#2a1d18', cap: '#3f6f5a' }, path: [[16, 31], [38, 31]], speed: 20 },
    { id: 'wd.b', look: { skin: '#d09a6a', top: '#8a3f4a', trim: '#e8c36a', hair: '#2a1d18', scarf: '#8a3f4a' }, path: [[8, 23], [8, 35]], speed: 16 },
  ],
};
