// =====================================================
//  بن الحشم — script.js  v5
//  بيبني الكارود كلها تلقائياً من products.js
// =====================================================

// ===== CART STATE =====
let cart         = JSON.parse(localStorage.getItem("cart")) || [];
const promoCodes = { "DRDS10": 10, "HESHEM5": 5, "DEVS7": 7 };
let appliedPromo = null;
let stickyData   = { name: "الحشم", price: 150 };

// =====================================================
//  HELPERS
// =====================================================
function canBuy(status) {
  return status === "available" || status === "low-stock";
}

function esc(str) {
  return (str || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

function buildStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "★" : "") + "☆".repeat(empty);
}

// =====================================================
//  BADGE
// =====================================================
function buildBadge(item, isOffer) {
  const s = item.status;
  if (s === "sold-out")   return `<span class="flip-badge badge-soldout">❌ نفذ</span>`;
  if (s === "coming-soon")return `<span class="flip-badge badge-coming">🔜 قريباً</span>`;
  if (s === "low-stock")  return `<span class="flip-badge badge-lowstock">⚠️ كميات محدودة</span>`;

  if (isOffer) return `<span class="flip-badge badge-offer">-${item.discount}%</span>`;

  if (item.badge === "bestseller") return `<span class="flip-badge badge-bestseller">🔥 الأكثر مبيعاً</span>`;
  if (item.badge === "new")        return `<span class="flip-badge badge-new">✨ جديد</span>`;
  if (item.badge === "hot")        return `<span class="flip-badge badge-hot">💥 الأقوى</span>`;
  return "";
}

// =====================================================
//  STATUS OVERLAY (sold-out / coming-soon)
// =====================================================
function buildOverlay(status) {
  if (status === "sold-out")
    return `<div class="status-overlay overlay-soldout"><span class="overlay-badge overlay-badge-soldout">❌ نفذ من المخزن</span></div>`;
  if (status === "coming-soon")
    return `<div class="status-overlay overlay-coming"><span class="overlay-badge overlay-badge-coming">🔜 قريباً</span></div>`;
  return "";
}

// =====================================================
//  LOW STOCK BAR
// =====================================================
function buildLowStock(status) {
  if (status === "low-stock")
    return `<div class="low-stock-bar">⚠️ كميات محدودة — اطلب الآن!</div>`;
  return "";
}

// =====================================================
//  CAFFEINE BAR HTML
// =====================================================
function buildCafBar(p) {
  return `
    <div class="caf-wrap">
      <span class="caf-pct-label ${p.caffeineLevel}" id="caf-pct-${p.id}">0%</span>
      <div class="caf-track">
        <div class="caf-fill ${p.caffeineLevel}" data-target="${p.caffeine}" id="caf-fill-${p.id}"></div>
      </div>
    </div>`;
}

// =====================================================
//  SIZES SELECT
// =====================================================
function buildSelect(p) {
  const opts = p.weights.map(s =>
    `<option value="${s.w}-${s.price}">${s.w} جرام — ${s.price} جنيه</option>`
  ).join("");
  return `<select onclick="event.stopPropagation()" onchange="updatePrice(this,'${p.id}')">${opts}</select>`;
}

