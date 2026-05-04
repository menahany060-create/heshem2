// ===== CONFIG =====
// غير الرابط ده لما ترفع السيرفر على الانترنت
const API_BASE = "https://heshem2-production.up.railway.app/api";

// ===== CART =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let appliedPromo = null;

// ===== LOAD PRODUCTS FROM API =====
async function loadProducts() {
  try {
    const res      = await fetch(API_BASE + "/products");
    const json     = await res.json();
    if (!json.success) return;
    renderProducts(json.data);
  } catch (err) {
    console.warn("⚠️ فشل تحميل المنتجات من API، هيشتغل بالبيانات الثابتة");
    // لو السيرفر مش شغال، الصفحة هتشتغل عادي بالـ HTML الموجود
  }
}

// ===== RENDER PRODUCTS DYNAMICALLY =====
function renderProducts(products) {
  const container = document.querySelector(".products");
  if (!container || !products || products.length === 0) return;

  container.innerHTML = "";

  products.forEach((p, idx) => {
    const sizesOptions = p.sizes.map(s =>
      `<option value="${s.weight.replace(" جرام","")}-${s.price}">${s.weight} — ${s.price} جنيه</option>`
    ).join("");

    const caffeineClass =
      p.caffeine < 60 ? "low" :
      p.caffeine < 80 ? "medium" :
      p.caffeine < 95 ? "high" : "extreme";

    const soldOutBanner = p.status === "sold-out"
      ? `<div class="sold-out-banner"><span class="sold-out-icon">🚫</span><span>نفذ من المخزن</span></div>`
      : "";

    const addBtn = p.status !== "sold-out"
      ? `<button class="neonBtn add-btn buy-main-btn" onclick="addProduct(this,'${p.name}')">🛒 إضافة للسلة</button>`
      : "";

    container.innerHTML += `
    <div class="card-wrapper" id="product-${p.name}" data-status="${p.status}" data-index="${idx + 1}">
      <div class="card-inner">
        <div class="card-face card-front">
          <div class="card-bg-blur" style="background-image:url('${p.image}')"></div>
          <span class="prod-badge badge-fire">${p.badge}</span>
          <img src="${p.image}" onerror="this.src=''; this.parentElement.querySelector('.img-fallback').style.display='flex'">
          <div class="img-fallback">☕</div>
          <div class="product-viewers">
            <span class="eye-icon">👁</span>
            <span class="viewers-count" data-min="80" data-max="220">--</span> يتفرج دلوقتي
          </div>
          <div class="star-rating" data-rating="${p.rating}">
            <span class="stars">★★★★★</span>
            <span class="rating-num">${p.rating}</span>
          </div>
          <h3>توليفة ${p.name}</h3>
          <div class="bar">
            <div class="fill ${caffeineClass}" data-caffeine="${p.caffeine}"><span class="percent">0%</span></div>
          </div>
          <small>كافيين ${p.caffeine}%</small>
          <select onchange="updatePrice(this)">${sizesOptions}</select>
          ${soldOutBanner}
          ${addBtn}
          <button class="flip-btn" onclick="flipCard(this)">↩ اقلب الكارد</button>
        </div>
        <div class="card-face card-back">
          <div class="card-bg-blur" style="background-image:url('${p.image}')"></div>
          <img class="back-img" src="${p.image}" onerror="this.style.display='none'">
          <div class="back-product-name">توليفة ${p.name} ☕</div>
          <select onchange="updatePrice(this)">${sizesOptions}</select>
          ${addBtn}
          <div class="back-btns">
            <button class="neonBtn back-story-btn" onclick="openStory('${p.name}','${p.story}')">❓ ليه تشرب توليفة ${p.name}؟</button>
            <button class="neonBtn specs-btn" onclick="openSpecs('${p.specs}','')">📋 المواصفات</button>
            <button class="share-btn" onclick="shareProduct('توليفة ${p.name}', ${p.sizes[0]?.price || 0})">↗ مشاركة</button>
            <button class="flip-btn" onclick="flipCard(this)">↩ ارجع للوش</button>
          </div>
        </div>
      </div>
    </div>`;
  });

  // إعادة تشغيل الـ animations بعد الرندر
  initAfterRender();
}

