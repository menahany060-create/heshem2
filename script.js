// ===== CONFIG =====
const API_BASE = "https://heshem2-production.up.railway.app/api";

// ===== EGYPTIAN CITIES =====
const egyptCities = {
  "القاهرة":       ["مدينة نصر","النزهة","المعادي","المقطم","حلوان","عين شمس","مصر الجديدة","الزيتون","شبرا","الأميرية","السلام","التجمع الأول","التجمع الخامس","الرحاب","مدينتي","وسط البلد","الدقي","الزمالك","إمبابة","بولاق","المطرية","المرج","الشروق","بدر","العبور"],
  "الجيزة":        ["الجيزة","الدقي","العجوزة","المهندسين","إمبابة","بولاق الدكرور","أكتوبر","الشيخ زايد","حدائق الأهرام","الهرم","البدرشين","الصف","أطفيح","أوسيم","كرداسة","العياط"],
  "الإسكندرية":   ["المنتزه","العجمي","برج العرب","العامرية","الدخيلة","المكس","اللبان","باب شرق","محرم بك","سيدي بشر","سيدي جابر","الرمل","وسط البلد","كليوباترا","فلمنج","ميامي","جليم","لوران"],
  "الدقهلية":     ["المنصورة","طلخا","دكرنس","ميت غمر","بلقاس","السنبلاوين","منية النصر","الجمالية","شربين","أجا","المنزلة","تمي الأمديد","نبروه"],
  "البحر الأحمر": ["الغردقة","سفاجا","القصير","رأس غارب","مرسى علم"],
  "البحيرة":      ["دمنهور","إيتاي البارود","أبو حمص","الدلنجات","رشيد","كفر الدوار","المحمودية","الرحمانية","حوش عيسى","شبراخيت","وادي النطرون"],
  "الفيوم":       ["الفيوم","إطسا","سنورس","يوسف الصديق","طامية","أبشواي"],
  "الغربية":      ["طنطا","كفر الزيات","زفتى","السنطة","قطور","بسيون","المحلة الكبرى"],
  "الإسماعيلية":  ["الإسماعيلية","فايد","القصاصين","التل الكبير","أبو صوير","القنطرة"],
  "المنوفية":     ["شبين الكوم","مينوف","أشمون","الباجور","قويسنا","بركة السبع","تلا","الشهداء"],
  "المنيا":       ["المنيا","ملوي","سمالوط","مغاغة","بني مزار","أبو قرقاص","ديرمواس"],
  "القليوبية":    ["بنها","قليوب","شبين القناطر","القناطر الخيرية","طوخ","الخانكة","كفر شكر","الخصوص","أبو زعبل"],
  "الوادي الجديد":["الخارجة","الداخلة","الفرافرة","بريس"],
  "السويس":       ["السويس","عتاقة","الجناين","فيصل","حي الأربعين"],
  "اسوان":        ["أسوان","كوم أمبو","إدفو","نصر النوبة","دراو","أبو سمبل"],
  "اسيوط":        ["أسيوط","ديروط","القوصية","منفلوط","أبنوب","أبو تيج"],
  "بني سويف":     ["بني سويف","الفشن","ببا","إهناسيا","ناصر","سمسطا"],
  "بورسعيد":      ["بورسعيد","بور فؤاد","الزهور","الضواحي","الشرق","المناخ","العرب"],
  "دمياط":        ["دمياط","رأس البر","الزرقا","فارسكور","كفر سعد","عزبة البرج"],
  "جنوب سيناء":   ["الطور","شرم الشيخ","دهب","نويبع","طابا","سانت كاترين","أبو رديس"],
  "شمال سيناء":   ["العريش","رفح","الشيخ زويد","بئر العبد","الحسنة","نخل"],
  "سوهاج":        ["سوهاج","أخميم","جرجا","طما","طهطا","دار السلام","المراغة","البلينا"],
  "قنا":          ["قنا","نجع حمادي","قوص","دشنا","أبو تشت","فرشوط","الوقف","نقادة"],
  "كفر الشيخ":    ["كفر الشيخ","دسوق","فوه","قلين","سيدي سالم","بيلا","الحامول","مطوبس"],
  "مطروح":        ["مرسى مطروح","الحمام","العلمين","الضبعة","سيدي براني","سلوم"],
  "الأقصر":       ["الأقصر","إسنا","أرمنت","الطود","البياضية","القرنة"],
  "الشرقية":      ["الزقازيق","العاشر من رمضان","بلبيس","منيا القمح","ديرب نجم","فاقوس","أبو حماد","الصالحية الجديدة","القنايات","أبو كبير","كفر صقر","ههيا"]
};

