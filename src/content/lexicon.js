// Morning Market lexicon (KM-057). Authored for this project; every entry is review.status "draft".
// Tuple: [slug, arabic (with tashkeel), Indonesian gloss, part of speech, topic]
// Provenance: no external source is cited for these entries — see docs/SOURCE_REGISTER.md.
import { stripTashkeel } from '../learning/normalize.js';

const R = [
  // food & goods
  ["tamr", "تَمْر", "kurma", "n", "vocab.food"], ["tin", "تِين", "buah ara", "n", "vocab.food"],
  ["inab", "عِنَب", "anggur", "n", "vocab.food"], ["khubz", "خُبْز", "roti", "n", "vocab.food"],
  ["raghif", "رَغِيف", "sebuah roti (bulat)", "n", "vocab.food"], ["ma", "مَاء", "air", "n", "vocab.food"],
  ["milh", "مِلْح", "garam", "n", "vocab.food"], ["zayt", "زَيْت", "minyak", "n", "vocab.food"],
  ["halib", "حَلِيب", "susu", "n", "vocab.food"], ["jubn", "جُبْن", "keju", "n", "vocab.food"],
  ["asal", "عَسَل", "madu", "n", "vocab.food"], ["sukkar", "سُكَّر", "gula", "n", "vocab.food"],
  ["aruzz", "أَرُزّ", "nasi / beras", "n", "vocab.food"], ["laymun", "لَيْمُون", "lemon", "n", "vocab.food"],
  ["burtuqal", "بُرْتُقَال", "jeruk", "n", "vocab.food"], ["tuffah", "تُفَّاح", "apel", "n", "vocab.food"],
  ["basal", "بَصَل", "bawang merah", "n", "vocab.food"], ["thum", "ثُوم", "bawang putih", "n", "vocab.food"],
  ["filfil", "فِلْفِل", "lada / cabai", "n", "vocab.food"], ["zaytun", "زَيْتُون", "buah zaitun", "n", "vocab.food"],
  ["bayd", "بَيْض", "telur", "n", "vocab.food"], ["lahm", "لَحْم", "daging", "n", "vocab.food"],
  ["samak", "سَمَك", "ikan", "n", "vocab.food"], ["fakiha", "فَاكِهَة", "buah-buahan", "n", "vocab.food"],
  ["khudar", "خُضَار", "sayur-sayuran", "n", "vocab.food"], ["qahwa", "قَهْوَة", "kopi", "n", "vocab.food"],
  ["shay", "شَاي", "teh", "n", "vocab.food"], ["qirfa", "قِرْفَة", "kayu manis", "n", "vocab.food"],
  ["tawabil", "تَوَابِل", "rempah-rempah", "n", "vocab.food"], ["nakhla", "نَخْلَة", "pohon kurma", "n", "vocab.food"],
  // objects & places
  ["jarra", "جَرَّة", "kendi", "n", "vocab.objects"], ["salla", "سَلَّة", "keranjang", "n", "vocab.objects"],
  ["kis", "كِيس", "kantong / karung", "n", "vocab.objects"], ["sunduq", "صُنْدُوق", "peti", "n", "vocab.objects"],
  ["mizan", "مِيزَان", "timbangan", "n", "vocab.objects"], ["fanus", "فَانُوس", "lentera", "n", "vocab.objects"],
  ["habl", "حَبْل", "tali", "n", "vocab.objects"], ["araba", "عَرَبَة", "gerobak", "n", "vocab.objects"],
  ["lawha", "لَوْحَة", "papan", "n", "vocab.objects"], ["qaima", "قَائِمَة", "daftar", "n", "vocab.objects"],
  ["miftah", "مِفْتَاح", "kunci", "n", "vocab.objects"], ["khatm", "خَتْم", "segel", "n", "vocab.objects"],
  ["sitara", "سِتَارَة", "tirai", "n", "vocab.objects"], ["furn", "فُرْن", "tungku / oven", "n", "vocab.objects"],
  ["ibriq", "إِبْرِيق", "teko", "n", "vocab.objects"], ["qumash", "قُمَاش", "kain", "n", "vocab.objects"],
  ["haqiba", "حَقِيبَة", "tas", "n", "vocab.objects"], ["fakhkhar", "فَخَّار", "tembikar", "n", "vocab.objects"],
  ["hadiyya", "هَدِيَّة", "hadiah", "n", "vocab.objects"], ["shams", "شَمْس", "matahari", "n", "vocab.objects"],
  ["hajar", "حَجَر", "batu", "n", "vocab.objects"], ["shajara", "شَجَرَة", "pohon", "n", "vocab.objects"],
  ["bab", "بَاب", "pintu", "n", "vocab.place"], ["nafida", "نَافِذَة", "jendela", "n", "vocab.place"],
  ["jidar", "جِدَار", "dinding", "n", "vocab.place"], ["saqf", "سَقْف", "atap", "n", "vocab.place"],
  ["suq", "سُوق", "pasar", "n", "vocab.place"], ["dukkan", "دُكَّان", "kios / toko kecil", "n", "vocab.place"],
  ["makhzan", "مَخْزَن", "gudang", "n", "vocab.place"], ["zuqaq", "زُقَاق", "gang", "n", "vocab.place"],
  ["shari", "شَارِع", "jalan", "n", "vocab.place"], ["saha", "سَاحَة", "lapangan / alun-alun", "n", "vocab.place"],
  ["nafura", "نَافُورَة", "air mancur", "n", "vocab.place"], ["bir", "بِئْر", "sumur", "n", "vocab.place"],
  ["fina", "فِنَاء", "halaman dalam", "n", "vocab.place"], ["madkhal", "مَدْخَل", "pintu masuk", "n", "vocab.place"],
  ["makhraj", "مَخْرَج", "jalan keluar", "n", "vocab.place"], ["hadiqa", "حَدِيقَة", "taman", "n", "vocab.place"],
  // people
  ["bai", "بَائِع", "penjual", "n", "vocab.people"], ["tajir", "تَاجِر", "pedagang", "n", "vocab.people"],
  ["zabun", "زَبُون", "pelanggan", "n", "vocab.people"], ["khabbaz", "خَبَّاز", "tukang roti", "n", "vocab.people"],
  ["khazzaf", "خَزَّاف", "pengrajin tembikar", "n", "vocab.people"], ["saqqa", "سَقَّاء", "pembawa air", "n", "vocab.people"],
  ["sayyida", "سَيِّدَة", "nyonya / ibu", "n", "vocab.people"],
  // money
  ["dirham", "دِرْهَم", "dirham (mata uang)", "n", "vocab.money"], ["dinar", "دِينَار", "dinar (mata uang)", "n", "vocab.money"],
  ["mal", "مَال", "uang / harta", "n", "vocab.money"], ["sir", "سِعْر", "harga", "n", "vocab.money"],
  ["thaman", "ثَمَن", "harga / nilai", "n", "vocab.money"], ["ghali", "غَالٍ", "mahal", "adj", "vocab.money"],
  ["rakhis", "رَخِيص", "murah", "adj", "vocab.money"],
  // numbers
  ["wahid", "وَاحِد", "satu", "num", "vocab.numbers"], ["ithnan", "اِثْنَان", "dua", "num", "vocab.numbers"],
  ["thalatha", "ثَلَاثَة", "tiga", "num", "vocab.numbers"], ["arbaa", "أَرْبَعَة", "empat", "num", "vocab.numbers"],
  ["khamsa", "خَمْسَة", "lima", "num", "vocab.numbers"], ["sitta", "سِتَّة", "enam", "num", "vocab.numbers"],
  ["sabaa", "سَبْعَة", "tujuh", "num", "vocab.numbers"], ["thamaniya", "ثَمَانِيَة", "delapan", "num", "vocab.numbers"],
  ["tisaa", "تِسْعَة", "sembilan", "num", "vocab.numbers"], ["ashara", "عَشَرَة", "sepuluh", "num", "vocab.numbers"],
  // colours (masculine and feminine forms)
  ["ahmar", "أَحْمَر", "merah (m.)", "adj", "vocab.colors"], ["hamra", "حَمْرَاء", "merah (f.)", "adj", "vocab.colors"],
  ["azraq", "أَزْرَق", "biru (m.)", "adj", "vocab.colors"], ["zarqa", "زَرْقَاء", "biru (f.)", "adj", "vocab.colors"],
  ["akhdar", "أَخْضَر", "hijau (m.)", "adj", "vocab.colors"], ["khadra", "خَضْرَاء", "hijau (f.)", "adj", "vocab.colors"],
  ["asfar", "أَصْفَر", "kuning (m.)", "adj", "vocab.colors"], ["safra", "صَفْرَاء", "kuning (f.)", "adj", "vocab.colors"],
  ["abyad", "أَبْيَض", "putih (m.)", "adj", "vocab.colors"], ["bayda", "بَيْضَاء", "putih (f.)", "adj", "vocab.colors"],
  ["aswad", "أَسْوَد", "hitam (m.)", "adj", "vocab.colors"], ["sawda", "سَوْدَاء", "hitam (f.)", "adj", "vocab.colors"],
  // directions
  ["yamin", "يَمِين", "kanan", "n", "vocab.direction"], ["yasar", "يَسَار", "kiri", "n", "vocab.direction"],
  ["amam", "أَمَام", "depan", "n", "vocab.direction"], ["khalf", "خَلْف", "belakang", "n", "vocab.direction"],
  ["fawq", "فَوْق", "atas", "n", "vocab.direction"], ["taht", "تَحْت", "bawah", "n", "vocab.direction"],
  ["bayn", "بَيْن", "antara", "n", "vocab.direction"], ["qurb", "قُرْب", "dekat", "n", "vocab.direction"],
  ["gharbi", "غَرْبِيّ", "barat (bersifat)", "adj", "vocab.direction"], ["sharqi", "شَرْقِيّ", "timur (bersifat)", "adj", "vocab.direction"],
  // adjectives
  ["tazaj", "طَازَج", "segar", "adj", "vocab.adjectives"], ["sakhin", "سَاخِن", "panas", "adj", "vocab.adjectives"],
  ["barid", "بَارِد", "dingin", "adj", "vocab.adjectives"], ["kabir", "كَبِير", "besar", "adj", "vocab.adjectives"],
  ["saghir", "صَغِير", "kecil", "adj", "vocab.adjectives"], ["thaqil", "ثَقِيل", "berat", "adj", "vocab.adjectives"],
  ["khafif", "خَفِيف", "ringan", "adj", "vocab.adjectives"], ["jadid", "جَدِيد", "baru", "adj", "vocab.adjectives"],
  ["qadim", "قَدِيم", "lama", "adj", "vocab.adjectives"], ["jamil", "جَمِيل", "indah", "adj", "vocab.adjectives"],
  // verbs (present tense, 3rd person masculine)
  ["yashtari", "يَشْتَرِي", "membeli", "v", "vocab.verbs"], ["yabii", "يَبِيعُ", "menjual", "v", "vocab.verbs"],
  ["yadfaa", "يَدْفَعُ", "membayar", "v", "vocab.verbs"], ["yakhudh", "يَأْخُذُ", "mengambil", "v", "vocab.verbs"],
  ["yuti", "يُعْطِي", "memberi", "v", "vocab.verbs"], ["yaftah", "يَفْتَحُ", "membuka", "v", "vocab.verbs"],
  ["yughliq", "يُغْلِقُ", "menutup", "v", "vocab.verbs"], ["yahmil", "يَحْمِلُ", "membawa", "v", "vocab.verbs"],
  ["yajid", "يَجِدُ", "menemukan", "v", "vocab.verbs"], ["yasal", "يَسْأَلُ", "bertanya", "v", "vocab.verbs"],
  ["yaqra", "يَقْرَأُ", "membaca", "v", "vocab.verbs"], ["yamshi", "يَمْشِي", "berjalan", "v", "vocab.verbs"],
  ["yantazir", "يَنْتَظِرُ", "menunggu", "v", "vocab.verbs"], ["yadkhul", "يَدْخُلُ", "masuk", "v", "vocab.verbs"],
  ["yakhruj", "يَخْرُجُ", "keluar", "v", "vocab.verbs"], ["yurid", "يُرِيدُ", "menginginkan", "v", "vocab.verbs"],
  // phrases
  ["sabah_alkhayr", "صَبَاحُ الْخَيْرِ", "selamat pagi", "phrase", "vocab.phrases"],
  ["shukran", "شُكْرًا", "terima kasih", "phrase", "vocab.phrases"],
  ["sabah", "صَبَاح", "pagi", "n", "vocab.phrases"],
  ["ahlan", "أَهْلًا وَسَهْلًا", "selamat datang", "phrase", "vocab.phrases"],
  ["maa_salama", "مَعَ السَّلَامَةِ", "selamat jalan", "phrase", "vocab.phrases"],
  ["urid", "أُرِيدُ", "aku ingin", "phrase", "vocab.phrases"],
  ["tafaddal", "تَفَضَّلْ", "silakan (kepada laki-laki)", "phrase", "vocab.phrases"],
  ["bikam", "بِكَمْ", "berapa harganya", "phrase", "vocab.phrases"],
  ["min_fadlik", "مِنْ فَضْلِكَ", "tolong (kepada laki-laki)", "phrase", "vocab.phrases"],
  ["kull_shay", "كُلُّ شَيْءٍ", "segala sesuatu", "phrase", "vocab.phrases"],
  ["hunaka", "هُنَاكَ", "di sana / ada", "func", "vocab.phrases"],
  // function words
  ["madha", "مَاذَا", "apa", "func", "vocab.function"], ["hal", "هَلْ", "apakah", "func", "vocab.function"],
  ["kam", "كَمْ", "berapa", "func", "vocab.function"], ["ayna", "أَيْنَ", "di mana", "func", "vocab.function"],
  ["min", "مِنْ", "dari", "func", "vocab.function"], ["ila", "إِلَى", "ke / kepada", "func", "vocab.function"],
  ["fi", "فِي", "di dalam", "func", "vocab.function"], ["ala", "عَلَى", "di atas / pada", "func", "vocab.function"],
  ["maa", "مَعَ", "bersama", "func", "vocab.function"],
];

export const LEXICON = R.map(([slug, ar, gloss, pos, topic]) => ({
  id: `lex.${slug}`, v: 1, ar, plain: stripTashkeel(ar), gloss, pos, topic, stage: 'morning',
  provenance: { kind: 'authored', source: null, note: 'Authored for this project; no external reference cited.' },
  review: { status: 'draft', reviewer: null, date: null },
}));

// Words unlocked by the optional pottery side quest (all must exist above).
export const POTTERY_PACK = ['lex.fakhkhar', 'lex.ibriq', 'lex.jarra', 'lex.hadiyya', 'lex.makhzan', 'lex.miftah'];
