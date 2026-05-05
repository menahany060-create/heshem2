const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const jwt      = require("jsonwebtoken");
const path     = require("path");

const app  = express();
const PORT = process.env.PORT || 8080;

const MONGO_URI     = "mongodb+srv://admin:menadrds060@cluster0.sowaunm.mongodb.net/benelhesham?appName=Cluster0";
const JWT_SECRET    = "benelhesham_secret_2026";
const ADMIN_USER    = "admin";
const ADMIN_PASS    = "admin123";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== MONGODB =====
function connectDB() {
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000, socketTimeoutMS: 45000 })
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => { console.error("❌ MongoDB:", err.message); setTimeout(connectDB, 10000); });
}
connectDB();
mongoose.connection.on("disconnected", () => { console.log("⚠️ Reconnecting..."); setTimeout(connectDB, 5000); });

// ===== SCHEMAS =====
const productSchema = new mongoose.Schema({
  name: String, badge: String, caffeine: Number, rating: { type: Number, default: 4.5 },
  status: { type: String, default: "available" }, image: String, story: String, specs: String,
  sizes: [{ weight: String, price: Number }], createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  items: [{ name: String, price: Number, qty: Number, subtotal: Number }],
  promoCode: String, discount: { type: Number, default: 0 },
  totalBefore: Number, totalAfter: Number,
  status: { type: String, default: "جديد" },
  createdAt: { type: Date, default: Date.now }
});

const promoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true },
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Product   = mongoose.model("Product",   productSchema);
const Order     = mongoose.model("Order",     orderSchema);
const PromoCode = mongoose.model("PromoCode", promoSchema);

// ===== AUTH =====
function authAdmin(req, res, next) {
  try {
    const token = (req.headers["authorization"] || "").split(" ")[1];
    if (!token) return res.status(401).json({ error: "مفيش توكن" });
    jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: "توكن غلط أو انتهى" }); }
}

// ===== PUBLIC =====
app.get("/api/products", async (req, res) => {
  try { res.json({ success: true, data: await Product.find().sort({ createdAt: 1 }) }); }
  catch { res.status(500).json({ error: "خطأ في السيرفر" }); }
});

app.post("/api/promo/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ valid: false, error: "ادخل الكود" });
    const promo = await PromoCode.findOne({ code: code.toUpperCase(), active: true });
    if (!promo) return res.json({ valid: false, error: "الكود غلط أو منتهي" });
    if (promo.usedCount >= promo.maxUses) return res.json({ valid: false, error: "الكود وصل الحد الأقصى" });
    res.json({ valid: true, discount: promo.discount, code: promo.code });
  } catch { res.status(500).json({ valid: false, error: "خطأ في السيرفر" }); }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, items, promoCode } = req.body;
    if (!customerName || !customerPhone || !customerAddress) return res.status(400).json({ error: "بيانات ناقصة" });
    if (!items || items.length === 0) return res.status(400).json({ error: "السلة فارغة" });

    let totalBefore = items.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0, appliedCode = null;

    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), active: true });
      if (promo && promo.usedCount < promo.maxUses) {
        discount = Math.round(totalBefore * promo.discount / 100);
        appliedCode = promo.code;
        promo.usedCount++;
        await promo.save();
      }
    }

    const order = await Order.create({
      customerName, customerPhone, customerAddress,
      items: items.map(i => ({ name: i.name, price: i.price, qty: i.qty, subtotal: i.price * i.qty })),
      promoCode: appliedCode, discount, totalBefore, totalAfter: totalBefore - discount
    });

    res.json({ success: true, orderId: order._id, totalAfter: order.totalAfter });
  } catch (err) { console.error(err); res.status(500).json({ error: "خطأ في السيرفر" }); }
});

// ===== ADMIN =====
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token });
  }
  res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غلط" });
});

app.get("/api/admin/orders", authAdmin, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    const total  = await Order.countDocuments(filter);
    res.json({ success: true, data: orders, total });
  } catch { res.status(500).json({ error: "خطأ في السيرفر" }); }
});

app.patch("/api/admin/orders/:id", authAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ error: "الطلب مش موجود" });
    res.json({ success: true, data: order });
  } catch { res.status(500).json({ error: "خطأ في السيرفر" }); }
});