// =====================================================
//  BUILD PRODUCT CARD
// =====================================================
function buildProductCard(p) {
  const buyable  = canBuy(p.status);
  const dimClass = (p.status === "sold-out" || p.status === "coming-soon") ? "dim-card" : "";

  const buyBtn = buyable
    ? `<button class="flip-buy-btn" onclick="event.stopPropagation(); addProduct(this,'${esc(p.id)}')">🛒 أضف للسلة</button>`
    : `<button class="flip-buy-btn flip-buy-disabled" disabled>${p.status === "coming-soon" ? "🔜 قريباً" : "❌ غير متاح"}</button>`;

  const watchHTML = p.watchBase > 0
    ? `<div class="watching-badge-flip" id="watch-${p.id}">👁 <span>${p.watchBase}</span></div>` : "";

  const backHintColor = p.status === "coming-soon" ? "color:#D4B4FF" : "";

  return `
<div class="flip-card ${dimClass}"
     id="product-${p.id}"
     data-status="${p.status}"
     data-name="${p.id}"
     data-price="${p.basePrice}">
  <div class="flip-inner">

    <!-- FRONT -->
    <div class="flip-front">
      <div class="flip-bg-circles">
        <div class="fcircle" style="background:${p.c1}"></div>
        <div class="fcircle fc-right" style="background:${p.c2}"></div>
        <div class="fcircle fc-bottom" style="background:${p.c3}"></div>
      </div>
      ${buildOverlay(p.status)}
      ${buildLowStock(p.status)}

      <div class="flip-front-content">
        ${buildBadge(p, false)}

        <div class="flip-img-wrap">
          <img src="${p.imgFront}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="flip-img-fallback">☕</div>
          ${watchHTML}
        </div>

        <div class="flip-desc-box">
          <div class="flip-name-row">
            <strong>${p.name}</strong>
            <span class="caf-label ${p.caffeineLevel}">${p.caffeineLabel}</span>
          </div>

          ${buildCafBar(p)}

          <div class="flip-rating-row">
            <span class="stars-mini">${buildStars(p.rating)}</span>
            <span class="rating-num-sm">${p.rating}</span>
            <span class="rating-count-sm">(${p.reviewCount})</span>
          </div>

          <div class="flip-price-row">
            <span class="price-from-sm">يبدأ من</span>
            <span class="flip-new-price" id="price-${p.id}">${p.basePrice} جنيه</span>
          </div>

          ${buyable ? buildSelect(p) : ""}
          ${buyBtn}
        </div>
      </div>
    </div>

    <!-- BACK -->
    <div class="flip-back">
      <div class="flip-back-glow"></div>
      <div class="flip-back-content">
        <img src="${p.imgBack}" class="flip-back-img" onerror="this.style.display='none'">
        <p class="flip-back-title">${p.backTitle}</p>
        <p class="flip-back-sub">${p.backSub}</p>
        <div class="back-review">
          <span class="stars-mini">${p.backReview.stars}</span>
          <span class="back-review-text">${p.backReview.text}</span>
        </div>
        <div class="flip-back-btns">
          <button class="flip-back-btn" onclick="event.stopPropagation(); openPopup('${esc(p.story.title)}','${esc(p.story.text)}')">💬 ليه تشربها؟</button>
          <button class="flip-back-btn" onclick="event.stopPropagation(); openPopup('📋 المواصفات','درجة التحميص: ${esc(p.specs.roast)}\\n${esc(p.specs.types)}')">📋 المواصفات</button>
          <button class="flip-back-btn share-sm" onclick="event.stopPropagation(); shareProduct('${esc(p.name)}',${p.basePrice})">↗ شارك</button>
        </div>
        <p class="flip-back-hint" style="${backHintColor}">${p.backHint}</p>
      </div>
    </div>

  </div>
</div>`;
}

