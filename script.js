// ===== CART (localStorage) =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const promoCodes = {
  "DRDS10":  10,
  "HESHEM5": 5,
  "DEVS7":   7
};

let appliedPromo = null;

// ===== ADD PRODUCT FROM CARD =====
function addProduct(btn, name) {
  let wrapper = btn.closest(".card-wrapper");

  if (wrapper.dataset.status === "sold-out") {
    showToast("❌ المنتج ده نفذ من المخزن!");
    return;
  }

  let select = wrapper.querySelector("select");
  let parts  = select.value.split("-");
  let weight = parts[0];
  let price  = Number(parts[1]);
  add(name + " (" + weight + "g)", price);
}

// ===== ADD OFFER =====
function addOffer(btn, name, price) {
  add(name, price);
}

// ===== UPDATE DISPLAYED PRICE =====
function updatePrice(select) {
  // Visual update only — real price comes from select.value on addProduct
}

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
  let box      = document.getElementById("box");
  let totalEl  = document.getElementById("total");
  let emptyMsg = document.getElementById("empty-cart-msg");
  if (!box || !totalEl) return;

  box.innerHTML = "";
  let rawTotal  = 0;

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
  let discountLine = document.getElementById("discountLine");

  if (appliedPromo && rawTotal > 0) {
    let discountAmt = Math.round(rawTotal * appliedPromo.discount / 100);
    finalTotal      = rawTotal - discountAmt;
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

// ===== FLIP PRODUCT CARD =====
function flipCard(btn) {
  let wrapper = btn.closest(".card-wrapper");
  let inner   = wrapper.querySelector(".card-inner");
  inner.classList.toggle("flipped");
}

// ===== FLIP OFFER CARD =====
function flipOfferCard(btn) {
  let wrapper = btn.closest(".offer-card-wrapper");
  let inner   = wrapper.querySelector(".offer-card-inner");
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
  document.getElementById("text").innerText  = "درجة التحميص: " + roast + "\n" + types;
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

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closePopup();
});

// ===== SEND ORDER VIA WHATSAPP =====
function send() {
  let name    = document.getElementById("name").value.trim();
  let phone   = document.getElementById("phone").value.trim();
  let address = document.getElementById("address").value.trim();

  if (!name) {
    showToast("⚠️ من فضلك ادخل اسمك");
    document.getElementById("name").focus();
    return;
  }
  if (!phone) {
    showToast("⚠️ من فضلك ادخل رقم الهاتف");
    document.getElementById("phone").focus();
    return;
  }
  if (!/^[0-9+\s\-]{7,15}$/.test(phone)) {
    showToast("⚠️ رقم الهاتف مش صح");
    document.getElementById("phone").focus();
    return;
  }
  if (!address) {
    showToast("⚠️ من فضلك ادخل العنوان");
    document.getElementById("address").focus();
    return;
  }
  if (cart.length === 0) {
    showToast("🛒 السلة فارغة!");
    return;
  }

  let rawTotal   = cart.reduce((s, c) => s + c.price * c.qty, 0);
  let finalTotal = rawTotal;

  let msg = "🛒 *طلب جديد — بن الحشم* ☕\n\n";
  msg += "👤 الاسم: " + name + "\n";
  msg += "📞 الهاتف: " + phone + "\n";
  msg += "📍 العنوان: " + address + "\n\n";
  msg += "─────────────────\n";

  cart.forEach(c => {
    msg += "☕ " + c.name + " × " + c.qty + " = " + (c.price * c.qty) + " جنيه\n";
  });

  msg += "─────────────────\n";

  if (appliedPromo) {
    let discountAmt = Math.round(rawTotal * appliedPromo.discount / 100);
    finalTotal      = rawTotal - discountAmt;
    msg += "🎟️ كود خصم (" + appliedPromo.code + "): -" + discountAmt + " جنيه\n";
  }

  msg += "💰 *الإجمالي: " + finalTotal + " جنيه*";

  window.open("https://wa.me/201223136302?text=" + encodeURIComponent(msg));

  // Reset
  cart         = [];
  appliedPromo = null;
  localStorage.removeItem("cart");

  let promoInput = document.getElementById("promoCode");
  let promoMsg   = document.getElementById("promoMsg");
  if (promoInput) promoInput.value   = "";
  if (promoMsg)   promoMsg.innerText = "";

  document.getElementById("name").value    = "";
  document.getElementById("phone").value   = "";
  document.getElementById("address").value = "";

  render();
  closePopup();
  showToast("✅ تم إرسال طلبك بنجاح!");
}

