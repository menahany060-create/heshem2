require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

const app  = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // هنحط ملفات الموقع هنا

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ===================================================
//                     SCHEMAS
// ===================================================

// ----- Product -----
const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: String,
  image:       String,
  caffeine:    Number,
  badge:       String,
  rating:      { type: Number, default: 4.5 },
  status:      { type: String, enum: ["available", "sold-out"], default: "available" },
  sizes: [
    {
      weight: String,   // "100 جرام"
      price:  Number    // 80
    }
  ],
  story:       String,
  specs:       String,
  createdAt:   { type: Date, default: Date.now }
});

// ----- Order -----
const orderSchema = new mongoose.Schema({
  customerName:    { type: String, required: true },
  customerPhone:   { type: String, required: true },
  customerAddress: { type: String, required: true },
  items: [
    {
      name:     String,
      price:    Number,
      qty:      Number,
      subtotal: Number
    }
  ],
  promoCode:     String,
  discount:      { type: Number, default: 0 },
  totalBefore:   Number,
  totalAfter:    Number,
  status: {
    type:    String,
    enum:    ["جديد", "قيد التجهيز", "تم الشحن", "تم التسليم", "ملغي"],
    default: "جديد"
  },
  notes:     String,
  createdAt: { type: Date, default: Date.now }
});

// ----- Promo Code -----
const promoSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true, uppercase: true },
  discount:  { type: Number, required: true },   // نسبة % مثلاً 10
  maxUses:   { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  active:    { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Product   = mongoose.model("Product",   productSchema);
const Order     = mongoose.model("Order",     orderSchema);
const PromoCode = mongoose.model("PromoCode", promoSchema);

// ===================================================
//               ADMIN AUTH MIDDLEWARE
// ===================================================
function authAdmin(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "مفيش توكن" });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "توكن غلط أو انتهى" });
  }
}

// ===================================================
//                  PUBLIC ROUTES
// ===================================================

// --- GET all products ---
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// --- Validate promo code ---
app.post("/api/promo/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "ادخل الكود" });

    const promo = await PromoCode.findOne({ code: code.toUpperCase(), active: true });

    if (!promo)
      return res.status(404).json({ valid: false, error: "الكود غلط أو منتهي" });

    if (promo.usedCount >= promo.maxUses)
      return res.status(400).json({ valid: false, error: "الكود اتاستخدم الحد الأقصى" });

    res.json({ valid: true, discount: promo.discount, code: promo.code });
  } catch (err) {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// --- Place order ---
app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, items, promoCode } = req.body;

    // Validation
    if (!customerName || !customerPhone || !customerAddress)
      return res.status(400).json({ error: "بيانات العميل ناقصة" });

    if (!items || items.length === 0)
      return res.status(400).json({ error: "السلة فارغة" });

    // Calculate totals
    let totalBefore = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    let discount    = 0;
    let appliedCode = null;

    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), active: true });
      if (promo && promo.usedCount < promo.maxUses) {
        discount    = Math.round(totalBefore * promo.discount / 100);
        appliedCode = promo.code;
        promo.usedCount++;
        await promo.save();
      }
    }

    const totalAfter = totalBefore - discount;

    const order = await Order.create({
      customerName,
      customerPhone,
      customerAddress,
      items: items.map(i => ({
        name:     i.name,
        price:    i.price,
        qty:      i.qty,
        subtotal: i.price * i.qty
      })),
      promoCode:   appliedCode,
      discount,
      totalBefore,
      totalAfter
    });

    res.json({ success: true, orderId: order._id, totalAfter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// ===================================================
//                   ADMIN ROUTES
// ===================================================

// --- Admin login ---
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token });
  }
  res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غلط" });
});

// --- Get all orders ---
app.get("/api/admin/orders", authAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: orders, total });
  } catch (err) {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// --- Update order status ---
app.patch("/api/admin/orders/:id", authAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(notes && { notes }) },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "الطلب مش موجود" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// --- Get dashboard stats ---
app.get("/api/admin/stats", authAdmin, async (req, res) => {
  try {
    const totalOrders  = await Order.countDocuments();
    const newOrders    = await Order.countDocuments({ status: "جديد" });
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAfter" } } }
    ]);
    res.json({
      success: true,
      totalOrders,
      newOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// --- Add product ---
app.post("/api/admin/products", authAdmin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ error: "خطأ في إضافة المنتج" });
  }
});