// =====================================================
//  BUILD OFFER CARD
// =====================================================
function buildOfferCard(o) {
  const buyable  = canBuy(o.status);
  const dimClass = (o.status === "sold-out" || o.status === "coming-soon") ? "dim-card" : "";

  const buyBtn = buyable
    ? `<button class="flip-buy-btn" onclick="event.stopPropagation(); addOffer('${esc(o.cartName)}',${o.newPrice})">🛒 أضف للسلة</button>`
    : `<button class="flip-buy-btn flip-buy-disabled" disabled>${o.status === "coming-soon" ? "🔜 قريباً" : "❌ غير متاح"}</button>`;

  return `
<div class="flip-card offer-flip ${dimClass}"
     id="${o.id}"
     data-status="${o.status}">
  <div class="flip-inner">

    <!-- FRONT -->
    <div class="flip-front">
      <div class="flip-bg-circles">
        <div class="fcircle" style="background:#C9962A"></div>
        <div class="fcircle fc-right" style="background:#8B5E10"></div>
        <div class="fcircle fc-bottom" style="background:#E8B84B"></div>
      </div>
      ${buildOverlay(o.status)}
      ${buildLowStock(o.status)}

      <div class="flip-front-content">
        ${buildBadge(o, true)}

          <div class="flip-img-wrap">
          <img src="${o.imgFront}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="flip-img-fallback">🎁</div>
          <div class="watching-badge-flip" id="watch-${o.id}">👁 <span>${o.watchBase}</span></div>
        </div>

        <div class="flip-desc-box">
          <div class="flip-name-row"><strong>${o.name}</strong></div>
          <div class="flip-price-row">
            <span class="flip-old-price">${o.oldPrice} جنيه</span>
            <span class="flip-new-price">${o.newPrice} جنيه</span>
          </div>
          <div class="flip-rating-row">
            <span class="stars-mini">${buildStars(o.rating)}</span>
            <span class="rating-num-sm">${o.rating}</span>
          </div>
          ${buyBtn}
        </div>
      </div>
    </div>

    <!-- BACK -->
    <div class="flip-back">
      <div class="flip-back-glow"></div>
      <div class="flip-back-content">
        <img src="${o.imgBack}" class="flip-back-img" onerror="this.style.display='none'">
        <p class="flip-back-title">${o.backTitle}</p>
        <p class="flip-back-sub">${o.backSub}</p>
        <div class="flip-back-btns">
          <button class="flip-back-btn" onclick="event.stopPropagation(); openPopup('${esc(o.story.title)}','${esc(o.story.text)}')">💬 تفاصيل العرض</button>
          <button class="flip-back-btn" onclick="event.stopPropagation(); openPopup('📋 المحتويات','درجة التحميص: ${esc(o.specs.roast)}\\n${esc(o.specs.types)}')">📋 المحتويات</button>
          <button class="flip-back-btn share-sm" onclick="event.stopPropagation(); shareProduct('${esc(o.name)}',${o.newPrice})">↗ شارك</button>
        </div>
        <p class="flip-back-hint">اقلب للشراء 👆</p>
      </div>
    </div>

  </div>
</div>`;
}

// =====================================================
//  BUILD BESTSELLERS
// =====================================================
function buildBestsellers() {
  const wrap = document.getElementById("bestsellers-wrap");
  if (!wrap) return;
  const items = PRODUCTS.filter(p => canBuy(p.status)).slice(0, 4);
  wrap.innerHTML = items.map(p => `
    <div class="bs-card" onclick="scrollToProduct('${p.id}')">
      <span class="badge-bs">🔥</span>
      <img src="${p.imgFront}" onerror="this.style.display='none'">
      <p>${p.id}</p>
    </div>`).join("");
}

// =====================================================
//  RENDER ALL CARDS
// =====================================================
function renderAll() {
  const pw = document.getElementById("products-wrap");
  const ow = document.getElementById("offers-wrap");
  if (pw) pw.innerHTML = PRODUCTS.map(buildProductCard).join("");
  if (ow) ow.innerHTML = OFFERS.map(buildOfferCard).join("");
  buildBestsellers();
  animateCafBars();
  initWatching();
}

// =====================================================
//  CAFFEINE BAR ANIMATION
// =====================================================
function animateCafBars() {
  document.querySelectorAll(".caf-fill[data-target]").forEach(fill => {
    const target = Number(fill.dataset.target);
    const id     = fill.id.replace("caf-fill-", "");
    const pctEl  = document.getElementById("caf-pct-" + id);

    setTimeout(() => { fill.style.width = target + "%"; }, 400);

    let count = 0;
    const iv  = setInterval(() => {
      if (count >= target) { clearInterval(iv); return; }
      count++;
      if (pctEl) pctEl.innerText = count + "%";
    }, 14);
  });
}

// =====================================================
//  FLIP TOGGLE (موبايل click، ديسكتوب CSS hover)
// =====================================================


// =====================================================
//  CART
// =====================================================
function addProduct(btn, id) {
  const card = btn.closest(".flip-card");
  if (!canBuy(card?.dataset.status)) { showToast("❌ المنتج مش متاح حالياً!"); return; }
  const sel    = card.querySelector("select");
  const parts  = sel ? sel.value.split("-") : ["125", String(PRODUCTS.find(p => p.id === id)?.basePrice || 0)];
  addToCart(`${id} (${parts[0]}g)`, Number(parts[1]));
}

function addOffer(name, price) { addToCart(name, price); }