// ===== SCROLL TO CART =====
function openCart() {
  let cartEl = document.querySelector(".cart");
  if (cartEl) cartEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ===== FLOATING SHARE HUB =====
function toggleShareHub() {
  document.getElementById("floatingShareHub").classList.toggle("open");
}

// إغلاق لو الكلك برا
document.addEventListener("click", function(e) {
  let hub = document.getElementById("floatingShareHub");
  if (hub && !hub.contains(e.target)) hub.classList.remove("open");
});

// ===== MENU TOGGLE =====
function toggleMenu() {
  document.getElementById("navMenu").classList.toggle("open");
  document.getElementById("menuBtn").classList.toggle("open");
}

function closeMenu() {
  document.getElementById("navMenu").classList.remove("open");
  document.getElementById("menuBtn").classList.remove("open");
}

document.addEventListener("click", function(e) {
  let menu = document.getElementById("navMenu");
  let btn  = document.getElementById("menuBtn");
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
});

// ===== PROMO CODE =====
function applyPromo() {
  let code     = document.getElementById("promoCode").value.trim().toUpperCase();
  let msgEl    = document.getElementById("promoMsg");

  if (!code) {
    msgEl.style.color = "#E8855A";
    msgEl.innerText   = "⚠️ ادخل كود الخصم الأول";
    return;
  }

  if (promoCodes[code]) {
    appliedPromo      = { code, discount: promoCodes[code] };
    msgEl.style.color = "#7BC67E";
    msgEl.innerText   = "✅ تم تطبيق خصم " + appliedPromo.discount + "%!";
    render();
  } else {
    appliedPromo      = null;
    msgEl.style.color = "#E8855A";
    msgEl.innerText   = "❌ الكود غير صحيح، حاول تاني";
    let discountLine  = document.getElementById("discountLine");
    if (discountLine) discountLine.style.display = "none";
    render();
  }
}

// ===== SHARE PRODUCT =====
function shareProduct(name, price) {
  let text = "☕ " + name + " — بن الحشم\nسعر: " + price + " جنيه فقط!\nاطلب دلوقتي: " + window.location.href;

  if (navigator.share) {
    navigator.share({
      title: "بن الحشم — " + name,
      text:  text,
      url:   window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 تم نسخ الرابط!");
    }).catch(() => {
      showToast("شارك الرابط: " + window.location.href);
    });
  }
}

// ===== SCROLL TO PRODUCT =====
function scrollToProduct(name) {
  let target = document.getElementById("product-" + name);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    let inner = target.querySelector(".card-front");
    if (inner) {
      inner.style.transition  = "box-shadow 0.3s, border-color 0.3s";
      inner.style.boxShadow   = "0 0 40px rgba(201,150,42,0.5)";
      inner.style.borderColor = "#C9962A";
      setTimeout(() => {
        inner.style.boxShadow   = "";
        inner.style.borderColor = "";
      }, 1600);
    }
  }
}

// ===== OFFER COUNTDOWN TIMER =====
function startOfferTimer() {
  let saved = localStorage.getItem("offerTimerEnd");
  let end;
  if (saved) {
    end = Number(saved);
    if (end < Date.now()) {
      end = Date.now() + (24 * 60 * 60 * 1000);
      localStorage.setItem("offerTimerEnd", end);
    }
  } else {
    end = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem("offerTimerEnd", end);
  }

  function tick() {
    let diff = end - Date.now();
    if (diff <= 0) {
      end = Date.now() + (24 * 60 * 60 * 1000);
      localStorage.setItem("offerTimerEnd", end);
      diff = end - Date.now();
    }
    let h = Math.floor(diff / 3600000);
    let m = Math.floor((diff % 3600000) / 60000);
    let s = Math.floor((diff % 60000) / 1000);

    let hEl = document.getElementById("timer-h");
    let mEl = document.getElementById("timer-m");
    let sEl = document.getElementById("timer-s");

    if (hEl) hEl.innerText = String(h).padStart(2, "0");
    if (mEl) mEl.innerText = String(m).padStart(2, "0");
    if (sEl) sEl.innerText = String(s).padStart(2, "0");
  }

  tick();
  setInterval(tick, 1000);
}

// ===== VIEWERS COUNTER — Realistic simulation =====
// Each product has its own "base" viewer count that drifts naturally
let viewerState = {};

function initViewers() {
  document.querySelectorAll(".viewers-count").forEach((el, idx) => {
    let min = parseInt(el.dataset.min) || 50;
    let max = parseInt(el.dataset.max) || 200;

    // Start at a random realistic number within range
    let base = Math.floor(min + Math.random() * (max - min));
    viewerState[idx] = {
      el,
      current: base,
      min,
      max,
      // Each counter has its own update rhythm (20–60 seconds)
      nextUpdate: Date.now() + (20 + Math.random() * 40) * 1000,
      // Trend: slightly more likely to tick up than down (people arriving)
      trendBias: Math.random() > 0.4 ? 1 : -1
    };

    el.innerText = base;
  });
}

