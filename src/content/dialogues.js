// NPC dialogue trees (KM-041). Effects: flag, start, give, take, deliver, pay, discover, clue, pack, toast, event.
// Arabic lines are authored drafts (review.status "draft"): see docs/CONTENT_GUIDE.md.
const when = (...c) => c;

export const DIALOGUES = {
  zainab: {
    npc: 'npc.zainab',
    entries: [
      { when: when({ flag: 'order_delivered' }), node: 'done' },
      { when: when({ item: 'item.dates' }, { item: 'item.bread' }, { item: 'item.jar' }), node: 'deliver' },
      { when: when({ flag: 'order_received' }), node: 'reminder' },
      { node: 'intro' },
    ],
    nodes: {
      intro: { ar: 'صَبَاحُ الْخَيْرِ! أَنَا الْحَاجَّةُ زَيْنَب.', text: 'Selamat pagi! Aku Hajjah Zainab.', lex: ['lex.sabah_alkhayr'], next: 'intro2' },
      intro2: { ar: 'أُرِيدُ تَمْرًا وَرَغِيفَيْنِ وَجَرَّةً كَبِيرَةً مِنَ السُّوقِ.', text: 'Aku mau kurma, dua roti, dan sebuah kendi besar dari pasar.',
        lex: ['lex.urid', 'lex.tamr', 'lex.raghif', 'lex.jarra', 'lex.kabir', 'lex.suq'], effects: [{ clue: 'clue.order' }], next: 'intro3' },
      intro3: { ar: 'هَذِهِ عَشَرَةُ دَرَاهِمَ.', text: 'Ini sepuluh dirham untuk belanja. Harga ada di papan tiap kios.', lex: ['lex.ashara', 'lex.dirham'],
        choices: [{ text: 'Aku mengerti.', end: true }, { text: 'Ulangi pesanannya.', next: 'intro2' }] },
      reminder: { ar: 'هَلْ مَعَكَ التَّمْرُ وَالرَّغِيفَانِ وَالْجَرَّةُ؟', text: 'Apakah kamu sudah membawa kurma, dua roti, dan kendinya?', lex: ['lex.hal'],
        choices: [{ text: 'Lihat lagi pesanannya.', next: 'intro2' }, { text: 'Aku segera kembali.', end: true }] },
      deliver: { ar: 'رَائِع! مَعَكَ كُلُّ شَيْءٍ.', text: 'Hebat! Kamu membawa semuanya.', lex: ['lex.kull_shay'],
        effects: [{ deliver: { to: 'npc.zainab', items: ['item.dates', 'item.bread', 'item.jar'] } }], next: 'thanks' },
      thanks: { ar: 'شُكْرًا جَزِيلًا! هَذَا خَتْمُ السُّوقِ.', text: 'Terima kasih banyak! Ini segel pasar.', lex: ['lex.shukran', 'lex.khatm'],
        effects: [{ give: { item: 'item.seal', qty: 1 } }], next: 'thanks2' },
      thanks2: { ar: 'اِتَّبِعِ السِّتَارَةَ الزَّرْقَاءَ خَلْفَ الْفُرْنِ.', text: 'Ikuti tirai biru di belakang tungku roti.',
        lex: ['lex.sitara', 'lex.zarqa', 'lex.khalf', 'lex.furn'], effects: [{ clue: 'clue.curtain' }, { toast: 'Jalan baru terbuka: tirai biru di Lorong Roti.' }], end: true },
      done: { ar: 'مَعَ السَّلَامَةِ!', text: 'Selamat jalan! Tirai biru ada di belakang tungku.', lex: ['lex.maa_salama'], end: true },
    },
  },

  abu_salih: {
    npc: 'npc.abu_salih',
    entries: [
      { when: when({ flag: 'paid_dates' }), node: 'after' },
      { when: when({ flag: 'order_received' }), node: 'sell' },
      { node: 'hello' },
    ],
    nodes: {
      hello: { ar: 'أَهْلًا وَسَهْلًا! التَّمْرُ طَازَجٌ الْيَوْمَ.', text: 'Selamat datang! Kurmanya segar hari ini.', lex: ['lex.ahlan', 'lex.tamr', 'lex.tazaj'], end: true },
      sell: { ar: 'أَهْلًا وَسَهْلًا! مَاذَا تُرِيدُ؟', text: 'Selamat datang! Kamu mau apa?', lex: ['lex.madha'],
        choices: [
          { ar: 'أُرِيدُ تَمْرًا.', text: 'Aku mau kurma.', next: 'price' },
          { ar: 'أُرِيدُ تِينًا.', text: 'Aku mau buah ara.', next: 'wrong_fig' },
          { ar: 'لَا شَيْءَ، شُكْرًا.', text: 'Tidak ada, terima kasih.', end: true },
        ] },
      wrong_fig: { ar: 'تِينٌ؟ هَلْ هُوَ فِي قَائِمَتِكَ؟', text: 'Buah ara? Apakah ada di daftarmu?', lex: ['lex.tin', 'lex.qaima'], next: 'sell' },
      price: { ar: 'التَّمْرُ بِثَلَاثَةِ دَرَاهِمَ. اُنْظُرْ إِلَى اللَّوْحَةِ.', text: 'Kurma harganya tiga dirham. Lihat papannya.', lex: ['lex.thalatha', 'lex.dirham', 'lex.lawha'],
        next: 'pay' },
      pay: { challenge: { id: 'ch.price.dates', onCorrect: 'paid', onWrong: 'retry' } },
      retry: { ar: 'لَا، اُنْظُرْ إِلَى اللَّوْحَةِ مَرَّةً أُخْرَى.', text: 'Bukan. Lihat papan harganya sekali lagi.', next: 'pay' },
      paid: { ar: 'تَفَضَّلْ! خُذِ التَّمْرَ.', text: 'Silakan! Ambil kurmanya (keranjang berlabel kurma di kiosku).', lex: ['lex.tafaddal'],
        effects: [{ pay: 3 }, { toast: 'Dibayar 3 dirham. Ambil keranjang kurma.' }], end: true },
      after: { ar: 'شُكْرًا! مَعَ السَّلَامَةِ.', text: 'Terima kasih! Selamat jalan.', lex: ['lex.shukran'], end: true },
    },
  },

  khabbaz: {
    npc: 'npc.khabbaz',
    entries: [
      { when: when({ flag: 'paid_bread' }), node: 'after' },
      { when: when({ flag: 'order_received' }), node: 'sell' },
      { node: 'hello' },
    ],
    nodes: {
      hello: { ar: 'الْخُبْزُ سَاخِنٌ!', text: 'Rotinya masih panas!', lex: ['lex.khubz', 'lex.sakhin'], end: true },
      sell: { ar: 'أَهْلًا! مَاذَا تُرِيدُ؟', text: 'Selamat datang! Kamu mau apa?',
        choices: [
          { ar: 'أُرِيدُ رَغِيفَيْنِ.', text: 'Aku mau dua roti.', next: 'price' },
          { ar: 'أُرِيدُ رَغِيفًا وَاحِدًا.', text: 'Aku mau satu roti.', next: 'wrong_one' },
        ] },
      wrong_one: { ar: 'رَغِيفٌ وَاحِدٌ؟ اِقْرَأِ الْقَائِمَةَ مَرَّةً أُخْرَى.', text: 'Satu roti? Baca daftarmu sekali lagi.', lex: ['lex.wahid', 'lex.yaqra'], next: 'sell' },
      price: { ar: 'الرَّغِيفَانِ بِدِرْهَمَيْنِ.', text: 'Dua roti seharga dua dirham.', lex: ['lex.raghif', 'lex.dirham'], next: 'pay' },
      pay: { challenge: { id: 'ch.price.bread', onCorrect: 'paid', onWrong: 'retry' } },
      retry: { ar: 'لَا، اُنْظُرْ إِلَى اللَّوْحَةِ.', text: 'Bukan. Lihat papannya.', next: 'pay' },
      paid: { ar: 'تَفَضَّلْ! الرَّغِيفَانِ سَاخِنَانِ.', text: 'Silakan! Kedua rotinya panas. Ambil papan "dua roti".', lex: ['lex.tafaddal'],
        effects: [{ pay: 2 }, { toast: 'Dibayar 2 dirham. Ambil roti dari etalase.' }], end: true },
      after: { ar: 'شُكْرًا! مَعَ السَّلَامَةِ.', text: 'Terima kasih! Selamat jalan.', end: true },
    },
  },

  saqqa: {
    npc: 'npc.saqqa',
    entries: [
      { when: when({ flag: 'paid_jar' }), node: 'after' },
      { when: when({ flag: 'order_received' }), node: 'sell' },
      { node: 'hello' },
    ],
    nodes: {
      hello: { ar: 'الْمَاءُ بَارِدٌ وَالْجَرَّةُ ثَقِيلَةٌ.', text: 'Airnya dingin dan kendinya berat.', lex: ['lex.ma', 'lex.barid', 'lex.thaqil'], end: true },
      sell: { ar: 'أَهْلًا! مَاذَا تُرِيدُ؟', text: 'Selamat datang! Kamu mau apa?',
        choices: [
          { ar: 'أُرِيدُ جَرَّةً كَبِيرَةً.', text: 'Aku mau sebuah kendi besar.', next: 'price' },
          { ar: 'أُرِيدُ جَرَّةً صَغِيرَةً.', text: 'Aku mau sebuah kendi kecil.', next: 'wrong_small' },
        ] },
      wrong_small: { ar: 'صَغِيرَةً؟ اِقْرَأْ قَائِمَتَكَ.', text: 'Kecil? Baca daftarmu.', lex: ['lex.saghir'], next: 'sell' },
      price: { ar: 'الْجَرَّةُ الْكَبِيرَةُ بِخَمْسَةِ دَرَاهِمَ.', text: 'Kendi besar seharga lima dirham.', lex: ['lex.khamsa', 'lex.dirham'], next: 'pay' },
      pay: { challenge: { id: 'ch.price.jar', onCorrect: 'paid', onWrong: 'retry' } },
      retry: { ar: 'لَا، اُنْظُرْ إِلَى اللَّوْحَةِ.', text: 'Bukan. Lihat papannya.', next: 'pay' },
      paid: { ar: 'تَفَضَّلْ! اِحْمِلْهَا بِحَذَرٍ.', text: 'Silakan! Bawalah dengan hati-hati. Ambil kendi yang tepat dari deretan.', lex: ['lex.yahmil'],
        effects: [{ pay: 5 }, { toast: 'Dibayar 5 dirham. Pilih kendi yang sesuai pesanan.' }], end: true },
      after: { ar: 'شُكْرًا! مَعَ السَّلَامَةِ.', text: 'Terima kasih! Selamat jalan.', end: true },
    },
  },

  potter: {
    npc: 'npc.potter',
    entries: [
      { when: when({ flag: 'key_returned' }), node: 'thanks' },
      { when: when({ item: 'item.key' }), node: 'return' },
      { when: when({ flag: 'potter_asked' }), node: 'waiting' },
      { node: 'ask' },
    ],
    nodes: {
      ask: { ar: 'ضَاعَ مِفْتَاحُ الْمَخْزَنِ! هَلْ رَأَيْتَهُ؟', text: 'Kunci gudangku hilang! Apa kamu melihatnya?', lex: ['lex.miftah', 'lex.makhzan'],
        effects: [{ flag: 'potter_asked' }, { start: 'q.key' }], next: 'ask2' },
      ask2: { ar: 'رُبَّمَا هُوَ فِي زُقَاقِ الصَّنَادِيقِ، قُرْبَ الشَّارِعِ الْغَرْبِيِّ.', text: 'Mungkin ada di gang peti, dekat jalan barat.',
        lex: ['lex.zuqaq', 'lex.sunduq', 'lex.qurb', 'lex.shari', 'lex.gharbi'], effects: [{ clue: 'clue.key' }, { toast: 'Misi sampingan: kunci si pengrajin.' }], end: true },
      waiting: { ar: 'اُبْحَثْ خَلْفَ الصَّنَادِيقِ.', text: 'Carilah di balik peti-peti.', lex: ['lex.khalf'], end: true },
      return: { ar: 'هَذَا هُوَ الْمِفْتَاحُ! شُكْرًا لَكَ.', text: 'Inilah kuncinya! Terima kasih.', lex: ['lex.shukran'],
        effects: [{ deliver: { to: 'npc.potter', items: ['item.key'] } }], next: 'reward' },
      reward: { ar: 'خُذْ هَذِهِ الْكَلِمَاتِ هَدِيَّةً.', text: 'Terimalah kata-kata ini sebagai hadiah.', lex: ['lex.hadiyya'],
        effects: [{ pack: 'pottery' }, { toast: 'Hadiah: 6 kata tembikar masuk ke Leksikon.' }], end: true },
      thanks: { ar: 'مَعَ السَّلَامَةِ!', text: 'Selamat jalan!', lex: ['lex.maa_salama'], end: true },
    },
  },
};