function addToCart(name, price) {
  const item = cart.find(i => i.name === name);
  if (item) { item.qty++; } else { cart.push({ name, price, qty: 1 }); }
  renderCart();
  showToast("✅ " + name + " اتضافت للسلة!");
  checkUpsell();
}

function changeQty(i, v) {
  cart[i].qty += v;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  renderCart();
  checkUpsell();
}

function renderCart() {
  const box      = document.getElementById("cart-items");
  const totalEl  = document.getElementById("total");
  const emptyMsg = document.getElementById("empty-cart-msg");
  if (!box || !totalEl) return;

  box.innerHTML = "";
  let raw = 0;
  cart.forEach((c, i) => {
    raw += c.price * c.qty;
    box.innerHTML += `
      <div class="item">
        <div class="left">${c.name}</div>
        <div class="right">${c.price * c.qty} جنيه</div>
        <div class="qty">
          <button onclick="changeQty(${i},1)">+</button>
          <span>${c.qty}</span>
          <button onclick="changeQty(${i},-1)">−</button>
        </div>
      </div>`;
  });

  if (emptyMsg) emptyMsg.style.display = cart.length === 0 ? "block" : "none";

  let final = raw;
  const dl  = document.getElementById("discountLine");
  if (appliedPromo && raw > 0) {
    const disc = Math.round(raw * appliedPromo.discount / 100);
    final = raw - disc;
    if (dl) { dl.style.display = "block"; dl.innerText = `🎟️ خصم ${appliedPromo.discount}%: -${disc} جنيه | الإجمالي: ${final} جنيه`; }
  } else {
    if (dl) dl.style.display = "none";
  }

  totalEl.innerText = final + " جنيه";
  document.getElementById("cartCount").innerText = cart.reduce((s, i) => s + i.qty, 0);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =====================================================
//  UPSELL BAR
// =====================================================
function checkUpsell() {
  const bar = document.getElementById("upsell-bar");
  if (!bar) return;
  const raw = cart.reduce((s, c) => s + c.price * c.qty, 0);
  if (!cart.length) { bar.classList.remove("visible"); bar.style.display = "none"; return; }
  const steps = [
    { min: 0,   max: 200,  msg: "🎯 أضف منتج وخد خصم 5%!" },
    { min: 200, max: 400,  msg: `🔥 باقي ${400 - raw} جنيه لخصم 10%!` },
    { min: 400, max: 700,  msg: `⚡ باقي ${700 - raw} جنيه لشحن مجاني!` },
    { min: 700, max: 99999,msg: "🎉 مبروك! شحنك مجاني 🚀" },
  ];
  const step = steps.find(s => raw >= s.min && raw < s.max);
  if (step) { bar.innerText = step.msg; bar.style.display = "block"; bar.classList.add("visible"); }
}

// =====================================================
//  PROMO
// =====================================================
function applyPromo() {
  const code  = document.getElementById("promoCode").value.trim().toUpperCase();
  const msgEl = document.getElementById("promoMsg");
  if (!code) { msgEl.style.color = "#E8855A"; msgEl.innerText = "⚠️ ادخل كود الخصم الأول"; return; }
  if (promoCodes[code]) {
    appliedPromo = { code, discount: promoCodes[code] };
    msgEl.style.color = "#7BC67E"; msgEl.innerText = `✅ تم تطبيق خصم ${appliedPromo.discount}%!`;
    renderCart();
  } else {
    appliedPromo = null;
    msgEl.style.color = "#E8855A"; msgEl.innerText = "❌ الكود غير صحيح";
    const dl = document.getElementById("discountLine"); if (dl) dl.style.display = "none";
    renderCart();
  }
}

// =====================================================
//  POPUPS
// =====================================================
function openPopup(title, text) {
  document.getElementById("popup-title").innerText = title;
  document.getElementById("popup-text").innerText  = text;
  document.getElementById("popup").classList.add("active");
}

function openCheckout() {
  if (!cart.length) { showToast("🛒 السلة فارغة! أضف منتجات الأول"); return; }
  document.getElementById("checkout").classList.add("active");
}

function closePopup() {
  document.querySelectorAll(".popup").forEach(p => p.classList.remove("active"));
}

document.addEventListener("keydown", e => { if (e.key === "Escape") closePopup(); });

// =====================================================
//  SEND ORDER — واتساب
// =====================================================
function send() {
  const name    = document.getElementById("name").value.trim();
  const phone   = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!name)    { showToast("⚠️ ادخل اسمك");         document.getElementById("name").focus();    return; }
  if (!phone)   { showToast("⚠️ ادخل رقم الهاتف");   document.getElementById("phone").focus();   return; }
  if (!/^[0-9+\s\-]{7,15}$/.test(phone)) { showToast("⚠️ رقم الهاتف مش صح"); document.getElementById("phone").focus(); return; }
  if (!address) { showToast("⚠️ ادخل العنوان");       document.getElementById("address").focus(); return; }
  if (!cart.length) { showToast("🛒 السلة فارغة!"); return; }

  let raw = cart.reduce((s, c) => s + c.price * c.qty, 0);
  let final = raw;
  let msg = `🛒 *طلب جديد — بن الحشم* ☕\n\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n\n─────────────\n`;
  cart.forEach(c => { msg += `☕ ${c.name} × ${c.qty} = ${c.price * c.qty} جنيه\n`; });
  msg += "─────────────\n";
  if (appliedPromo) {
    const disc = Math.round(raw * appliedPromo.discount / 100);
    final = raw - disc;
    msg += `🎟️ كود (${appliedPromo.code}): -${disc} جنيه\n`;
  }
  msg += `💰 *الإجمالي: ${final} جنيه*`;

  window.open("https://wa.me/201223136302?text=" + encodeURIComponent(msg));

  cart = []; localStorage.removeItem("cart"); appliedPromo = null;
  ["promoCode","name","phone","address"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  const pm = document.getElementById("promoMsg"); if (pm) pm.innerText = "";
  renderCart(); closePopup();
  showToast("✅ تم إرسال طلبك!");
}

// =====================================================
//  PRICE DISPLAY UPDATE
// =====================================================
function updatePrice(sel, id) {
  const price = Number(sel.value.split("-")[1]);
  const el    = document.getElementById("price-" + id);
  if (el) el.innerText = price + " جنيه";
}

// =====================================================
//  STICKY + QUICK
// =====================================================
function stickyOrder() {
  addToCart(stickyData.name + " (125g)", stickyData.price);
  setTimeout(() => openCheckout(), 300);
}

// =====================================================
//  SHARE
// =====================================================
function shareProduct(name, price) {
  const text = `☕ ${name} — بن الحشم\nسعر: ${price} جنيه!\n${window.location.href}`;
  if (navigator.share) {
    navigator.share({ title: "بن الحشم", text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast("📋 تم نسخ الرابط!")).catch(() => {});
  }
}

// =====================================================
//  SCROLL TO PRODUCT
// =====================================================
function scrollToProduct(id) {
  const el = document.getElementById("product-" + id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const inner = el.querySelector(".flip-inner");
  if (inner) {
    inner.style.transition = "box-shadow .3s";
    inner.style.boxShadow  = "0 0 35px rgba(201,150,42,.6), 0 0 0 2px #C9962A";
    setTimeout(() => { inner.style.boxShadow = ""; }, 1800);
  }
}

function openCart() {
  const c = document.querySelector(".cart");
  if (c) c.scrollIntoView({ behavior: "smooth", block: "center" });
}

// =====================================================
//  MENU
// =====================================================
function toggleMenu() {
  document.getElementById("navMenu").classList.toggle("open");
  document.getElementById("menuBtn").classList.toggle("open");
}
function closeMenu() {
  document.getElementById("navMenu").classList.remove("open");
  document.getElementById("menuBtn").classList.remove("open");
}
document.addEventListener("click", e => {
  const menu = document.getElementById("navMenu");
  const btn  = document.getElementById("menuBtn");
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
});

// =====================================================
//  OFFER TIMER
// =====================================================
function startTimer() {
  let end = Number(localStorage.getItem("offerEnd") || 0);
  if (!end || end < Date.now()) { end = Date.now() + 24 * 3600 * 1000; localStorage.setItem("offerEnd", end); }
  function tick() {
    let d = end - Date.now();
    if (d <= 0) { end = Date.now() + 24 * 3600 * 1000; localStorage.setItem("offerEnd", end); d = 24 * 3600 * 1000; }
    const h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000), s = Math.floor((d % 60000) / 1000);
    const he = document.getElementById("timer-h"), me = document.getElementById("timer-m"), se = document.getElementById("timer-s");
    if (he) he.innerText = String(h).padStart(2, "0");
    if (me) me.innerText = String(m).padStart(2, "0");
    if (se) se.innerText = String(s).padStart(2, "0");
  }
  tick(); setInterval(tick, 1000);
}

// =====================================================
//  WATCHING BADGES
// =====================================================
function initWatching() {
  [...PRODUCTS, ...OFFERS].forEach(item => {
    const id    = item.id;
    const base  = item.watchBase || 5;
    const badge = document.getElementById("watch-" + id);
    if (!badge) return;
    const span  = badge.querySelector("span");
    let count   = base + Math.floor(Math.random() * 4);
    if (span) span.innerText = count;
    setInterval(() => {
      count = Math.max(2, Math.min(count + (Math.random() > .5 ? 1 : -1), base + 10));
      if (span) span.innerText = count;
    }, 7000 + Math.random() * 6000);
  });
}

// =====================================================
//  STICKY BAR
// =====================================================
function initStickyBar() {
  const bar = document.getElementById("sticky-bar");
  if (!bar) return;

  const cardObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const card = e.target;
        const name = card.dataset.name;
        const price = Number(card.dataset.price);
        if (name && price && canBuy(card.dataset.status)) {
          stickyData = { name, price };
          const el = document.getElementById("sticky-name");
          if (el) el.innerText = "توليفة " + name;
        }
      }
    });
  }, { threshold: .5 });

  document.querySelectorAll(".flip-card[data-name]").forEach(c => cardObs.observe(c));

  const hero = document.getElementById("hero");
  if (hero) {
    new IntersectionObserver(entries => {
      bar.classList.toggle("visible", !entries[0].isIntersecting);
    }, { threshold: .1 }).observe(hero);
  }
}

