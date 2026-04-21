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
  let card = btn.closest(".card");

  if (card.dataset.status === "sold-out") {
    showToast("❌ المنتج ده نفذ من المخزن!");
    return;
  }

  let select = card.querySelector("select");
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
  let box     = document.getElementById("box");
  let totalEl = document.getElementById("total");
  let emptyMsg = document.getElementById("empty-cart-msg");
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

  // Show/hide empty message
  if (emptyMsg) emptyMsg.style.display = cart.length === 0 ? "block" : "none";

  // Re-apply promo if active (fixes recalculation after adding items)
  let finalTotal = rawTotal;
  let discountLine = document.getElementById("discountLine");

  if (appliedPromo && rawTotal > 0) {
    let discountAmt = Math.round(rawTotal * appliedPromo.discount / 100);
    finalTotal = rawTotal - discountAmt;
    if (discountLine) {
      discountLine.style.display = "block";
      discountLine.innerText = "🎟️ خصم " + appliedPromo.discount + "%: -" + discountAmt + " جنيه | الإجمالي: " + finalTotal + " جنيه";
    }
  } else {
    if (discountLine) discountLine.style.display = "none";
  }

  totalEl.innerText = finalTotal + " جنيه";
  document.getElementById("cartCount").innerText = cart.reduce((s, i) => s + i.qty, 0);
  localStorage.setItem("cart", JSON.stringify(cart));
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
    showToast("🛒 السلة فارغة! أضف منتجات الأول");
    return;
  }
  document.getElementById("checkout").classList.add("active");
}

function closePopup() {
  document.querySelectorAll(".popup").forEach(p => p.classList.remove("active"));
}

// ESC key closes popups
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closePopup();
});

// ===== SEND ORDER VIA WHATSAPP =====
function send() {
  let name    = document.getElementById("name").value.trim();
  let phone   = document.getElementById("phone").value.trim();
  let address = document.getElementById("address").value.trim();

  // Validation
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

  let rawTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  let finalTotal = rawTotal;

  let msg = "🛒 *طلب جديد — بن الحشم* ☕\n\n";
  msg += "👤 الاسم: " + name + "\n";
  msg += "📞 الهاتف: " + phone + "\n";
  msg += "📍 العنوان: " + address + "\n\n";
  msg += "─────────────────\n";

  cart.forEach(c => {
    let t = c.price * c.qty;
    msg += "☕ " + c.name + " × " + c.qty + " = " + t + " جنيه\n";
  });

  msg += "─────────────────\n";

  if (appliedPromo) {
    let discountAmt = Math.round(rawTotal * appliedPromo.discount / 100);
    finalTotal = rawTotal - discountAmt;
    msg += "🎟️ كود خصم (" + appliedPromo.code + "): -" + discountAmt + " جنيه\n";
  }

  msg += "💰 *الإجمالي: " + finalTotal + " جنيه*";

  window.open("https://wa.me/201223136302?text=" + encodeURIComponent(msg));

  // Reset
  cart = [];
  localStorage.removeItem("cart");
  appliedPromo = null;

  let promoInput = document.getElementById("promoCode");
  let promoMsg   = document.getElementById("promoMsg");
  if (promoInput) promoInput.value = "";
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
  let code    = document.getElementById("promoCode").value.trim().toUpperCase();
  let msgEl   = document.getElementById("promoMsg");
  let rawTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  if (!code) {
    msgEl.style.color = "#E8855A";
    msgEl.innerText   = "⚠️ ادخل كود الخصم الأول";
    return;
  }

  if (promoCodes[code]) {
    appliedPromo = { code, discount: promoCodes[code] };
    msgEl.style.color = "#7BC67E";
    msgEl.innerText   = "✅ تم تطبيق خصم " + appliedPromo.discount + "%!";
    render(); // re-render to show updated total
  } else {
    appliedPromo = null;
    msgEl.style.color = "#E8855A";
    msgEl.innerText   = "❌ الكود غير صحيح، حاول تاني";
    let discountLine = document.getElementById("discountLine");
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
    // Fallback: copy to clipboard
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
    target.style.transition  = "box-shadow 0.3s, border-color 0.3s";
    target.style.boxShadow   = "0 0 40px rgba(201,150,42,0.45)";
    target.style.borderColor = "#C9962A";
    setTimeout(() => {
      target.style.boxShadow   = "";
      target.style.borderColor = "";
    }, 1600);
  }
}

// ===== OFFER COUNTDOWN TIMER =====
function startOfferTimer() {
  // Set timer end: next midnight from page load
  let saved = localStorage.getItem("offerTimerEnd");
  let end;
  if (saved) {
    end = Number(saved);
    // If expired, reset to new 24h window
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
      // Reset timer
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

// ===== TOAST =====
function showToast(msg) {
  let existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();

  let t = document.createElement("div");
  t.className = "toast-msg";
  t.innerText = msg;

  Object.assign(t.style, {
    position:   "fixed",
    top:        "50%",
    left:       "50%",
    transform:  "translate(-50%, -50%) scale(0.9)",
    background: "#C9962A",
    color:      "#1C0A00",
    padding:    "14px 24px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize:   "15px",
    boxShadow:  "0 8px 30px rgba(201,150,42,0.4)",
    zIndex:     "999999",
    opacity:    "0",
    transition: "opacity 0.25s, transform 0.25s",
    fontFamily: "'Tajawal', sans-serif",
    textAlign:  "center",
    maxWidth:   "300px",
    lineHeight: "1.5",
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
    else                  bar.classList.add("extreme");

    setTimeout(() => { bar.style.width = value + "%"; }, 400);

    let count = 0;
    let iv = setInterval(() => {
      if (count >= value) { clearInterval(iv); return; }
      count++;
      if (percentText) percentText.innerText = count + "%";
    }, 15);
  });

  // Sold Out badges + disable buttons
  document.querySelectorAll(".card[data-status='sold-out']").forEach(card => {
    let badge = document.createElement("div");
    badge.className = "sold-out-badge";
    badge.innerText = "❌ نفذ من المخزن";
    let img = card.querySelector("img");
    if (img) img.after(badge);

    card.querySelectorAll(".neonBtn").forEach(btn => {
      if (btn.innerText.includes("إضافة") || btn.innerText.includes("🛒")) {
        btn.disabled        = true;
        btn.style.opacity   = "0.35";
        btn.style.cursor    = "not-allowed";
        btn.style.pointerEvents = "none";
      }
    });
  });

  // Offer timer
  startOfferTimer();
};
