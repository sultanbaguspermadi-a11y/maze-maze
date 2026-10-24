// Authored challenge bank for the Morning Market (KM-054/055/058–060, partial).
// All items are review.status "draft": Arabic, keys and rationales still need a qualified reviewer (KM-062/114).
// Explanations are in Indonesian. `strand` = vocab | nahwu | sarf | integrated.

const PROV = { kind: 'authored', source: null, note: 'Authored for this project; no external reference cited.' };
const REV = { status: 'draft', reviewer: null, date: null };
const base = (o) => ({ v: 1, stage: 'morning', provenance: PROV, review: REV, ...o });
const opts = (...a) => a.map(([id, ar, text]) => ({ id, ar, text }));

export const CHALLENGES = [
  // ---- quest-bound price challenges (taught by the price boards + vendor dialogue first) ----
  base({ id: 'ch.price.dates', type: 'choice', strand: 'vocab', topic: 'vocab.numbers', difficulty: 1, direction: 'context',
    prompt: 'Penjual menyebut harga. Berapa dirham yang harus dibayar?', ar: 'بِثَلَاثَةِ دَرَاهِمَ',
    options: opts(['a', null, '2 dirham'], ['b', null, '3 dirham'], ['c', null, '5 dirham']), answer: 'b',
    rationale: 'ثَلَاثَة = tiga. Huruf بِ di depan harga berarti "seharga".',
    optionFeedback: { a: 'اِثْنَان = dua, bukan ثَلَاثَة.', c: 'خَمْسَة = lima, bukan ثَلَاثَة.' },
    hints: ['Hitung: وَاحِد، اِثْنَان، ثَلَاثَة…', 'Papan harga kurma di sebelah kios juga memuat angka ini.'],
    lex: ['lex.thalatha', 'lex.dirham'], prerequisites: ['lex.thalatha', 'lex.dirham'], misconception: 'number-confusion' }),
  base({ id: 'ch.price.bread', type: 'choice', strand: 'sarf', topic: 'sarf.dual', difficulty: 2, direction: 'context',
    prompt: 'Penjual menyebut harga dua roti. Berapa dirham?', ar: 'بِدِرْهَمَيْنِ',
    options: opts(['a', null, '1 dirham'], ['b', null, '2 dirham'], ['c', null, '3 dirham']), answer: 'b',
    rationale: 'دِرْهَمَيْنِ adalah bentuk mutsanna (dual) = dua dirham. Akhiran ـَيْنِ muncul setelah huruf jar بِ.',
    optionFeedback: { a: 'Satu dirham adalah دِرْهَم (mufrad). Akhiran ـَيْنِ menandai "dua".', c: 'Tiga memakai kata bilangan ثَلَاثَة, bukan akhiran mutsanna.' },
    hints: ['Perhatikan akhiran ـَيْنِ pada kata benda: itu penanda "dua".'],
    lex: ['lex.dirham', 'lex.ithnan'], prerequisites: ['lex.dirham'], misconception: 'dual-recognition' }),
  base({ id: 'ch.price.jar', type: 'choice', strand: 'vocab', topic: 'vocab.numbers', difficulty: 1, direction: 'context',
    prompt: 'Penjual menyebut harga kendi besar. Berapa dirham?', ar: 'بِخَمْسَةِ دَرَاهِمَ',
    options: opts(['a', null, '4 dirham'], ['b', null, '5 dirham'], ['c', null, '6 dirham']), answer: 'b',
    rationale: 'خَمْسَة = lima.',
    optionFeedback: { a: 'أَرْبَعَة = empat.', c: 'سِتَّة = enam.' },
    hints: ['خَمْسَة kira-kira terdengar "khamsah" — jumlah jari satu tangan.'],
    lex: ['lex.khamsa', 'lex.dirham'], prerequisites: ['lex.khamsa', 'lex.dirham'], misconception: 'number-confusion' }),

  // ---- dual (sarf; case form of the dual also touches nahwu) ----
  base({ id: 'ch.m1.dual.jarra', type: 'choice', strand: 'sarf', topic: 'sarf.dual', difficulty: 2, direction: 'context',
    prompt: 'Lengkapi: "Ada dua kendi di kios."', ar: 'هُنَاكَ ____ فِي الدُّكَّانِ.',
    options: opts(['a', 'جَرَّتَانِ'], ['b', 'جَرَّتَيْنِ'], ['c', 'جِرَارٌ'], ['d', 'جَرَّةٌ']), answer: 'a',
    rationale: 'Di sini جَرَّتَانِ berfungsi sebagai mubtada\' mu\'akhkhar (marfu\'), sehingga mutsanna-nya berakhiran ـَانِ.',
    optionFeedback: { b: 'جَرَّتَيْنِ adalah bentuk mutsanna untuk nashab/jarr, bukan rafa\'.', c: 'جِرَارٌ adalah jamak (tiga atau lebih), bukan dua.', d: 'جَرَّةٌ adalah mufrad (satu).' },
    hints: ['Mutsanna rafa\' berakhiran ـَانِ; nashab/jarr berakhiran ـَيْنِ.'], lex: ['lex.jarra'], prerequisites: ['lex.jarra'], misconception: 'dual-case' }),
  base({ id: 'ch.m1.dual.raghif', type: 'choice', strand: 'sarf', topic: 'sarf.dual', difficulty: 2, direction: 'context',
    prompt: 'Lengkapi: "Aku membeli dua roti."', ar: 'اِشْتَرَيْتُ ____.',
    options: opts(['a', 'رَغِيفَيْنِ'], ['b', 'رَغِيفَانِ'], ['c', 'أَرْغِفَةً'], ['d', 'رَغِيفًا']), answer: 'a',
    rationale: 'رَغِيفَيْنِ adalah maf\'ul bih (manshub), sehingga mutsanna-nya berakhiran ـَيْنِ.',
    optionFeedback: { b: 'رَغِيفَانِ dipakai untuk posisi marfu\' (misalnya subjek), bukan objek.', c: 'أَرْغِفَة adalah jamak (banyak roti).', d: 'رَغِيفًا berarti satu roti.' },
    hints: ['Objek (maf\'ul bih) manshub. Untuk mutsanna manshub, akhirannya ـَيْنِ.'], lex: ['lex.raghif'], prerequisites: ['lex.raghif'], misconception: 'dual-case' }),
  base({ id: 'ch.m1.dual.dirham', type: 'choice', strand: 'sarf', topic: 'sarf.dual', difficulty: 2, direction: 'context',
    prompt: 'Lengkapi: "Aku membayar dua dirham."', ar: 'دَفَعْتُ ____.',
    options: opts(['a', 'دِرْهَمَيْنِ'], ['b', 'دِرْهَمَانِ'], ['c', 'دَرَاهِمَ'], ['d', 'دِرْهَمًا']), answer: 'a',
    rationale: 'دِرْهَمَيْنِ = dua dirham, posisi maf\'ul bih (manshub) → akhiran ـَيْنِ.',
    optionFeedback: { b: 'دِرْهَمَانِ adalah bentuk marfu\'; di sini objek, jadi manshub.', c: 'دَرَاهِمَ adalah jamak (tiga atau lebih).', d: 'دِرْهَمًا adalah satu dirham.' },
    hints: ['Objek kalimat → manshub → ـَيْنِ.'], lex: ['lex.dirham', 'lex.yadfaa'], prerequisites: ['lex.dirham'], misconception: 'dual-case' }),

  // ---- broken plurals ----
  base({ id: 'ch.m1.plural.sunduq', type: 'choice', strand: 'sarf', topic: 'sarf.plural', difficulty: 2, direction: 'forward',
    prompt: 'Jamak taksir dari صُنْدُوق (peti) adalah…', ar: 'صُنْدُوق',
    options: opts(['a', 'صَنَادِيقُ'], ['b', 'تُجَّارٌ'], ['c', 'دَكَاكِينُ'], ['d', 'سِلَالٌ']), answer: 'a',
    rationale: 'صُنْدُوق → صَنَادِيقُ (pola فَعَالِيلُ). Pilihan lain adalah jamak kata lain: تُجَّار (pedagang), دَكَاكِين (kios), سِلَال (keranjang).',
    hints: ['Jamak taksir mengubah pola kata, bukan sekadar menambah akhiran.'], lex: ['lex.sunduq'], prerequisites: ['lex.sunduq'], misconception: 'plural-pattern' }),
  base({ id: 'ch.m1.plural.tajir', type: 'choice', strand: 'sarf', topic: 'sarf.plural', difficulty: 2, direction: 'forward',
    prompt: 'Jamak taksir dari تَاجِر (pedagang) adalah…', ar: 'تَاجِر',
    options: opts(['a', 'تُجَّارٌ'], ['b', 'أَسْوَاقٌ'], ['c', 'جِرَارٌ'], ['d', 'أَكْيَاسٌ']), answer: 'a',
    rationale: 'تَاجِر → تُجَّارٌ (pola فُعَّالٌ). Pilihan lain: أَسْوَاق (pasar-pasar), جِرَار (kendi-kendi), أَكْيَاس (kantong-kantong).',
    hints: ['Jamaknya dimulai dengan تُـ dan memiliki jim bertasydid.'], lex: ['lex.tajir'], prerequisites: ['lex.tajir'], misconception: 'plural-pattern' }),
  base({ id: 'ch.m1.plural.salla', type: 'choice', strand: 'sarf', topic: 'sarf.plural', difficulty: 2, direction: 'forward',
    prompt: 'Jamak taksir dari سَلَّة (keranjang) adalah…', ar: 'سَلَّة',
    options: opts(['a', 'سِلَالٌ'], ['b', 'جِرَارٌ'], ['c', 'أَكْيَاسٌ'], ['d', 'صَنَادِيقُ']), answer: 'a',
    rationale: 'سَلَّة → سِلَالٌ (pola فِعَالٌ). جِرَار adalah jamak جَرَّة.',
    hints: ['Huruf-huruf akarnya س-ل-ل; jamaknya tetap memuat سـ dan ل.'], lex: ['lex.salla'], prerequisites: ['lex.salla'], misconception: 'plural-pattern' }),
  base({ id: 'ch.m1.plural.suq', type: 'choice', strand: 'sarf', topic: 'sarf.plural', difficulty: 1, direction: 'forward',
    prompt: 'Jamak taksir dari سُوق (pasar) adalah…', ar: 'سُوق',
    options: opts(['a', 'أَسْوَاقٌ'], ['b', 'دَكَاكِينُ'], ['c', 'تُجَّارٌ'], ['d', 'سِلَالٌ']), answer: 'a',
    rationale: 'سُوق → أَسْوَاقٌ (pola أَفْعَالٌ).',
    hints: ['Jamaknya diawali أَ dan memuat huruf سـ و ق.'], lex: ['lex.suq'], prerequisites: ['lex.suq'], misconception: 'plural-pattern' }),

  // ---- adjective agreement, nominal sentences (nahwu) ----
  base({ id: 'ch.m1.agree.khubz', type: 'choice', strand: 'nahwu', topic: 'nahwu.nominal-sentence', difficulty: 1, direction: 'context',
    prompt: 'Lengkapi agar menjadi kalimat: "Roti itu panas."', ar: 'الْخُبْزُ ____.',
    options: opts(['a', 'سَاخِنٌ'], ['b', 'سَاخِنَةٌ'], ['c', 'سَاخِنَانِ'], ['d', 'السَّاخِنُ']), answer: 'a',
    rationale: 'الْخُبْزُ mudzakkar mufrad (mubtada\'). Khabar-nya nakirah, marfu\', dan sesuai jenis: سَاخِنٌ.',
    optionFeedback: { b: 'سَاخِنَةٌ muannats; الْخُبْزُ mudzakkar.', c: 'سَاخِنَانِ adalah mutsanna; الْخُبْزُ hanya satu.', d: 'الْخُبْزُ السَّاخِنُ hanya frasa (man\'ut + na\'t), belum kalimat lengkap.' },
    hints: ['Khabar mengikuti mubtada\' dalam jenis dan jumlah.'], lex: ['lex.khubz', 'lex.sakhin'], prerequisites: ['lex.khubz', 'lex.sakhin'], misconception: 'khabar-vs-nat' }),
  base({ id: 'ch.m1.agree.jarra', type: 'choice', strand: 'nahwu', topic: 'nahwu.nominal-sentence', difficulty: 1, direction: 'context',
    prompt: 'Lengkapi: "Kendi itu berat."', ar: 'الْجَرَّةُ ____.',
    options: opts(['a', 'ثَقِيلَةٌ'], ['b', 'ثَقِيلٌ'], ['c', 'ثَقِيلَانِ'], ['d', 'الثَّقِيلَةُ']), answer: 'a',
    rationale: 'الْجَرَّةُ muannats mufrad, maka khabar-nya juga muannats: ثَقِيلَةٌ.',
    optionFeedback: { b: 'ثَقِيلٌ mudzakkar; الْجَرَّةُ muannats.', c: 'ثَقِيلَانِ mutsanna mudzakkar.', d: 'الثَّقِيلَةُ memakai ال sehingga membentuk frasa, bukan khabar.' },
    hints: ['Kata جَرَّة berakhir taa marbuthah: tanda muannats.'], lex: ['lex.jarra', 'lex.thaqil'], prerequisites: ['lex.jarra', 'lex.thaqil'], misconception: 'gender-agreement' }),
  base({ id: 'ch.m1.agree.color', type: 'choice', strand: 'nahwu', topic: 'nahwu.nat', difficulty: 2, direction: 'context',
    prompt: 'Pilih sifat yang tepat: "sebuah kendi merah".', ar: 'جَرَّةٌ ____',
    options: opts(['a', 'حَمْرَاءُ'], ['b', 'أَحْمَرُ'], ['c', 'حَمْرَاوَانِ'], ['d', 'الْحَمْرَاءُ']), answer: 'a',
    rationale: 'Na\'t mengikuti man\'ut: muannats, mufrad, marfu\', nakirah → حَمْرَاءُ (tanpa tanwin karena mamnu\' minash-sharf).',
    optionFeedback: { b: 'أَحْمَرُ adalah bentuk mudzakkar.', c: 'حَمْرَاوَانِ adalah mutsanna.', d: 'ال membuatnya ma\'rifah, padahal جَرَّةٌ nakirah.' },
    hints: ['Warna muannats memakai pola فَعْلَاءُ.'], lex: ['lex.jarra', 'lex.hamra'], prerequisites: ['lex.jarra', 'lex.hamra'], misconception: 'definiteness-agreement' }),
  base({ id: 'ch.m1.agree.def', type: 'choice', strand: 'nahwu', topic: 'nahwu.nat', difficulty: 2, direction: 'context',
    prompt: 'Lengkapi: "Aku melihat kendi besar itu."', ar: 'رَأَيْتُ الْجَرَّةَ ____.',
    options: opts(['a', 'الْكَبِيرَةَ'], ['b', 'كَبِيرَةً'], ['c', 'الْكَبِيرَ'], ['d', 'الْكَبِيرَةُ']), answer: 'a',
    rationale: 'Na\'t mengikuti man\'ut dalam jenis, jumlah, i\'rab (di sini manshub), dan ta\'rif (ma\'rifah): الْكَبِيرَةَ.',
    optionFeedback: { b: 'كَبِيرَةً nakirah, sedangkan الْجَرَّةَ ma\'rifah.', c: 'الْكَبِيرَ mudzakkar.', d: 'الْكَبِيرَةُ marfu\'; man\'ut-nya manshub.' },
    hints: ['Samakan empat hal: jenis, jumlah, harakat akhir, dan ال.'], lex: ['lex.jarra', 'lex.kabir'], prerequisites: ['lex.jarra', 'lex.kabir'], misconception: 'definiteness-agreement' }),

  // ---- numbers ----
  base({ id: 'ch.m1.num.sabaa', type: 'choice', strand: 'vocab', topic: 'vocab.numbers', difficulty: 1, direction: 'forward',
    prompt: 'Angka berapakah ini?', ar: 'سَبْعَة',
    options: opts(['a', null, '5'], ['b', null, '6'], ['c', null, '7'], ['d', null, '8']), answer: 'c',
    rationale: 'سَبْعَة = tujuh.', hints: ['سِتَّة = 6, sehingga kata berikutnya = 7.'], lex: ['lex.sabaa'], prerequisites: ['lex.sabaa'], misconception: 'number-confusion' }),
  base({ id: 'ch.m1.num.thamaniya', type: 'choice', strand: 'vocab', topic: 'vocab.numbers', difficulty: 1, direction: 'forward',
    prompt: 'Angka berapakah ini?', ar: 'ثَمَانِيَة',
    options: opts(['a', null, '6'], ['b', null, '7'], ['c', null, '8'], ['d', null, '9']), answer: 'c',
    rationale: 'ثَمَانِيَة = delapan.', hints: ['Sesudah سَبْعَة (7).'], lex: ['lex.thamaniya'], prerequisites: ['lex.thamaniya'], misconception: 'number-confusion' }),

  // ---- typed answers (normalisation policy declared per item) ----
  base({ id: 'ch.m1.short.suq', type: 'short', strand: 'vocab', topic: 'vocab.place', difficulty: 1, direction: 'reverse',
    prompt: 'Ketik kata Arab untuk "pasar". Harakat boleh dilewati.', answers: ['سُوق'], policy: 'lenient-tashkeel',
    rationale: 'سُوق = pasar.', hints: ['Kata ini ada pada nama tahap: سُوقُ الصَّبَاحِ.'], lex: ['lex.suq'], prerequisites: ['lex.suq'], misconception: 'recall' }),
  base({ id: 'ch.m1.short.ma', type: 'short', strand: 'vocab', topic: 'vocab.food', difficulty: 1, direction: 'reverse',
    prompt: 'Ketik kata Arab untuk "air". Harakat boleh dilewati.', answers: ['مَاء'], policy: 'lenient-tashkeel',
    rationale: 'مَاء = air (berakhir hamzah ء).', hints: ['Tiga huruf: م ا ء.'], lex: ['lex.ma'], prerequisites: ['lex.ma'], misconception: 'recall' }),

  // ---- sentence building ----
  base({ id: 'ch.m1.order.urid', type: 'order', strand: 'nahwu', topic: 'nahwu.verbal-sentence', difficulty: 1, direction: 'context',
    prompt: 'Susun kalimat: "Aku ingin kurma."', tokens: [{ id: 't1', ar: 'تَمْرًا' }, { id: 't2', ar: 'أُرِيدُ' }],
    answer: ['t2', 't1'], rationale: 'Fi\'il lebih dulu, lalu maf\'ul bih (manshub): أُرِيدُ تَمْرًا.',
    hints: ['Kata kerja ("aku ingin") membuka kalimat.'], lex: ['lex.urid', 'lex.tamr'], prerequisites: ['lex.urid', 'lex.tamr'], misconception: 'word-order' }),
  base({ id: 'ch.m1.order.khubz', type: 'order', strand: 'nahwu', topic: 'nahwu.nominal-sentence', difficulty: 1, direction: 'context',
    prompt: 'Susun kalimat: "Roti itu panas."', tokens: [{ id: 't1', ar: 'سَاخِنٌ' }, { id: 't2', ar: 'الْخُبْزُ' }],
    answer: ['t2', 't1'], rationale: 'Jumlah ismiyyah: mubtada\' (ma\'rifah) lebih dulu, lalu khabar (nakirah): الْخُبْزُ سَاخِنٌ.',
    hints: ['Yang dibicarakan (ber-ال) berada di depan.'], lex: ['lex.khubz', 'lex.sakhin'], prerequisites: ['lex.khubz', 'lex.sakhin'], misconception: 'word-order' }),
  base({ id: 'ch.m1.order.tajir', type: 'order', strand: 'nahwu', topic: 'nahwu.verbal-sentence', difficulty: 2, direction: 'context',
    prompt: 'Susun kalimat: "Pedagang itu membeli sebuah kendi."',
    tokens: [{ id: 't1', ar: 'جَرَّةً' }, { id: 't2', ar: 'اِشْتَرَى' }, { id: 't3', ar: 'التَّاجِرُ' }],
    answers: [['t2', 't3', 't1'], ['t3', 't2', 't1']],
    rationale: 'Dua susunan benar: jumlah fi\'liyyah (فعل–فاعل–مفعول): اِشْتَرَى التَّاجِرُ جَرَّةً; atau jumlah ismiyyah dengan khabar jumlah fi\'liyyah: التَّاجِرُ اشْتَرَى جَرَّةً.',
    hints: ['Maf\'ul bih (جَرَّةً) berada di akhir.'], lex: ['lex.tajir', 'lex.yashtari', 'lex.jarra'], prerequisites: ['lex.tajir', 'lex.jarra'], misconception: 'word-order' }),

  // ---- integrated: vocabulary + number/dual + reading ----
  base({ id: 'ch.m1.ctx.label', type: 'choice', strand: 'integrated', topic: 'integrated.label-reading', difficulty: 2, direction: 'context',
    prompt: 'Daftar pesanan meminta dua roti. Papan manakah yang cocok?', ar: 'أُرِيدُ رَغِيفَيْنِ.',
    options: opts(['a', 'رَغِيفٌ وَاحِدٌ'], ['b', 'رَغِيفَانِ'], ['c', 'ثَلَاثَةُ أَرْغِفَةٍ'], ['d', 'خُبْزٌ كَثِيرٌ']), answer: 'b',
    rationale: 'رَغِيفَانِ adalah mutsanna (dua roti). Bentuk pada papan marfu\', pada kalimat pesanan manshub (رَغِيفَيْنِ), tetapi jumlahnya sama: dua.',
    optionFeedback: { a: 'رَغِيفٌ وَاحِدٌ = satu roti.', c: 'ثَلَاثَةُ أَرْغِفَةٍ = tiga roti.', d: 'خُبْزٌ كَثِيرٌ = banyak roti.' },
    hints: ['Cari akhiran mutsanna pada kata رَغِيف.'], lex: ['lex.raghif'], prerequisites: ['lex.raghif'], misconception: 'dual-recognition' }),
  base({ id: 'ch.m1.ctx.read', type: 'choice', strand: 'integrated', topic: 'integrated.label-reading', difficulty: 2, direction: 'context',
    prompt: 'Berapa harga kendi besar menurut papan?', ar: 'الْجَرَّةُ الْكَبِيرَةُ بِخَمْسَةِ دَرَاهِمَ.',
    options: opts(['a', null, '2 dirham'], ['b', null, '3 dirham'], ['c', null, '5 dirham'], ['d', null, '10 dirham']), answer: 'c',
    rationale: 'بِخَمْسَةِ دَرَاهِمَ = seharga lima dirham.', hints: ['Cari kata bilangan setelah حرف الجر بِ.'],
    lex: ['lex.khamsa', 'lex.jarra', 'lex.kabir'], prerequisites: ['lex.khamsa'], misconception: 'number-confusion' }),
];

export const CHALLENGE_BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]));
// Practice-board rotation: authored items only (price challenges are quest-bound).
export const PRACTICE_POOL = CHALLENGES.filter((c) => c.id.startsWith('ch.m1.')).map((c) => c.id);