// =====================================================
//  TOAST
// =====================================================
function showToast(msg) {
  const old = document.querySelector(".toast-el"); if (old) old.remove();
  const t   = document.createElement("div");
  t.className = "toast-el"; t.innerText = msg;
  Object.assign(t.style, {
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%) scale(.9)",
    background:"#C9962A", color:"#1C0A00", padding:"13px 22px", borderRadius:"12px",
    fontWeight:"800", fontSize:"14px", boxShadow:"0 8px 28px rgba(201,150,42,.4)",
    zIndex:"999999", opacity:"0", transition:"opacity .22s, transform .22s",
    fontFamily:"'Tajawal',sans-serif", textAlign:"center", maxWidth:"300px",
    lineHeight:"1.5", pointerEvents:"none",
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translate(-50%,-50%) scale(1)"; });
  setTimeout(() => {
    t.style.opacity = "0"; t.style.transform = "translate(-50%,-50%) scale(.9)";
    setTimeout(() => t.remove(), 250);
  }, 2200);
}


function initFlipSystem() {
  const isMobile = window.matchMedia("(hover: none)").matches;

  document.querySelectorAll(".flip-card").forEach(card => {
    const img = card.querySelector(".flip-img-wrap");

    // ✅ الفليب على الصورة بس
    if (img) {
      img.addEventListener("click", (e) => {
        if (!isMobile) return;

        e.stopPropagation();

        // يقفل أي كارد تاني
        document.querySelectorAll(".flip-card.flipped").forEach(c => {
          if (c !== card) c.classList.remove("flipped");
        });

        card.classList.toggle("flipped");
      });
    }

    // ❌ أي click تاني جوه الكارد → مفيش flip
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".flip-img-wrap")) {
        e.stopPropagation();
      }
    });
  });

  // 👇 قفل الكارد لو دوست بره
  document.addEventListener("click", () => {
    document.querySelectorAll(".flip-card.flipped").forEach(c => {
      c.classList.remove("flipped");
    });
  });
}
// =====================================================
//  INIT
// =====================================================
window.onload = function () {
  renderAll();
  renderCart();
  startTimer();
  initStickyBar();
  checkUpsell();

  initFlipSystem(); // 🔥 مهم
};