function initAfterRender() {
  renderStarRatings();
  initViewers();

  document.querySelectorAll(".fill").forEach(bar => {
    const value       = Number(bar.getAttribute("data-caffeine"));
    const percentText = bar.querySelector(".percent");
    if (value < 60)       bar.classList.add("low");
    else if (value < 80)  bar.classList.add("medium");
    else if (value < 95)  bar.classList.add("high");
    else                  bar.classList.add("extreme");
    setTimeout(() => { bar.style.width = value + "%"; }, 400);
    let count = 0;
    const iv = setInterval(() => {
      if (count >= value) { clearInterval(iv); return; }
      count++;
      if (percentText) percentText.innerText = count + "%";
    }, 15);
  });

  document.querySelectorAll(".card-wrapper").forEach(wrapper => {
    if (wrapper.dataset.status !== "sold-out") return;
    wrapper.querySelectorAll(".add-btn").forEach(btn => {
      btn.disabled = true;
      btn.style.display = "none";
    });
    wrapper.querySelectorAll("select").forEach(sel => sel.disabled = true);
  });
}

// ===== ADD PRODUCT FROM CARD =====
function addProduct(btn, name) {
  const wrapper = btn.closest(".card-wrapper");
  if (wrapper.dataset.status === "sold-out") {
    showToast("❌ المنتج ده نفذ من المخزن!");
    return;
  }
  const select = wrapper.querySelector("select");
  const parts  = select.value.split("-");
  const weight = parts[0];
  const price  = Number(parts[1]);
  add(name + " (" + weight + "g)", price);
}

// ===== ADD OFFER =====
function addOffer(btn, name, price) {
  add(name, price);
}

function updatePrice(select) {}