function updateCities() {
  const gov    = document.getElementById("governorate").value;
  const cityEl = document.getElementById("city");
  cityEl.innerHTML = '<option value="">اختار المدينة / المركز *</option>';
  if (gov && egyptCities[gov]) {
    egyptCities[gov].forEach(c => { cityEl.innerHTML += `<option value="${c}">${c}</option>`; });
  }
}

// ===== CART =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let appliedPromo = null;

async function loadProducts() {
  try {
    const res  = await fetch(API_BASE + "/products");
    const json = await res.json();
    if (json.success) renderProducts(json.data);
  } catch {}
}

function renderProducts(products) {
  const container = document.querySelector(".products");
  if (!container || !products || products.length === 0) return;
  container.innerHTML = "";
  products.forEach((p, idx) => {
    const opts = p.sizes.map(s => `<option value="${s.weight.replace(" جرام","")}-${s.price}">${s.weight} — ${s.price} جنيه</option>`).join("");
    const cls  = p.caffeine < 60 ? "low" : p.caffeine < 80 ? "medium" : p.caffeine < 95 ? "high" : "extreme";
    const sold = p.status === "sold-out" ? `<div class="sold-out-banner"><span class="sold-out-icon">🚫</span><span>نفذ من المخزن</span></div>` : "";
    const add  = p.status !== "sold-out" ? `<button class="neonBtn add-btn buy-main-btn" onclick="addProduct(this,'${p.name}')">🛒 إضافة للسلة</button>` : "";
    container.innerHTML += `<div class="card-wrapper" id="product-${p.name}" data-status="${p.status}" data-index="${idx+1}"><div class="card-inner"><div class="card-face card-front"><div class="card-bg-blur" style="background-image:url('${p.image}')"></div><span class="prod-badge badge-fire">${p.badge}</span><img src="${p.image}" onerror="this.src='';this.parentElement.querySelector('.img-fallback').style.display='flex'"><div class="img-fallback">☕</div><div class="product-viewers"><span class="eye-icon">👁</span><span class="viewers-count" data-min="80" data-max="220">--</span> يتفرج دلوقتي</div><div class="star-rating" data-rating="${p.rating}"><span class="stars">★★★★★</span><span class="rating-num">${p.rating}</span></div><h3>توليفة ${p.name}</h3><div class="bar"><div class="fill ${cls}" data-caffeine="${p.caffeine}"><span class="percent">0%</span></div></div><small>كافيين ${p.caffeine}%</small><select onchange="updatePrice(this)">${opts}</select>${sold}${add}<button class="flip-btn" onclick="flipCard(this)">↩ اقلب الكارد</button></div><div class="card-face card-back"><div class="card-bg-blur" style="background-image:url('${p.image}')"></div><img class="back-img" src="${p.image}" onerror="this.style.display='none'"><div class="back-product-name">توليفة ${p.name} ☕</div><select onchange="updatePrice(this)">${opts}</select>${add}<div class="back-btns"><button class="neonBtn back-story-btn" onclick="openStory('${p.name}','${p.story}')">❓ ليه تشرب توليفة ${p.name}؟</button><button class="neonBtn specs-btn" onclick="openSpecs('${p.specs}','')">📋 المواصفات</button><button class="share-btn" onclick="shareProduct('توليفة ${p.name}',${p.sizes[0]?.price||0})">↗ مشاركة</button><button class="flip-btn" onclick="flipCard(this)">↩ ارجع للوش</button></div></div></div></div>`;
  });
  initAfterRender();
}

function initAfterRender() {
  renderStarRatings(); initViewers();
  document.querySelectorAll(".fill").forEach(bar => {
    const v=Number(bar.getAttribute("data-caffeine")),p=bar.querySelector(".percent");
    if(v<60)bar.classList.add("low");else if(v<80)bar.classList.add("medium");else if(v<95)bar.classList.add("high");else bar.classList.add("extreme");
    setTimeout(()=>{bar.style.width=v+"%";},400);
    let c=0;const iv=setInterval(()=>{if(c>=v){clearInterval(iv);return;}c++;if(p)p.innerText=c+"%";},15);
  });
  document.querySelectorAll(".card-wrapper").forEach(w=>{
    if(w.dataset.status!=="sold-out")return;
    w.querySelectorAll(".add-btn").forEach(b=>{b.disabled=true;b.style.display="none";});
    w.querySelectorAll("select").forEach(s=>s.disabled=true);
  });
}

