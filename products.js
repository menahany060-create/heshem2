// =====================================================
//  بن الحشم — products.js
//  ده الملف الوحيد اللي هتعدل فيه المنتجات والعروض
// =====================================================
//
//  STATUS OPTIONS (حالة المنتج):
//    "available"    → متاح للشراء ✅
//    "sold-out"     → نفذ من المخزن ❌
//    "coming-soon"  → قريباً 🔜
//    "low-stock"    → كميات محدودة ⚠️
//
//  BADGE OPTIONS (شارة فوق الكارد):
//    "bestseller"   → 🔥 الأكثر مبيعاً
//    "new"          → ✨ جديد
//    "hot"          → 💥 الأقوى
//    null           → بدون شارة
//
//  CAFFEINE LEVEL:
//    "low"      → أخضر   (أقل من 60%)
//    "medium"   → ذهبي   (60–79%)
//    "high"     → برتقالي (80–94%)
//    "extreme"  → أحمر   (95%+)
//
// =====================================================

const PRODUCTS = [

  // ─────────────────────────────
  // المنتج ١ — توليفة الحشم
  // ─────────────────────────────
  {
    id:             "الحشم",
    name:           "توليفة الحشم",

    // ⬇️ السطر ده بس اللي بتغيره لتغيير الحالة
    status:         "available",

    imgFront:       "hashm.png",
    imgBack:        "hashm.png",

    caffeine:       90,
    caffeineLevel:  "high",
    caffeineLabel:  "🔥 كافيين عالي",

    badge:          "bestseller",
    watchBase:      14,
    rating:         4.9,
    reviewCount:    138,

    basePrice:      150,
    weights: [
      { w: 125, price: 150 },
      { w: 250, price: 270 },
      { w: 500, price: 550 },
    ],

    // ألوان دوائر الخلفية
    c1: "#C9962A", c2: "#8B5E10", c3: "#E8B84B",

    backTitle:   "توليفة الحشم 💪",
    backSub:     "أقوى توليفة — كافيين 90% — للجادين فقط",
    backReview:  { stars: "★★★★★", text: '"بصراحة أقوى قهوة جربتها 🔥"' },
    backHint:    "اقلب للشراء 👆",

    story: {
      title: "No Pain... No Gain 💪",
      text:  "مفيش حاجه هتجيلك لحد عندك، اسعى واجتهد وربنا هيديك على قد تعبك، واوعي تيأس لأن مفيش حلاوه من غير نار. واحنا عملنالك التوليفه الى هتخليك تكمل مشوارك باقصى طاقه ممكنه 💪🏻",
    },
    specs: {
      roast: "وسط",
      types: "أنواع البن: برازيلي + كولومبي\nالكافيين: 90%\nالتحميص: وسط",
    },
  },

  // ─────────────────────────────
  // المنتج ٢ — توليفة أيوب
  // ─────────────────────────────
  {
    id:             "أيوب",
    name:           "توليفة أيوب",
    status:         "available",

    imgFront:       "ayoub.png",
    imgBack:        "ayoub.png",

    caffeine:       65,
    caffeineLevel:  "medium",
    caffeineLabel:  "⚡ كافيين متوسط",

    badge:          null,
    watchBase:      8,
    rating:         4.7,
    reviewCount:    94,

    basePrice:      110,
    weights: [
      { w: 125, price: 110 },
      { w: 250, price: 200 },
      { w: 500, price: 350 },
    ],

    c1: "#C9962A", c2: "#8B5E10", c3: "#E8B84B",

    backTitle:  "توليفة أيوب ❤️",
    backSub:    "ناعمة على المعدة — مثالية للصبح",
    backReview: { stars: "★★★★★", text: '"طعم خفيف وحلو — بشربها يومياً"' },
    backHint:   "اقلب للشراء 👆",

    story: {
      title: "اشرب الصبر واستمتع بالفرج ❤️",
      text:  "سيدنا ايوب صبر على الابتلاء 18 سنة وربنا عوضه اضعاف. توليفة ايوب هتساعدك على الصبر في حياتك ❤️",
    },
    specs: {
      roast: "وسط",
      types: "أنواع البن: برازيلي + كولومبي\nالكافيين: 65%\nالتحميص: وسط",
    },
  },

  // ─────────────────────────────
  // المنتج ٣ — ع السكة
  // ─────────────────────────────
  {
    id:             "السكة",
    name:           "توليفة ع السكة",
    status:         "low-stock",      // ⚠️ كميات محدودة

    imgFront:       "sikka.png",
    imgBack:        "sikka.png",

    caffeine:       80,
    caffeineLevel:  "high",
    caffeineLabel:  "⚡ كافيين عالي",

    badge:          null,
    watchBase:      11,
    rating:         4.8,
    reviewCount:    71,

    basePrice:      90,
    weights: [
      { w: 125, price: 90  },
      { w: 250, price: 200 },
      { w: 500, price: 350 },
    ],

    c1: "#D94020", c2: "#8B2010", c3: "#E8855A",

    backTitle:  "توليفة ع السكة 🚗",
    backSub:    "للمسافر الشاطر — تفوقك طول الرحلة",
    backReview: { stars: "★★★★★", text: '"من القاهرة للإسكندرية من غير تعب 💯"' },
    backHint:   "اقلب للشراء 👆",

    story: {
      title: "استمتع بالرحله 🚗",
      text:  "مسافر وسكتك طويله؟ توليفة ع السكه هتخليك صاحي ومركز طول الرحلة ❤️",
    },
    specs: {
      roast: "وسط",
      types: "أنواع البن: برازيلي + كولومبي\nالكافيين: 80%\nالتحميص: وسط",
    },
  },

  // ─────────────────────────────
  // المنتج ٤ — الجدع
  // ─────────────────────────────
  {
    id:             "الجدع",
    name:           "توليفة الجدع",
    status:         "available",

    imgFront:       "gad3.png",
    imgBack:        "gad3.png",

    caffeine:       50,
    caffeineLevel:  "low",
    caffeineLabel:  "🌿 كافيين خفيف",

    badge:          null,
    watchBase:      6,
    rating:         4.5,
    reviewCount:    56,

    basePrice:      85,
    weights: [
      { w: 125, price: 85  },
      { w: 250, price: 180 },
      { w: 500, price: 300 },
    ],

    c1: "#7BC67E", c2: "#3D8B40", c3: "#A8D8AA",

    backTitle:  "توليفة الجدع 😉",
    backSub:    "ناعمة وخفيفة — مش لأي حد",
    backReview: { stars: "★★★★☆", text: '"بحبها مع اللبن — بتطلع تيرامسو 😂"' },
    backHint:   "اقلب للشراء 👆",

    story: {
      title: "توليفة الجدع 😉",
      text:  "مفيش راجل جدع مش بيشرب قهوه، توليفة الجدع مش لأي حد 😉",
    },
    specs: {
      roast: "وسط",
      types: "أنواع البن: برازيلي + كولومبي\nالكافيين: 50%\nالتحميص: وسط",
    },
  },

  // ─────────────────────────────
  // المنتج ٥ — ESPRESSO
  // ─────────────────────────────
  {
    id:             "ESPRESSO",
    name:           "ESPRESSO",
    status:         "coming-soon",    // 🔜 قريباً

    imgFront:       "espresso.png",
    imgBack:        "espresso.png",

    caffeine:       95,
    caffeineLevel:  "extreme",
    caffeineLabel:  "💥 أقوى توليفة",

    badge:          "hot",
    watchBase:      0,
    rating:         4.9,
    reviewCount:    43,

    basePrice:      150,
    weights: [
      { w: 125, price: 150 },
      { w: 250, price: 250 },
      { w: 500, price: 350 },
    ],

    c1: "#444", c2: "#222", c3: "#555",

    backTitle:  "ESPRESSO 🔥",
    backSub:    "أقوى توليفة — كافيين 95% — قريباً",
    backReview: { stars: "★★★★★", text: '"ده مش قهوة ده صاروخ 🚀"' },
    backHint:   "قريباً 🔜",

    story: {
      title: "ESPRESSO 🔥",
      text:  "جرعة كافيين مركزة 95% — تعيشك فايق على الآخر! قريباً يعود بقوة 💪",
    },
    specs: {
      roast: "داكن",
      types: "تحميص داكن + نكهة قوية مركزة\nالكافيين: 95%",
    },
  },

  // ─────────────────────────────
  // ➕ لإضافة منتج جديد:
  // انسخ الـ block فوق وعدّل البيانات
  // ─────────────────────────────

];