// ===== CORE ADD =====
function add(name, price) {
  let item = cart.find(i => i.name === name);
  if (item) {
    item.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  render();
  showToast("✅ " + name + " اتضافت للسلة!");
}

// ===== CHANGE QUANTITY =====
function changeQty(i, v) {
  cart[i].qty += v;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  render();
}

// ===== RENDER CART =====
function render() {
  const box      = document.getElementById("box");
  const totalEl  = document.getElementById("total");
  const emptyMsg = document.getElementById("empty-cart-msg");
  if (!box || !totalEl) return;

  box.innerHTML = "";
  let rawTotal = 0;

  cart.forEach((c, i) => {
    rawTotal += c.price * c.qty;
    box.innerHTML += `
      <div class="item">
        <div class="left">${c.name}</div>
        <div class="right">${c.price * c.qty} جنيه</div>
        <div class="qty">
          <button onclick="changeQty(${i}, 1)">+</button>
          <span>${c.qty}</span>
          <button onclick="changeQty(${i}, -1)">−</button>
        </div>
      </div>`;
  });

  if (emptyMsg) emptyMsg.style.display = cart.length === 0 ? "block" : "none";

  let finalTotal   = rawTotal;
  const discountLine = document.getElementById("discountLine");

  if (appliedPromo && rawTotal > 0) {
    const discountAmt = Math.round(rawTotal * appliedPromo.discount / 100);
    finalTotal        = rawTotal - discountAmt;
    if (discountLine) {
      discountLine.style.display = "block";
      discountLine.innerText     = "🎟️ خصم " + appliedPromo.discount + "%: -" + discountAmt + " جنيه | الإجمالي: " + finalTotal + " جنيه";
    }
  } else {
    if (discountLine) discountLine.style.display = "none";
  }

  totalEl.innerText = finalTotal + " جنيه";
  document.getElementById("cartCount").innerText = cart.reduce((s, i) => s + i.qty, 0);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ===== FLIP CARD =====
function flipCard(btn) {
  const wrapper = btn.closest(".card-wrapper");
  const inner   = wrapper.querySelector(".card-inner");
  inner.classList.toggle("flipped");
}

function flipOfferCard(btn) {
  const wrapper = btn.closest(".offer-card-wrapper");
  const inner   = wrapper.querySelector(".offer-card-inner");
  inner.classList.toggle("flipped");
}

// ===== POPUPS =====
function openStory(t, x) {
  document.getElementById("title").innerText = t;
  document.getElementById("text").innerText  = x;
  document.getElementById("popup").classList.add("active");
}

function openSpecs(roast, types) {
  document.getElementById("title").innerText = "📋 المواصفات";
  document.getElementById("text").innerText  = roast + (types ? "\n" + types : "");
  document.getElementById("popup").classList.add("active");
}

function openCheckout() {
  if (cart.length === 0) {
    showToast("🛒 السلة فارغة! ضيف منتجات الأول");
    return;
  }
  document.getElementById("checkout").classList.add("active");
}

function closePopup() {
  document.querySelectorAll(".popup").forEach(p => p.classList.remove("active"));
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closePopup();
});

// ===== SEND ORDER VIA API (بدل واتساب مباشرة) =====
async function send() {
  const name    = document.getElementById("name").value.trim();
  const phone   = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!name)    { showToast("⚠️ من فضلك ادخل اسمك");      document.getElementById("name").focus();    return; }
  if (!phone)   { showToast("⚠️ من فضلك ادخل رقم الهاتف"); document.getElementById("phone").focus();   return; }
  if (!/^[0-9+\s\-]{7,15}$/.test(phone)) { showToast("⚠️ رقم الهاتف مش صح"); document.getElementById("phone").focus(); return; }
  if (!address) { showToast("⚠️ من فضلك ادخل العنوان");    document.getElementById("address").focus(); return; }
  if (cart.length === 0) { showToast("🛒 السلة فارغة!"); return; }

  const btn = document.querySelector("#checkout .checkoutBtn");
  if (btn) { btn.disabled = true; btn.innerText = "⏳ جاري الإرسال..."; }

  try {
    // 1) إرسال الطلب للـ API
    const res = await fetch(API_BASE + "/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName:    name,
        customerPhone:   phone,
        customerAddress: address,
        items:           cart,
        promoCode:       appliedPromo?.code || null
      })
    });

    const data = await res.json();

    if (!data.success) {
      showToast("❌ حصل خطأ: " + data.error);
      if (btn) { btn.disabled = false; btn.innerText = "📱 إرسال واتساب"; }
      return;
    }

    // 2) بعد ما الـ API يتأكد، نبعت رسالة واتساب كـ تأكيد للعميل
    let rawTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    let msg = "🛒 *طلب جديد — بن الحشم* ☕\n\n";
    msg += "👤 الاسم: " + name + "\n";
    msg += "📞 الهاتف: " + phone + "\n";
    msg += "📍 العنوان: " + address + "\n";
    msg += "🆔 رقم الطلب: #" + data.orderId?.toString().slice(-6).toUpperCase() + "\n\n";
    msg += "─────────────────\n";
    cart.forEach(c => {
      msg += "☕ " + c.name + " × " + c.qty + " = " + (c.price * c.qty) + " جنيه\n";
    });
    msg += "─────────────────\n";
    if (appliedPromo) {
      const discountAmt = Math.round(rawTotal * appliedPromo.discount / 100);
      msg += "🎟️ كود خصم (" + appliedPromo.code + "): -" + discountAmt + " جنيه\n";
    }
    msg += "💰 *الإجمالي: " + data.totalAfter + " جنيه*";

    window.open("https://wa.me/201223136302?text=" + encodeURIComponent(msg));

    // 3) Reset
    cart         = [];
    appliedPromo = null;
    localStorage.removeItem("cart");
    document.getElementById("name").value    = "";
    document.getElementById("phone").value   = "";
    document.getElementById("address").value = "";
    const promoInput = document.getElementById("promoCode");
    const promoMsg   = document.getElementById("promoMsg");
    if (promoInput) promoInput.value   = "";
    if (promoMsg)   promoMsg.innerText = "";

    render();
    closePopup();
    showToast("✅ تم إرسال طلبك بنجاح!");

  } catch (err) {
    console.error(err);
    showToast("❌ فشل الاتصال بالسيرفر، جرب تاني");
    if (btn) { btn.disabled = false; btn.innerText = "📱 إرسال واتساب"; }
  }
}

