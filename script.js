// =====================================================
// بن الحشم — script.js (Updated UX + Conversion)
// =====================================================

// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];
const promoCodes = { "DRDS10": 10, "HESHEM5": 5, "DEVS7": 7 };
let appliedPromo = null;

// ===== [جديد] Sticky Bar State =====
let stickyProduct = { name: "الحشم", price: 150 };

// =====================================================
// CORE CART LOGIC (محافظ على كل الـ logic الأصلي)
// =====================================================

function addProduct(btn, name) {
  let card = btn.closest(".card");
  if (card.dataset.status === "sold-out") {
    showToast("❌ المنتج ده نفذ من المخزن!"); return;
  }
  let select = card.querySelector("select");
  let parts  = select.value.split("-");
  add(name + " (" + parts[0] + "g)", Number(parts[1]));
}

function addOffer(btn, name, price) { add(name, price); }

function add(name, price) {
  let item = cart.find(i => i.name === name);
  if (item) { item.qty++; } else { cart.push({ name, price, qty: 1 }); }
  render();
  showToast("✅ " + name + " اتضافت للسلة!");
  checkUpsell(); // [جديد]
}

function changeQty(i, v) {
  cart[i].qty += v;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  render();
  checkUpsell();
}

function render() {
  let box       = document.getElementById("box");
  let totalEl   = document.getElementById("total");
  let emptyMsg  = document.getElementById("empty-cart-msg");
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
          <button onclick="changeQty(${i},1)">+</button>
          <span>${c.qty}</span>
          <button onclick="changeQty(${i},-1)">−</button>
        </div>
      </div>`;
  });

  if (emptyMsg) emptyMsg.style.display = cart.length === 0 ? "block" : "none";

  // Re-apply promo (fixes recalculation after adding more items)
  let finalTotal  = rawTotal;
  let discountEl  = document.getElementById("discountLine");
  if (appliedPromo && rawTotal > 0) {
    let disc = Math.round(rawTotal * appliedPromo.discount / 100);
    finalTotal = rawTotal - disc;
    if (discountEl) {
      discountEl.style.display = "block";
      discountEl.innerText = "🎟️ خصم " + appliedPromo.discount + "%: -" + disc + " جنيه | الإجمالي: " + finalTotal + " جنيه";
    }
  } else {
    if (discountEl) discountEl.style.display = "none";
  }

  totalEl.innerText = finalTotal + " جنيه";
  document.getElementById("cartCount").innerText = cart.reduce((s, i) => s + i.qty, 0);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =====================================================
// [جديد] UPSELL BAR — يشجع على زيادة الطلب
// =====================================================
function checkUpsell() {
  let bar = document.getElementById("upsell-bar");
  if (!bar) return;
  let rawTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  if (cart.length === 0) { bar.classList.remove("visible"); bar.style.display="none"; return; }

  const thresholds = [
    { min: 0,   max: 200,  msg: "🎯 أضف منتج وخد خصم 5% على الطلب!" },
    { min: 200, max: 400,  msg: "🔥 باقي " + (400 - rawTotal) + " جنيه للوصول لخصم 10%!" },
    { min: 400, max: 700,  msg: "⚡ باقي " + (700 - rawTotal) + " جنيه للوصول لشحن مجاني!" },
    { min: 700, max: 99999, msg: "🎉 مبروك! شحنك مجاني وخدت أفضل سعر 🚀" }
  ];

  let t = thresholds.find(th => rawTotal >= th.min && rawTotal < th.max);
  if (t) {
    bar.innerText = t.msg;
    bar.style.display = "block";
    bar.classList.add("visible");
  }
}

// =====================================================
// POPUPS
// =====================================================
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
  if (cart.length === 0) { showToast("🛒 السلة فارغة! أضف منتجات الأول"); return; }
  document.getElementById("checkout").classList.add("active");
}

function closePopup() {
  document.querySelectorAll(".popup").forEach(p => p.classList.remove("active"));
}

// ESC closes popup
document.addEventListener("keydown", e => { if (e.key === "Escape") closePopup(); });

// =====================================================
// SEND ORDER (WhatsApp) — مع phone validation
// =====================================================
function send() {
  let name    = document.getElementById("name").value.trim();
  let phone   = document.getElementById("phone").value.trim();
  let address = document.getElementById("address").value.trim();

  if (!name)    { showToast("⚠️ من فضلك ادخل اسمك");         document.getElementById("name").focus();    return; }
  if (!phone)   { showToast("⚠️ من فضلك ادخل رقم الهاتف");  document.getElementById("phone").focus();   return; }
  if (!/^[0-9+\s\-]{7,15}$/.test(phone)) { showToast("⚠️ رقم الهاتف مش صح"); document.getElementById("phone").focus(); return; }
  if (!address) { showToast("⚠️ من فضلك ادخل العنوان");      document.getElementById("address").focus(); return; }
  if (cart.length === 0) { showToast("🛒 السلة فارغة!"); return; }

  let rawTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  let finalTotal = rawTotal;
  let msg = "🛒 *طلب جديد — بن الحشم* ☕\n\n";
  msg += "👤 الاسم: " + name + "\n📞 الهاتف: " + phone + "\n📍 العنوان: " + address + "\n\n─────────────────\n";
  cart.forEach(c => { let t = c.price * c.qty; msg += "☕ " + c.name + " × " + c.qty + " = " + t + " جنيه\n"; });
  msg += "─────────────────\n";
  if (appliedPromo) {
    let disc = Math.round(rawTotal * appliedPromo.discount / 100);
    finalTotal = rawTotal - disc;
    msg += "🎟️ كود خصم (" + appliedPromo.code + "): -" + disc + " جنيه\n";
  }
  msg += "💰 *الإجمالي: " + finalTotal + " جنيه*";

  window.open("https://wa.me/201223136302?text=" + encodeURIComponent(msg));

  // Reset
  cart = []; localStorage.removeItem("cart"); appliedPromo = null;
  ["promoCode","name","phone","address"].forEach(id => { let el = document.getElementById(id); if(el) el.value=""; });
  let pm = document.getElementById("promoMsg"); if(pm) pm.innerText = "";
  render(); closePopup();
  showToast("✅ تم إرسال طلبك بنجاح!");
}

// =====================================================
// PROMO CODE — مع إعادة حساب صحيحة
// =====================================================
function applyPromo() {
  let code  = document.getElementById("promoCode").value.trim().toUpperCase();
  let msgEl = document.getElementById("promoMsg");
  if (!code) { msgEl.style.color="#E8855A"; msgEl.innerText="⚠️ ادخل كود الخصم الأول"; return; }
  if (promoCodes[code]) {
    appliedPromo = { code, discount: promoCodes[code] };
    msgEl.style.color  = "#7BC67E";
    msgEl.innerText    = "✅ تم تطبيق خصم " + appliedPromo.discount + "%!";
    render();
  } else {
    appliedPromo = null;
    msgEl.style.color = "#E8855A";
    msgEl.innerText   = "❌ الكود غير صحيح، حاول تاني";
    let dl = document.getElementById("discountLine"); if(dl) dl.style.display="none";
    render();
  }
}

// =====================================================
// [جديد] EXPANDABLE CARDS — toggle details section
// =====================================================
function toggleDetails(btn) {
  let card    = btn.closest(".card");
  let details = card.querySelector(".card-details");
  let isOpen  = details.classList.contains("open");

  // Close all other open details first (accordion behavior)
  document.querySelectorAll(".card-details.open").forEach(d => {
    d.classList.remove("open");
    let b = d.closest(".card").querySelector(".btn-details");
    if (b) b.textContent = "تفاصيل ↓";
    b.classList.remove("open");
  });

  if (!isOpen) {
    details.classList.add("open");
    btn.textContent = "إخفاء ↑";
    btn.classList.add("open");
    // Animate caffeine bar if not yet animated
    details.querySelectorAll(".fill").forEach(bar => {
      if (bar.style.width === "0%" || bar.style.width === "") {
        let value = Number(bar.getAttribute("data-caffeine"));
        let pt = bar.querySelector(".percent");
        setTimeout(() => { bar.style.width = value + "%"; }, 100);
        let count = 0;
        let iv = setInterval(() => {
          if (count >= value) { clearInterval(iv); return; }
          count++;
          if (pt) pt.innerText = count + "%";
        }, 15);
      }
    });
  }
}

// =====================================================
// [جديد] TOGGLE REVIEWS
// =====================================================
function toggleReviews(name, btn) {
  let section = document.getElementById("reviews-" + name);
  if (!section) return;
  let isOpen = section.classList.contains("open");
  section.classList.toggle("open");
  if (btn) {
    let countSpan = btn.querySelector(".rating-count");
    if (countSpan) {
      let text = countSpan.innerText;
      if (isOpen) {
        countSpan.innerText = text.replace(" ↑", " ↓");
      } else {
        countSpan.innerText = text.replace(" ↓", " ↑");
      }
    }
  }
}

// =====================================================
// [جديد] QUICK ORDER (from main visible button)
// =====================================================
function quickOrder(name, price) {
  // أضف بالسعر الابتدائي وافتح الـ checkout
  add(name + " (125g)", price);
  setTimeout(() => openCheckout(), 300);
}

// =====================================================
// [جديد] STICKY ORDER (from sticky bar)
// =====================================================
function stickyOrder() {
  add(stickyProduct.name + " (125g)", stickyProduct.price);
  setTimeout(() => openCheckout(), 300);
}

// =====================================================
// [جديد] UPDATE CARD PRICE DISPLAY
// =====================================================
function updateCardPrice(select, name) {
  let price = Number(select.value.split("-")[1]);
  let display = document.getElementById("price-display-" + name);
  if (display) display.innerText = price + " جنيه";
}

// =====================================================
// SHARE PRODUCT
// =====================================================
function shareProduct(name, price) {
  let text = "☕ " + name + " — بن الحشم\nسعر: " + price + " جنيه!\nاطلب دلوقتي: " + window.location.href;
  if (navigator.share) {
    navigator.share({ title: "بن الحشم — " + name, text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast("📋 تم نسخ الرابط!")).catch(() => showToast("شارك: " + window.location.href));
  }
}

// =====================================================
// SCROLL TO PRODUCT
// =====================================================
function scrollToProduct(name) {
  let target = document.getElementById("product-" + name);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.style.transition  = "box-shadow 0.3s, border-color 0.3s";
  target.style.boxShadow   = "0 0 35px rgba(201,150,42,0.4)";
  target.style.borderColor = "#C9962A";
  setTimeout(() => { target.style.boxShadow = ""; target.style.borderColor = ""; }, 1600);
}

// =====================================================
// OPEN CART (scroll to)
// =====================================================
function openCart() {
  let cartEl = document.querySelector(".cart");
  if (cartEl) cartEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

// =====================================================
// MENU
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
  let menu = document.getElementById("navMenu");
  let btn  = document.getElementById("menuBtn");
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
});

// =====================================================
// OFFER COUNTDOWN TIMER
// =====================================================
function startOfferTimer() {
  let saved = localStorage.getItem("offerTimerEnd");
  let end   = saved ? Number(saved) : 0;
  if (!saved || end < Date.now()) {
    end = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("offerTimerEnd", end);
  }
  function tick() {
    let diff = end - Date.now();
    if (diff <= 0) { end = Date.now() + 24*60*60*1000; localStorage.setItem("offerTimerEnd", end); diff = end - Date.now(); }
    let h = Math.floor(diff / 3600000);
    let m = Math.floor((diff % 3600000) / 60000);
    let s = Math.floor((diff % 60000) / 1000);
    let hEl=document.getElementById("timer-h"), mEl=document.getElementById("timer-m"), sEl=document.getElementById("timer-s");
    if(hEl) hEl.innerText = String(h).padStart(2,"0");
    if(mEl) mEl.innerText = String(m).padStart(2,"0");
    if(sEl) sEl.innerText = String(s).padStart(2,"0");
  }
  tick(); setInterval(tick, 1000);
}

// =====================================================
// [جديد] WATCHING BADGES — أرقام عشوائية واقعية
// =====================================================
function startWatchingBadges() {
  const products = ["الحشم","أيوب","السكة","الجدع"];
  const base     = { "الحشم": 14, "أيوب": 8, "السكة": 11, "الجدع": 6 };

  products.forEach(name => {
    let badge = document.getElementById("watch-" + name);
    if (!badge) return;
    let span  = badge.querySelector("span");
    let count = base[name] + Math.floor(Math.random() * 5);
    if (span) span.innerText = count;

    // تغيير الرقم كل 8-15 ثانية
    setInterval(() => {
      let delta = Math.random() > 0.5 ? 1 : -1;
      count = Math.max(3, Math.min(count + delta, base[name] + 10));
      if (span) span.innerText = count;
    }, 8000 + Math.random() * 7000);
  });
}

// =====================================================
// [جديد] STICKY BUY BAR — يظهر بعد الـ hero
// =====================================================
function initStickyBar() {
  let bar = document.getElementById("sticky-bar");
  if (!bar) return;

  // تتبع أي كارد visible حالياً وتحديث الـ sticky bar
  let observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        let card  = entry.target;
        let name  = card.dataset.name;
        let price = Number(card.dataset.basePrice);
        if (name && price && card.dataset.status !== "sold-out") {
          stickyProduct = { name, price };
          let nameEl = document.getElementById("sticky-name");
          if (nameEl) nameEl.innerText = "توليفة " + name;
        }
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll(".card[data-name]").forEach(card => observer.observe(card));

  // يظهر الـ sticky bar بعد ما المستخدم يتجاوز الـ hero
  let hero = document.getElementById("hero");
  let scrollObs = new IntersectionObserver(entries => {
    let heroVisible = entries[0].isIntersecting;
    if (heroVisible) { bar.classList.remove("visible"); }
    else             { bar.classList.add("visible"); }
  }, { threshold: 0.1 });
  if (hero) scrollObs.observe(hero);
}

// =====================================================
// TOAST
// =====================================================
function showToast(msg) {
  let old = document.querySelector(".toast-msg"); if(old) old.remove();
  let t = document.createElement("div");
  t.className = "toast-msg";
  t.innerText = msg;
  Object.assign(t.style, {
    position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%) scale(0.9)",
    background:"#C9962A", color:"#1C0A00", padding:"13px 22px", borderRadius:"12px",
    fontWeight:"800", fontSize:"14px", boxShadow:"0 8px 28px rgba(201,150,42,0.4)",
    zIndex:"999999", opacity:"0", transition:"opacity 0.22s, transform 0.22s",
    fontFamily:"'Tajawal',sans-serif", textAlign:"center", maxWidth:"300px",
    lineHeight:"1.5", pointerEvents:"none"
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity="1"; t.style.transform="translate(-50%,-50%) scale(1)"; });
  setTimeout(() => {
    t.style.opacity="0"; t.style.transform="translate(-50%,-50%) scale(0.9)";
    setTimeout(()=>t.remove(), 250);
  }, 2000);
}

// =====================================================
// INIT
// =====================================================
window.onload = function() {
  render();

  // Sold Out: أضف badge و disable الأزرار
  document.querySelectorAll(".card[data-status='sold-out']").forEach(card => {
    // الـ btn-order بالفعل disabled في الـ HTML، بس للتأكيد:
    let orderBtn = card.querySelector(".btn-order");
    if (orderBtn) { orderBtn.disabled = true; }
    // disable إضافة للسلة في الـ details
    card.querySelectorAll(".add-btn").forEach(b => {
      b.disabled = true; b.style.opacity="0.35"; b.style.pointerEvents="none";
    });
  });

  // Offer timer
  startOfferTimer();

  // Watching badges
  startWatchingBadges();

  // Sticky bar
  initStickyBar();

  // Initial upsell check (لو في سلة محفوظة)
  checkUpsell();
};