// ===== DELETE ORDER =====
app.delete("/api/admin/orders/:id", authAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: "الطلب مش موجود" });
    res.json({ success: true, deletedTotal: order.totalAfter });
  } catch { res.status(500).json({ error: "خطأ في السيرفر" }); }
});

// ===== STATS =====
app.get("/api/admin/stats", authAdmin, async (req, res) => {
  try {
    const totalOrders  = await Order.countDocuments();
    const newOrders    = await Order.countDocuments({ status: "جديد" });
    const rev          = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAfter" } } }]);
    res.json({ success: true, totalOrders, newOrders, totalRevenue: rev[0]?.total || 0 });
  } catch { res.status(500).json({ error: "خطأ في السيرفر" }); }
});

app.post("/api/admin/promo", authAdmin, async (req, res) => {
  try { res.json({ success: true, data: await PromoCode.create(req.body) }); }
  catch { res.status(500).json({ error: "الكود موجود بالفعل أو في خطأ" }); }
});

app.get("/api/admin/promo", authAdmin, async (req, res) => {
  try { res.json({ success: true, data: await PromoCode.find().sort({ createdAt: -1 }) }); }
  catch { res.status(500).json({ error: "خطأ في السيرفر" }); }
});

app.post("/api/admin/products", authAdmin, async (req, res) => {
  try { res.json({ success: true, data: await Product.create(req.body) }); }
  catch { res.status(500).json({ error: "خطأ في إضافة المنتج" }); }
});

app.patch("/api/admin/products/:id", authAdmin, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ error: "المنتج مش موجود" });
    res.json({ success: true, data: p });
  } catch { res.status(500).json({ error: "خطأ في تعديل المنتج" }); }
});

// ===== SEED =====
app.get("/api/seed", async (req, res) => {
  try {
    await Product.deleteMany({});
    await Product.insertMany([
      { name:"الحشم",    badge:"🔥 الأقوى",   caffeine:90, rating:4.8, image:"hashm.png",    status:"available", story:"No Pain No Gain 💪 — اسعى واجتهد وربنا هيديك على قد تعبك.", specs:"درجة التحميص: وسط | أنواع البن: برازيلي + حبشي + كولومبي + ارابيكا", sizes:[{weight:"100 جرام",price:80},{weight:"500 جرام",price:380}] },
      { name:"أيوب",    badge:"🏅 الكلاسيك", caffeine:65, rating:4.6, image:"ayoub.png",    status:"available", story:"اشرب الصبر واستمتع بالفرج ❤️", specs:"درجة التحميص: وسط | أنواع البن: برازيلي + روبوستا", sizes:[{weight:"100 جرام",price:75},{weight:"500 جرام",price:350}] },
      { name:"ع السكة", badge:"🚗 للطريق",   caffeine:80, rating:4.7, image:"sikka.png",    status:"available", story:"استمتع بالرحله... السكه طويله 🚗", specs:"درجة التحميص: وسط | أنواع البن: برازيلي + كولومبي + اثيوبي", sizes:[{weight:"100 جرام",price:65},{weight:"500 جرام",price:300}] },
      { name:"الجدع",   badge:"💪 للجدعان", caffeine:50, rating:4.5, image:"gad3.png",     status:"available", story:"توليفة الجدع... لكل راجل جدع 😉", specs:"درجة التحميص: وسط | أنواع البن: يمني + كولومبي", sizes:[{weight:"100 جرام",price:55},{weight:"500 جرام",price:250}] },
      { name:"ESPRESSO", badge:"⚡ قريباً",  caffeine:95, rating:4.9, image:"espresso.png", status:"sold-out",  story:"ESPRESSO 🔥 — جرعة كافيين مركزة!", specs:"تحميص داكن + نكهة قوية مركزة", sizes:[{weight:"125 جرام",price:150},{weight:"250 جرام",price:250},{weight:"500 جرام",price:350}] }
    ]);
    await PromoCode.deleteMany({});
    await PromoCode.insertMany([{ code:"DRDS10",discount:10 },{ code:"HESHEM5",discount:5 },{ code:"DEVS7",discount:7 }]);
    res.json({ success: true, message: "✅ تم إضافة البيانات بنجاح!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`🚀 السيرفر شغال على http://localhost:${PORT}`));