// ===== OPEN CART =====
function openCart() {
  const cartEl = document.querySelector(".cart");
  if (cartEl) cartEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ===== FLOATING SHARE HUB =====
function toggleShareHub() {
  document.getElementById("floatingShareHub").classList.toggle("open");
}

document.addEventListener("click", e => {
  const hub = document.getElementById("floatingShareHub");
  if (hub && !hub.contains(e.target)) hub.classList.remove("open");
});

// ===== MENU =====
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

// ===== PROMO CODE (API) =====
async function applyPromo() {
  const code  = document.getElementById("promoCode").value.trim();
  const msgEl = document.getElementById("promoMsg");

  if (!code) {
    msgEl.style.color = "#E8855A";
    msgEl.innerText   = "⚠️ ادخل كود الخصم الأول";
    return;
  }

  try {
    const res  = await fetch(API_BASE + "/promo/validate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code })
    });
    const data = await res.json();

    if (data.valid) {
      appliedPromo      = { code: data.code, discount: data.discount };
      msgEl.style.color = "#7BC67E";
      msgEl.innerText   = "✅ تم تطبيق خصم " + data.discount + "%!";
      render();
    } else {
      appliedPromo      = null;
      msgEl.style.color = "#E8855A";
      msgEl.innerText   = "❌ " + (data.error || "الكود غير صحيح");
      const discountLine = document.getElementById("discountLine");
      if (discountLine) discountLine.style.display = "none";
      render();
    }
  } catch {
    // Fallback للأكواد القديمة لو السيرفر مش شغال
    const localCodes = { "DRDS10": 10, "HESHEM5": 5, "DEVS7": 7 };
    const upper = code.toUpperCase();
    if (localCodes[upper]) {
      appliedPromo = { code: upper, discount: localCodes[upper] };
      msgEl.style.color = "#7BC67E";
      msgEl.innerText   = "✅ تم تطبيق خصم " + localCodes[upper] + "%!";
      render();
    } else {
      msgEl.style.color = "#E8855A";
      msgEl.innerText   = "❌ الكود غير صحيح";
    }
  }
}

// ===== SHARE PRODUCT =====
function shareProduct(name, price) {
  const text = "☕ " + name + " — بن الحشم\nسعر: " + price + " جنيه فقط!\nاطلب دلوقتي: " + window.location.href;
  if (navigator.share) {
    navigator.share({ title: "بن الحشم — " + name, text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast("📋 تم نسخ الرابط!")).catch(() => {});
  }
}

// ===== SCROLL TO PRODUCT =====
function scrollToProduct(name) {
  const target = document.getElementById("product-" + name);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const inner = target.querySelector(".card-front");
    if (inner) {
      inner.style.boxShadow   = "0 0 40px rgba(201,150,42,0.5)";
      inner.style.borderColor = "#C9962A";
      setTimeout(() => { inner.style.boxShadow = ""; inner.style.borderColor = ""; }, 1600);
    }
  }
}

// ===== OFFER TIMER =====
function startOfferTimer() {
  let saved = localStorage.getItem("offerTimerEnd");
  let end;
  if (saved) {
    end = Number(saved);
    if (end < Date.now()) { end = Date.now() + 86400000; localStorage.setItem("offerTimerEnd", end); }
  } else {
    end = Date.now() + 86400000;
    localStorage.setItem("offerTimerEnd", end);
  }
  function tick() {
    let diff = end - Date.now();
    if (diff <= 0) { end = Date.now() + 86400000; localStorage.setItem("offerTimerEnd", end); diff = end - Date.now(); }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const hEl = document.getElementById("timer-h");
    const mEl = document.getElementById("timer-m");
    const sEl = document.getElementById("timer-s");
    if (hEl) hEl.innerText = String(h).padStart(2,"0");
    if (mEl) mEl.innerText = String(m).padStart(2,"0");
    if (sEl) sEl.innerText = String(s).padStart(2,"0");
  }
  tick();
  setInterval(tick, 1000);
}