function addProduct(btn, name) {
  const w=btn.closest(".card-wrapper");
  if(w.dataset.status==="sold-out"){showToast("❌ المنتج ده نفذ!");return;}
  const parts=w.querySelector("select").value.split("-");
  add(name+" ("+parts[0]+"g)",Number(parts[1]));
}
function addOffer(btn,name,price){add(name,price);}
function updatePrice(){}
function add(name,price){
  let item=cart.find(i=>i.name===name);
  if(item)item.qty++;else cart.push({name,price,qty:1});
  render();showToast("✅ "+name+" اتضافت للسلة!");
}
function changeQty(i,v){cart[i].qty+=v;if(cart[i].qty<=0)cart.splice(i,1);render();}

function render(){
  const box=document.getElementById("box"),totalEl=document.getElementById("total"),emptyMsg=document.getElementById("empty-cart-msg");
  if(!box||!totalEl)return;
  box.innerHTML="";let rawTotal=0;
  cart.forEach((c,i)=>{
    rawTotal+=c.price*c.qty;
    box.innerHTML+=`<div class="item"><div class="left">${c.name}</div><div class="right">${c.price*c.qty} جنيه</div><div class="qty"><button onclick="changeQty(${i},1)">+</button><span>${c.qty}</span><button onclick="changeQty(${i},-1)">−</button></div></div>`;
  });
  if(emptyMsg)emptyMsg.style.display=cart.length===0?"block":"none";
  let finalTotal=rawTotal;
  const dl=document.getElementById("discountLine");
  if(appliedPromo&&rawTotal>0){
    const da=Math.round(rawTotal*appliedPromo.discount/100);finalTotal=rawTotal-da;
    if(dl){dl.style.display="block";dl.innerText="🎟️ خصم "+appliedPromo.discount+"%: -"+da+" جنيه | الإجمالي: "+finalTotal+" جنيه";}
  }else{if(dl)dl.style.display="none";}
  totalEl.innerText=finalTotal+" جنيه";
  document.getElementById("cartCount").innerText=cart.reduce((s,i)=>s+i.qty,0);
  localStorage.setItem("cart",JSON.stringify(cart));
}

function flipCard(btn){btn.closest(".card-wrapper").querySelector(".card-inner").classList.toggle("flipped");}
function flipOfferCard(btn){btn.closest(".offer-card-wrapper").querySelector(".offer-card-inner").classList.toggle("flipped");}
function openStory(t,x){document.getElementById("title").innerText=t;document.getElementById("text").innerText=x;document.getElementById("popup").classList.add("active");}
function openSpecs(r,t){document.getElementById("title").innerText="📋 المواصفات";document.getElementById("text").innerText=r+(t?"\n"+t:"");document.getElementById("popup").classList.add("active");}
function openCheckout(){if(cart.length===0){showToast("🛒 السلة فارغة!");return;}document.getElementById("checkout").classList.add("active");}
function closePopup(){document.querySelectorAll(".popup").forEach(p=>p.classList.remove("active"));}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePopup();});

async function send(){
  const name=document.getElementById("name").value.trim();
  const phone=document.getElementById("phone").value.trim();
  const gov=document.getElementById("governorate").value;
  const city=document.getElementById("city").value;
  const address=document.getElementById("address").value.trim();

  if(!name){showToast("⚠️ ادخل اسمك");document.getElementById("name").focus();return;}
  if(!phone){showToast("⚠️ ادخل رقم الهاتف");document.getElementById("phone").focus();return;}
  if(!/^[0-9+\s\-]{7,15}$/.test(phone)){showToast("⚠️ رقم الهاتف مش صح");document.getElementById("phone").focus();return;}
  if(!gov){showToast("⚠️ اختار المحافظة");document.getElementById("governorate").focus();return;}
  if(!city){showToast("⚠️ اختار المدينة");document.getElementById("city").focus();return;}
  if(!address){showToast("⚠️ ادخل العنوان بالتفصيل");document.getElementById("address").focus();return;}
  if(cart.length===0){showToast("🛒 السلة فارغة!");return;}

  const btn=document.querySelector("#checkout .checkoutBtn");
  if(btn){btn.disabled=true;btn.innerText="⏳ جاري الإرسال...";}

  try{
    const res=await fetch(API_BASE+"/orders",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({customerName:name,customerPhone:phone,customerAddress:gov+" — "+city+" — "+address,items:cart,promoCode:appliedPromo?.code||null})
    });
    const data=await res.json();
    if(!data.success){showToast("❌ "+data.error);if(btn){btn.disabled=false;btn.innerText="✅ تأكيد الطلب";}return;}

    cart=[];appliedPromo=null;localStorage.removeItem("cart");
    document.getElementById("name").value="";
    document.getElementById("phone").value="";
    document.getElementById("governorate").value="";
    document.getElementById("city").innerHTML='<option value="">اختار المدينة / المركز *</option>';
    document.getElementById("address").value="";
    const pi=document.getElementById("promoCode"),pm=document.getElementById("promoMsg");
    if(pi)pi.value="";if(pm)pm.innerText="";
    render();closePopup();
    showToast("✅ تم استلام طلبك! هنتواصل معاك قريباً 🎉");
  }catch{
    showToast("❌ فشل الاتصال، جرب تاني");
    if(btn){btn.disabled=false;btn.innerText="✅ تأكيد الطلب";}
  }
}

