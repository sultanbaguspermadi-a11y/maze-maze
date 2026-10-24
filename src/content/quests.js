// Quests, items and journal clues for the Morning Market (KM-044, KM-071).
export const ITEMS = {
  'item.dates': { name: 'Kurma', ar: 'تَمْر', lex: 'lex.tamr', icon: 'dates' },
  'item.bread': { name: 'Roti', ar: 'رَغِيفَانِ', lex: 'lex.raghif', icon: 'bread' },
  'item.jar': { name: 'Kendi besar', ar: 'جَرَّةٌ كَبِيرَةٌ', lex: 'lex.jarra', icon: 'jar' },
  'item.seal': { name: 'Segel pasar', ar: 'خَتْمُ السُّوقِ', lex: 'lex.khatm', icon: 'seal' },
  'item.key': { name: 'Kunci gudang', ar: 'مِفْتَاحُ الْمَخْزَنِ', lex: 'lex.miftah', icon: 'key' },
};

export const CLUES = {
  'clue.order': { title: 'Pesanan Hajjah Zainab', ar: 'أُرِيدُ تَمْرًا وَرَغِيفَيْنِ وَجَرَّةً كَبِيرَةً مِنَ السُّوقِ.', text: 'Aku mau kurma, dua roti, dan sebuah kendi besar dari pasar.' },
  'clue.curtain': { title: 'Jalan tersembunyi', ar: 'اِتَّبِعِ السِّتَارَةَ الزَّرْقَاءَ خَلْفَ الْفُرْنِ.', text: 'Ikuti tirai biru di belakang tungku roti.' },
  'clue.key': { title: 'Kunci yang hilang', ar: 'رُبَّمَا هُوَ فِي زُقَاقِ الصَّنَادِيقِ، قُرْبَ الشَّارِعِ الْغَرْبِيِّ.', text: 'Mungkin ada di gang peti, dekat jalan barat.' },
};

export const QUESTS = [
  {
    id: 'q.order', stage: 'morning', main: true, autoStart: true,
    title: 'Pesanan Hajjah Zainab', ar: 'طَلَبُ الْحَاجَّةِ زَيْنَب',
    onComplete: { flags: ['stage_morning_done'] },
    objectives: [
      { id: 'o_talk', type: 'talk', target: 'npc.zainab', grants: ['order_received'],
        text: 'Temui Hajjah Zainab di lorong selatan.', hint: 'Dia berdiri tidak jauh dari gerbang.' },
      { id: 'o_pay_dates', type: 'answer', target: 'ch.price.dates', requiresFlags: ['order_received'], grants: ['paid_dates'],
        text: 'Bayar kurma kepada penjual kurma (Lorong Barat).', hint: 'Papan harga ada di samping kios.' },
      { id: 'o_get_dates', type: 'collect', target: 'item.dates', requires: ['o_pay_dates'],
        text: 'Ambil keranjang yang berlabel تَمْر.', hint: 'Baca label — bukan semua keranjang berisi kurma.' },
      { id: 'o_pay_bread', type: 'answer', target: 'ch.price.bread', requiresFlags: ['order_received'], grants: ['paid_bread'],
        text: 'Bayar dua roti kepada tukang roti (Lorong Roti).', hint: 'Dari alun-alun, ke utara.' },
      { id: 'o_get_bread', type: 'collect', target: 'item.bread', requires: ['o_pay_bread'],
        text: 'Ambil papan roti yang berarti "dua roti".', hint: 'Cari akhiran mutsanna pada رَغِيف.' },
      { id: 'o_pay_jar', type: 'answer', target: 'ch.price.jar', requiresFlags: ['order_received'], grants: ['paid_jar'],
        text: 'Bayar kendi besar kepada pembawa air (Halaman Timur).', hint: 'Lewati lengkung di sisi timur alun-alun.' },
      { id: 'o_get_jar', type: 'collect', target: 'item.jar', requires: ['o_pay_jar'],
        text: 'Ambil kendi yang berlabel "satu, besar".', hint: 'Sifat harus sepadan dengan kendinya (jenis dan jumlah).' },
      { id: 'o_deliver', type: 'deliver', target: 'npc.zainab', requires: ['o_get_dates', 'o_get_bread', 'o_get_jar'], grants: ['order_delivered'],
        text: 'Antarkan ketiga barang kepada Hajjah Zainab.', hint: 'Dia masih di lorong selatan.' },
      { id: 'o_exit', type: 'reach', target: 'area.exit', requires: ['o_deliver'],
        text: 'Lewati tirai biru di belakang tungku roti.', hint: 'Lorong Roti, di belakang tungku besar.' },
      { id: 'o_practice', type: 'answer', target: 'practice.round', optional: true,
        text: 'Selesaikan satu ronde di Papan Latihan alun-alun.', hint: 'Papan di sisi timur alun-alun.' },
    ],
  },
  {
    id: 'q.key', stage: 'morning', main: false, optional: true, autoStart: false,
    title: 'Kunci si pengrajin tembikar', ar: 'مِفْتَاحُ الْخَزَّافِ',
    objectives: [
      { id: 'o_find', type: 'collect', target: 'item.key', requiresFlags: ['potter_asked'],
        text: 'Temukan kunci gudang yang hilang.', hint: 'Cari di gang sempit sebelah barat, di balik tumpukan peti.' },
      { id: 'o_return', type: 'deliver', target: 'npc.potter', requires: ['o_find'], grants: ['key_returned'],
        text: 'Kembalikan kunci kepada pengrajin tembikar (Halaman Timur).', hint: 'Dia bekerja di sebelah kios air.' },
    ],
  },
];