// ===== VIEWERS =====
let viewerState = {};
function initViewers() {
  document.querySelectorAll(".viewers-count").forEach((el, idx) => {
    const min  = parseInt(el.dataset.min) || 50;
    const max  = parseInt(el.dataset.max) || 200;
    const base = Math.floor(min + Math.random() * (max - min));
    viewerState[idx] = { el, current: base, min, max, nextUpdate: Date.now() + (20 + Math.random() * 40) * 1000, trendBias: Math.random() > 0.4 ? 1 : -1 };
    el.innerText = base;
  });
}
function updateViewers() {
  const now = Date.now();
  Object.values(viewerState).forEach(state => {
    if (now < state.nextUpdate) return;
    let change    = Math.ceil(Math.random() * 4);
    let direction = Math.random() < 0.6 ? state.trendBias : -state.trendBias;
    if (Math.random() < 0.15) state.trendBias = -state.trendBias;
    let newVal = state.current + direction * change;
    if (newVal > state.max) { newVal = state.max - Math.floor(Math.random() * 5); state.trendBias = -1; }
    if (newVal < state.min) { newVal = state.min + Math.floor(Math.random() * 5); state.trendBias = 1; }
    state.current = newVal;
    state.el.innerText = newVal;
    state.nextUpdate = now + (15 + Math.random() * 35) * 1000;
  });
}

// ===== STAR RATING =====
function renderStarRatings() {
  document.querySelectorAll(".star-rating").forEach(el => {
    const rating  = parseFloat(el.dataset.rating) || 4.5;
    const starsEl = el.querySelector(".stars");
    if (!starsEl) return;
    const full  = Math.floor(rating);
    const half  = (rating - full) >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = "";
    for (let i = 0; i < full;  i++) html += '<span style="color:#F5C842;text-shadow:0 0 8px rgba(245,200,66,0.5)">★</span>';
    if (half)                        html += '<span style="color:#F5C842;opacity:0.6">★</span>';
    for (let i = 0; i < empty; i++) html += '<span style="color:rgba(245,200,66,0.2)">★</span>';
    starsEl.innerHTML = html;
  });
}

// ===== TOAST =====
function showToast(msg) {
  const existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast-msg";
  t.innerText = msg;
  Object.assign(t.style, {
    position:"fixed", top:"50%", left:"50%",
    transform:"translate(-50%, -50%) scale(0.9)",
    background:"#C9962A", color:"#1C0A00",
    padding:"14px 24px", borderRadius:"12px",
    fontWeight:"800", fontSize:"15px",
    boxShadow:"0 8px 30px rgba(201,150,42,0.4)",
    zIndex:"999999", opacity:"0",
    transition:"opacity 0.25s, transform 0.25s",
    fontFamily:"'Tajawal', sans-serif",
    textAlign:"center", maxWidth:"300px",
    lineHeight:"1.5", pointerEvents:"none"
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translate(-50%, -50%) scale(1)"; });
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translate(-50%, -50%) scale(0.9)"; setTimeout(() => t.remove(), 300); }, 2000);
}

// ===== INIT =====
window.onload = async function() {
  render();

  // تحميل المنتجات من API (لو السيرفر شغال)
  await loadProducts();

  // Caffeine bars (للمنتجات الثابتة في الـ HTML)
  document.querySelectorAll(".fill").forEach(bar => {
    const value       = Number(bar.getAttribute("data-caffeine"));
    const percentText = bar.querySelector(".percent");
    if (value < 60)      bar.classList.add("low");
    else if (value < 80) bar.classList.add("medium");
    else if (value < 95) bar.classList.add("high");
    else                 bar.classList.add("extreme");
    setTimeout(() => { bar.style.width = value + "%"; }, 400);
    let count = 0;
    const iv = setInterval(() => {
      if (count >= value) { clearInterval(iv); return; }
      count++;
      if (percentText) percentText.innerText = count + "%";
    }, 15);
  });

  // Sold-out
  document.querySelectorAll(".card-wrapper").forEach(wrapper => {
    if (wrapper.dataset.status !== "sold-out") return;
    wrapper.querySelectorAll(".add-btn").forEach(btn => { btn.disabled = true; btn.style.display = "none"; });
    wrapper.querySelectorAll("select").forEach(sel => sel.disabled = true);
    if (!wrapper.querySelector(".sold-out-banner")) {
      const banner = document.createElement("div");
      banner.className = "sold-out-banner";
      banner.innerHTML = '<span class="sold-out-icon">🚫</span><span>نفذ من المخزن</span>';
      const sel = wrapper.querySelector("select");
      if (sel) sel.after(banner);
    }
  });

  renderStarRatings();
  initViewers();
  setInterval(updateViewers, 3000);
  startOfferTimer();
};