// --- Update product ---
app.patch("/api/admin/products/:id", authAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: "المنتج مش موجود" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ error: "خطأ في تعديل المنتج" });
  }
});

// --- Add promo code ---
app.post("/api/admin/promo", authAdmin, async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.json({ success: true, data: promo });
  } catch (err) {
    res.status(500).json({ error: "الكود موجود أو في خطأ" });
  }
});

// --- Get all promo codes ---
app.get("/api/admin/promo", authAdmin, async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json({ success: true, data: promos });
  } catch (err) {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// --- Seed initial products (run once) ---
app.post("/api/admin/seed", authAdmin, async (req, res) => {
  try {
    await Product.deleteMany({});
    await Product.insertMany([
      {
        name: "الحشم", badge: "🔥 الأقوى", caffeine: 90, rating: 4.8,
        story: "No Pain... No Gain 💪 — مفيش حاجه هتجيلك لحد عندك، اسعى واجتهد.",
        specs: "درجة التحميص: وسط | أنواع البن: برازيلي + حبشي + كولومبي + ارابيكا",
        image: "hashm.png", status: "available",
        sizes: [{ weight: "100 جرام", price: 80 }, { weight: "500 جرام", price: 380 }]
      },
      {
        name: "أيوب", badge: "🏅 الكلاسيك", caffeine: 65, rating: 4.6,
        story: "اشرب الصبر واستمتع بالفرج ❤️ — سيدنا ايوب صبر وربنا فرجها عليه.",
        specs: "درجة التحميص: وسط | أنواع البن: برازيلي + روبوستا",
        image: "ayoub.png", status: "available",
        sizes: [{ weight: "100 جرام", price: 75 }, { weight: "500 جرام", price: 350 }]
      },
      {
        name: "ع السكة", badge: "🚗 للطريق", caffeine: 80, rating: 4.7,
        story: "استمتع بالرحله... السكه طويله 🚗 — توليفة للتركيز في رحلتك.",
        specs: "درجة التحميص: وسط | أنواع البن: برازيلي + كولومبي + اثيوبي",
        image: "sikka.png", status: "available",
        sizes: [{ weight: "100 جرام", price: 65 }, { weight: "500 جرام", price: 300 }]
      },
      {
        name: "الجدع", badge: "💪 للجدعان", caffeine: 50, rating: 4.5,
        story: "توليفة الجدع... لكل راجل جدع 😉 — مش لأي حد.",
        specs: "درجة التحميص: وسط | أنواع البن: يمني + كولومبي",
        image: "gad3.png", status: "available",
        sizes: [{ weight: "100 جرام", price: 55 }, { weight: "500 جرام", price: 250 }]
      },
      {
        name: "ESPRESSO", badge: "⚡ قريباً", caffeine: 95, rating: 4.9,
        story: "ESPRESSO 🔥 — جرعة كافيين مركزة تعيشك فايق على الآخر!",
        specs: "درجة التحميص: ESPRESSO | تحميص داكن + نكهة قوية مركزة",
        image: "espresso.png", status: "sold-out",
        sizes: [
          { weight: "125 جرام", price: 150 },
          { weight: "250 جرام", price: 250 },
          { weight: "500 جرام", price: 350 }
        ]
      }
    ]);

    await PromoCode.deleteMany({});
    await PromoCode.insertMany([
      { code: "DRDS10",  discount: 10 },
      { code: "HESHEM5", discount: 5  },
      { code: "DEVS7",   discount: 7  }
    ]);

    res.json({ success: true, message: "تم إضافة البيانات الأولية بنجاح ✅" });
  } catch (err) {
    res.status(500).json({ error: "خطأ في الـ seed" });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على http://localhost:${PORT}`);
});
