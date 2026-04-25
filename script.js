// =====================================================
//  بن الحشم — script.js  v5 (FIXED FLIP SYSTEM)
// =====================================================

// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];
const promoCodes = { "DRDS10": 10, "HESHEM5": 5, "DEVS7": 7 };
let appliedPromo = null;
let stickyData = { name: "الحشم", price: 150 };

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
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "★" : "") + "☆".repeat(empty);
}

// =====================================================
//  FLIP SYSTEM (NEW FIXED VERSION)
// =====================================================
function initFlipSystem() {
  const isMobile = window.matchMedia("(hover: none)").matches;

  document.querySelectorAll(".flip-card").forEach(card => {
    const img = card.querySelector(".flip-img-wrap");

    // flip فقط من الصورة
    if (img) {
      img.addEventListener("click", (e) => {
        if (!isMobile) return;

        e.stopPropagation();

        document.querySelectorAll(".flip-card.flipped").forEach(c => {
          if (c !== card) c.classList.remove("flipped");
        });

        card.classList.toggle("flipped");
      });
    }

    // منع أي click تاني يعمل flip
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".flip-img-wrap")) {
        e.stopPropagation();
      }
    });
  });

  // قفل لما تدوس بره
  document.addEventListener("click", () => {
    document.querySelectorAll(".flip-card.flipped").forEach(c => {
      c.classList.remove("flipped");
    });
  });
}

// =====================================================
//  BADGE
// =====================================================
function buildBadge(item, isOffer) {
  const s = item.status;
  if (s === "sold-out") return `<span class="flip-badge badge-soldout">❌ نفذ</span>`;
  if (s === "coming-soon") return `<span class="flip-badge badge-coming">🔜 قريباً</span>`;
  if (s === "low-stock") return `<span class="flip-badge badge-lowstock">⚠️ كميات محدودة</span>`;

  if (isOffer) return `<span class="flip-badge badge-offer">-${item.discount}%</span>`;

  if (item.badge === "bestseller") return `<span class="flip-badge badge-bestseller">🔥 الأكثر مبيعاً</span>`;
  if (item.badge === "new") return `<span class="flip-badge badge-new">✨ جديد</span>`;
  if (item.badge === "hot") return `<span class="flip-badge badge-hot">💥 الأقوى</span>`;
  return "";
}

// =====================================================
//  OVERLAY
// =====================================================
function buildOverlay(status) {
  if (status === "sold-out")
    return `<div class="status-overlay overlay-soldout"></div>`;
  if (status === "coming-soon")
    return `<div class="status-overlay overlay-coming"></div>`;
  return "";
}

// =====================================================
//  LOW STOCK
// =====================================================
function buildLowStock(status) {
  if (status === "low-stock")
    return `<div class="low-stock-bar">⚠️ كميات محدودة</div>`;
  return "";
}

// =====================================================
//  PRODUCT CARD
// =====================================================
function buildProductCard(p) {
  const buyable = canBuy(p.status);
  const dimClass = (p.status === "sold-out" || p.status === "coming-soon") ? "dim-card" : "";

  const buyBtn = buyable
    ? `<button onclick="event.stopPropagation(); addProduct(this,'${esc(p.id)}')">🛒 أضف للسلة</button>`
    : `<button disabled>❌ غير متاح</button>`;

  return `
<div class="flip-card ${dimClass}" id="product-${p.id}" data-status="${p.status}" data-name="${p.id}">
  <div class="flip-inner">

    <!-- FRONT -->
    <div class="flip-front">
      ${buildOverlay(p.status)}
      ${buildLowStock(p.status)}

      <div class="flip-img-wrap">
        <img src="${p.imgFront}">
      </div>

      <div class="flip-desc-box">
        <strong>${p.name}</strong>
        <div>${p.basePrice} جنيه</div>
        ${buyBtn}
      </div>
    </div>

    <!-- BACK -->
    <div class="flip-back">
      <p>${p.backTitle}</p>
    </div>

  </div>
</div>`;
}

// =====================================================
//  OFFER CARD
// =====================================================
function buildOfferCard(o) {
  return `
<div class="flip-card" id="${o.id}" data-status="${o.status}">
  <div class="flip-inner">

    <div class="flip-front">
      <div class="flip-img-wrap">
        <img src="${o.imgFront}">
      </div>
      <div>${o.name}</div>
      <div>${o.newPrice} جنيه</div>
    </div>

    <div class="flip-back">
      <p>${o.backTitle}</p>
    </div>

  </div>
</div>`;
}

// =====================================================
//  RENDER
// =====================================================
function renderAll() {
  const pw = document.getElementById("products-wrap");
  const ow = document.getElementById("offers-wrap");

  if (pw) pw.innerHTML = PRODUCTS.map(buildProductCard).join("");
  if (ow) ow.innerHTML = OFFERS.map(buildOfferCard).join("");

  initFlipSystem(); // 🔥 مهم بعد بناء الكروت
}

// =====================================================
//  CART
// =====================================================
function addProduct(btn, id) {
  const card = btn.closest(".flip-card");
  const price = Number(card.dataset.price || 100);

  cart.push({ name: id, price, qty: 1 });
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =====================================================
//  INIT
// =====================================================
window.onload = function () {
  renderAll();
};