// =====================================================
//  OFFERS — العروض
// =====================================================

const OFFERS = [

  // ─────────────────────────────
  // العرض ١
  // ─────────────────────────────
  {
    id:          "offer-1",
    name:        "ع السكة (500g)",
    cartName:    "ع السكة 500g عرض",

    // ⬇️ السطر ده بس اللي بتغيره
    status:      "available",

    imgFront:    "sikka.png",
    imgBack:     "sikka.png",

    discount:    20,
    oldPrice:    350,
    newPrice:    280,

    watchBase:   9,
    rating:      4.8,

    backTitle:   "ع السكة 🚗",
    backSub:     "توليفة للمسافر الشاطر — تفوقك طول الطريق",

    story: {
      title: "استمتع بالرحله 🚗",
      text:  "مسافر وسكتك طويله؟ توليفة ع السكه هتخليك صاحي ومركز طول الرحلة ❤️",
    },
    specs: {
      roast: "وسط",
      types: "أنواع البن: برازيلي + كولومبي | 500 جرام",
    },
  },

  // ─────────────────────────────
  // العرض ٢
  // ─────────────────────────────
  {
    id:          "offer-2",
    name:        "الجدع (500g)",
    cartName:    "الجدع 500g عرض",
    status:      "available",

    imgFront:    "gad3.png",
    imgBack:     "gad3.png",

    discount:    50,
    oldPrice:    350,
    newPrice:    175,

    watchBase:   6,
    rating:      4.5,

    backTitle:   "الجدع 💪",
    backSub:     "مش لأي حد — بس للي يستاهل",

    story: {
      title: "توليفة الجدع 😉",
      text:  "مفيش راجل جدع مش بيشرب قهوه، توليفة الجدع مش لأي حد 😉",
    },
    specs: {
      roast: "وسط",
      types: "أنواع البن: برازيلي + كولومبي | 500 جرام",
    },
  },

  // ─────────────────────────────
  // العرض ٣
  // ─────────────────────────────
  {
    id:          "offer-3",
    name:        "باندل الحشم + مج + 3 كوب",
    cartName:    "عرض الحشم + مج حراري",
    status:      "low-stock",         // ⚠️ كميات محدودة

    imgFront:    "offer1.png",
    imgBack:     "hashm.png",

    discount:    23,
    oldPrice:    850,
    newPrice:    625,

    watchBase:   14,
    rating:      4.9,

    backTitle:   "باندل الحشم 🎁",
    backSub:     "الحشم 500g + مج حراري + 3 أكواب هدية",

    story: {
      title: "باندل الحشم 🎁",
      text:  "توليفة الحشم مع مج حراري + 3 أكواب — الهدية المثالية لمحب القهوة 🔥",
    },
    specs: {
      roast: "وسط",
      types: "الحشم 500g + مج حراري 500ml + 3 أكواب",
    },
  },

  // ─────────────────────────────
  // ➕ لإضافة عرض جديد:
  // انسخ الـ block فوق وعدّل البيانات
  // ─────────────────────────────

];