function updateViewers() {
  let now = Date.now();

  Object.values(viewerState).forEach(state => {
    if (now < state.nextUpdate) return;

    // Change amount: 1 to 4, weighted towards smaller changes
    let change = Math.ceil(Math.random() * 4);

    // Direction: biased towards trend, but can flip
    let direction = Math.random() < 0.6 ? state.trendBias : -state.trendBias;

    // Occasionally reverse the trend naturally (people leaving / arriving in waves)
    if (Math.random() < 0.15) state.trendBias = -state.trendBias;

    let newVal = state.current + direction * change;

    // Clamp within range with a soft bounce
    if (newVal > state.max) {
      newVal = state.max - Math.floor(Math.random() * 5);
      state.trendBias = -1;
    }
    if (newVal < state.min) {
      newVal = state.min + Math.floor(Math.random() * 5);
      state.trendBias = 1;
    }

    state.current = newVal;
    state.el.innerText = newVal;

    // Next update in 15–50 seconds (randomized per element)
    state.nextUpdate = now + (15 + Math.random() * 35) * 1000;
  });
}

// ===== STAR RATING RENDER =====
function renderStarRatings() {
  document.querySelectorAll(".star-rating").forEach(el => {
    let rating = parseFloat(el.dataset.rating) || 4.5;
    let starsEl = el.querySelector(".stars");
    if (!starsEl) return;

    // Build partial star display using CSS trick with gold/grey
    let full  = Math.floor(rating);
    let half  = (rating - full) >= 0.5 ? 1 : 0;
    let empty = 5 - full - half;

    let html = "";
    for (let i = 0; i < full;  i++) html += '<span style="color:#F5C842;text-shadow:0 0 8px rgba(245,200,66,0.5)">★</span>';
    if (half)                        html += '<span style="color:#F5C842;opacity:0.6;text-shadow:0 0 8px rgba(245,200,66,0.3)">★</span>';
    for (let i = 0; i < empty; i++) html += '<span style="color:rgba(245,200,66,0.2)">★</span>';

    starsEl.innerHTML = html;
  });
}

// ===== TOAST =====
function showToast(msg) {
  let existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();

  let t = document.createElement("div");
  t.className = "toast-msg";
  t.innerText = msg;

  Object.assign(t.style, {
    position:      "fixed",
    top:           "50%",
    left:          "50%",
    transform:     "translate(-50%, -50%) scale(0.9)",
    background:    "#C9962A",
    color:         "#1C0A00",
    padding:       "14px 24px",
    borderRadius:  "12px",
    fontWeight:    "800",
    fontSize:      "15px",
    boxShadow:     "0 8px 30px rgba(201,150,42,0.4)",
    zIndex:        "999999",
    opacity:       "0",
    transition:    "opacity 0.25s, transform 0.25s",
    fontFamily:    "'Tajawal', sans-serif",
    textAlign:     "center",
    maxWidth:      "300px",
    lineHeight:    "1.5",
    pointerEvents: "none"
  });

  document.body.appendChild(t);

  requestAnimationFrame(() => {
    t.style.opacity   = "1";
    t.style.transform = "translate(-50%, -50%) scale(1)";
  });

  setTimeout(() => {
    t.style.opacity   = "0";
    t.style.transform = "translate(-50%, -50%) scale(0.9)";
    setTimeout(() => t.remove(), 300);
  }, 2000);
}

// ===== INIT =====
window.onload = function() {
  render();

  // Caffeine bars animation
  document.querySelectorAll(".fill").forEach(bar => {
    let value       = Number(bar.getAttribute("data-caffeine"));
    let percentText = bar.querySelector(".percent");

    if      (value < 60) bar.classList.add("low");
    else if (value < 80) bar.classList.add("medium");
    else if (value < 95) bar.classList.add("high");
    else                 bar.classList.add("extreme");

    setTimeout(() => { bar.style.width = value + "%"; }, 400);

    let count = 0;
    let iv = setInterval(() => {
      if (count >= value) { clearInterval(iv); return; }
      count++;
      if (percentText) percentText.innerText = count + "%";
    }, 15);
  });

  // ===== SOLD-OUT — كل اللي محتاج تعمله هو data-status="sold-out" على الـ card-wrapper =====
  document.querySelectorAll(".card-wrapper").forEach(wrapper => {
    if (wrapper.dataset.status !== "sold-out") return;

    // إخفاء زرار الإضافة
    wrapper.querySelectorAll(".add-btn").forEach(btn => {
      btn.disabled = true;
      btn.style.display = "none";
    });

    // تعطيل الـ select
    wrapper.querySelectorAll("select").forEach(sel => sel.disabled = true);

    // إضافة بانر "نفذ" بعد الـ select أوتوماتيك لو مش موجود
    if (!wrapper.querySelector(".sold-out-banner")) {
      let banner = document.createElement("div");
      banner.className = "sold-out-banner";
      banner.innerHTML = '<span class="sold-out-icon">🚫</span><span>نفذ من المخزن</span>';
      let sel = wrapper.querySelector("select");
      if (sel) sel.after(banner);
    }
  });

  // Star ratings
  renderStarRatings();

  // Viewers counter
  initViewers();
  setInterval(updateViewers, 3000); // Check every 3 seconds, but each counter updates on its own timer

  // Offer timer
  startOfferTimer();
};