function openCart(){document.querySelector(".cart")?.scrollIntoView({behavior:"smooth",block:"center"});}
function toggleShareHub(){document.getElementById("floatingShareHub").classList.toggle("open");}
document.addEventListener("click",e=>{const h=document.getElementById("floatingShareHub");if(h&&!h.contains(e.target))h.classList.remove("open");});
function toggleMenu(){document.getElementById("navMenu").classList.toggle("open");document.getElementById("menuBtn").classList.toggle("open");}
function closeMenu(){document.getElementById("navMenu").classList.remove("open");document.getElementById("menuBtn").classList.remove("open");}
document.addEventListener("click",e=>{const m=document.getElementById("navMenu"),b=document.getElementById("menuBtn");if(m&&b&&!m.contains(e.target)&&!b.contains(e.target))closeMenu();});

async function applyPromo(){
  const code=document.getElementById("promoCode").value.trim(),msgEl=document.getElementById("promoMsg");
  if(!code){msgEl.style.color="#E8855A";msgEl.innerText="⚠️ ادخل الكود";return;}
  try{
    const res=await fetch(API_BASE+"/promo/validate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});
    const data=await res.json();
    if(data.valid){appliedPromo={code:data.code,discount:data.discount};msgEl.style.color="#7BC67E";msgEl.innerText="✅ خصم "+data.discount+"%!";render();}
    else{appliedPromo=null;msgEl.style.color="#E8855A";msgEl.innerText="❌ "+(data.error||"الكود غير صحيح");render();}
  }catch{
    const local={"DRDS10":10,"HESHEM5":5,"DEVS7":7},up=code.toUpperCase();
    if(local[up]){appliedPromo={code:up,discount:local[up]};msgEl.style.color="#7BC67E";msgEl.innerText="✅ خصم "+local[up]+"%!";render();}
    else{msgEl.style.color="#E8855A";msgEl.innerText="❌ الكود غير صحيح";}
  }
}

function shareProduct(name,price){
  const text="☕ "+name+" — بن الحشم\nسعر: "+price+" جنيه!\n"+window.location.href;
  if(navigator.share)navigator.share({title:"بن الحشم",text,url:window.location.href}).catch(()=>{});
  else navigator.clipboard.writeText(text).then(()=>showToast("📋 تم نسخ الرابط!")).catch(()=>{});
}

function scrollToProduct(name){
  const t=document.getElementById("product-"+name);
  if(t){t.scrollIntoView({behavior:"smooth",block:"center"});const i=t.querySelector(".card-front");if(i){i.style.boxShadow="0 0 40px rgba(201,150,42,0.5)";i.style.borderColor="#C9962A";setTimeout(()=>{i.style.boxShadow="";i.style.borderColor="";},1600);}}
}

function startOfferTimer(){
  let end=Number(localStorage.getItem("offerTimerEnd"))||0;
  if(end<Date.now()){end=Date.now()+86400000;localStorage.setItem("offerTimerEnd",end);}
  function tick(){
    let diff=end-Date.now();
    if(diff<=0){end=Date.now()+86400000;localStorage.setItem("offerTimerEnd",end);diff=end-Date.now();}
    const hEl=document.getElementById("timer-h"),mEl=document.getElementById("timer-m"),sEl=document.getElementById("timer-s");
    if(hEl)hEl.innerText=String(Math.floor(diff/3600000)).padStart(2,"0");
    if(mEl)mEl.innerText=String(Math.floor((diff%3600000)/60000)).padStart(2,"0");
    if(sEl)sEl.innerText=String(Math.floor((diff%60000)/1000)).padStart(2,"0");
  }
  tick();setInterval(tick,1000);
}

let viewerState={};
function initViewers(){
  document.querySelectorAll(".viewers-count").forEach((el,idx)=>{
    const min=parseInt(el.dataset.min)||50,max=parseInt(el.dataset.max)||200;
    const base=Math.floor(min+Math.random()*(max-min));
    viewerState[idx]={el,current:base,min,max,nextUpdate:Date.now()+(20+Math.random()*40)*1000,trendBias:Math.random()>0.4?1:-1};
    el.innerText=base;
  });
}
function updateViewers(){
  const now=Date.now();
  Object.values(viewerState).forEach(s=>{
    if(now<s.nextUpdate)return;
    let dir=Math.random()<0.6?s.trendBias:-s.trendBias;
    if(Math.random()<0.15)s.trendBias=-s.trendBias;
    let v=s.current+dir*Math.ceil(Math.random()*4);
    if(v>s.max){v=s.max-Math.floor(Math.random()*5);s.trendBias=-1;}
    if(v<s.min){v=s.min+Math.floor(Math.random()*5);s.trendBias=1;}
    s.current=v;s.el.innerText=v;s.nextUpdate=now+(15+Math.random()*35)*1000;
  });
}

function renderStarRatings(){
  document.querySelectorAll(".star-rating").forEach(el=>{
    const r=parseFloat(el.dataset.rating)||4.5,s=el.querySelector(".stars");if(!s)return;
    const full=Math.floor(r),half=(r-full)>=0.5?1:0,empty=5-full-half;
    let h="";
    for(let i=0;i<full;i++)h+='<span style="color:#F5C842">★</span>';
    if(half)h+='<span style="color:#F5C842;opacity:0.6">★</span>';
    for(let i=0;i<empty;i++)h+='<span style="color:rgba(245,200,66,0.2)">★</span>';
    s.innerHTML=h;
  });
}

function showToast(msg){
  document.querySelector(".toast-msg")?.remove();
  const t=document.createElement("div");t.className="toast-msg";t.innerText=msg;
  Object.assign(t.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%) scale(0.9)",background:"#C9962A",color:"#1C0A00",padding:"14px 24px",borderRadius:"12px",fontWeight:"800",fontSize:"15px",boxShadow:"0 8px 30px rgba(201,150,42,0.4)",zIndex:"999999",opacity:"0",transition:"opacity 0.25s, transform 0.25s",fontFamily:"'Tajawal',sans-serif",textAlign:"center",maxWidth:"300px",lineHeight:"1.5",pointerEvents:"none"});
  document.body.appendChild(t);
  requestAnimationFrame(()=>{t.style.opacity="1";t.style.transform="translate(-50%,-50%) scale(1)";});
  setTimeout(()=>{t.style.opacity="0";t.style.transform="translate(-50%,-50%) scale(0.9)";setTimeout(()=>t.remove(),300);},2500);
}

window.onload=async function(){
  render();
  await loadProducts();
  document.querySelectorAll(".fill").forEach(bar=>{
    const v=Number(bar.getAttribute("data-caffeine")),p=bar.querySelector(".percent");
    if(v<60)bar.classList.add("low");else if(v<80)bar.classList.add("medium");else if(v<95)bar.classList.add("high");else bar.classList.add("extreme");
    setTimeout(()=>{bar.style.width=v+"%";},400);
    let c=0;const iv=setInterval(()=>{if(c>=v){clearInterval(iv);return;}c++;if(p)p.innerText=c+"%";},15);
  });
  document.querySelectorAll(".card-wrapper").forEach(w=>{
    if(w.dataset.status!=="sold-out")return;
    w.querySelectorAll(".add-btn").forEach(b=>{b.disabled=true;b.style.display="none";});
    w.querySelectorAll("select").forEach(s=>s.disabled=true);
    if(!w.querySelector(".sold-out-banner")){const b=document.createElement("div");b.className="sold-out-banner";b.innerHTML='<span class="sold-out-icon">🚫</span><span>نفذ من المخزن</span>';const s=w.querySelector("select");if(s)s.after(b);}
  });
  renderStarRatings();initViewers();setInterval(updateViewers,3000);startOfferTimer();
};
