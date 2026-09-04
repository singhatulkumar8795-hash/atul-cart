const SUPABASE_URL = "https://beplguuxcxhhcxrlrlfu.supabase.co";
const SUPABASE_KEY = "sb_publishable_wi0GQuyS_Zx8UwHCBdFFSQ_PfHxbzTm";
const defaultProducts = [
  {id:1,name:"Noise ColorFit smartwatch",category:"Electronics",price:1499,old:2999,discount:"50% off",rating:"4.4",reviews:"1,240",emoji:"⌚",color:"#eaf4ff",tag:"Bestseller",stock:3,variants:["Black","Blue"],gallery:["⌚","⌚","⌚"]},
  {id:2,name:"Premium cotton t-shirt",category:"Fashion",price:499,old:999,discount:"50% off",rating:"4.3",reviews:"892",emoji:"👕",color:"#fff1e8",tag:"Top pick",stock:8,variants:["S","M","L","XL"],gallery:["👕","👕","👕"]},
  {id:3,name:"Fresh organic vegetables",category:"Grocery",price:299,old:399,discount:"25% off",rating:"4.7",reviews:"634",emoji:"🥦",color:"#e8f8ed",tag:"Fresh today",stock:12,gallery:["🥦","🥕","🥬"]},
  {id:4,name:"JBL wireless headphones",category:"Electronics",price:1999,old:3499,discount:"43% off",rating:"4.5",reviews:"2,108",emoji:"🎧",color:"#f0edff",tag:"Hot deal",stock:5,variants:["Black","White"],gallery:["🎧","🎧","🎧"]},
  {id:5,name:"Everyday running shoes",category:"Fashion",price:899,old:1799,discount:"50% off",rating:"4.2",reviews:"710",emoji:"👟",color:"#fff4d9",tag:"Trending"},
  {id:6,name:"Ceramic coffee mug set",category:"Home",price:599,old:999,discount:"40% off",rating:"4.6",reviews:"438",emoji:"☕",color:"#fcecf2",tag:"New"},
  {id:7,name:"Glow skincare essentials",category:"Beauty",price:749,old:1199,discount:"37% off",rating:"4.5",reviews:"521",emoji:"🧴",color:"#e9f7f7",tag:"Bestseller"},
  {id:8,name:"Smart LED desk lamp",category:"Home",price:899,old:1499,discount:"40% off",rating:"4.4",reviews:"315",emoji:"💡",color:"#fff6d8",tag:"Top pick"}
];
const storedProducts = JSON.parse(localStorage.getItem("atul-products") || "null");
const products = storedProducts || defaultProducts;
const state = {
  category:"All", search:"", cart:JSON.parse(localStorage.getItem("atul-cart") || "[]"),
  wishlist:JSON.parse(localStorage.getItem("atul-wishlist") || "[]"),
  user:JSON.parse(localStorage.getItem("atul-user") || "null"), profile:JSON.parse(localStorage.getItem("atul-profile") || "null"), wallet:Number(localStorage.getItem("atul-wallet") || 0), authMode:"login", sort:"popular", price:"all",
  orders:JSON.parse(localStorage.getItem("atul-orders") || "[]")
};
const $ = (selector) => document.querySelector(selector);
const grid = $("#product-grid"), emptyState = $("#empty-state"), toast = $("#toast"), cartDrawer = $("#cart-drawer"), overlay = $("#overlay");
const rupees = (value) => `₹${value.toLocaleString("en-IN")}`;
const save = () => { localStorage.setItem("atul-cart", JSON.stringify(state.cart)); localStorage.setItem("atul-orders", JSON.stringify(state.orders)); localStorage.setItem("atul-products", JSON.stringify(products)); localStorage.setItem("atul-wishlist", JSON.stringify(state.wishlist)); localStorage.setItem("atul-wallet", String(state.wallet)); if(state.profile)localStorage.setItem("atul-profile", JSON.stringify(state.profile)); };
async function loadProductsFromSupabase() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!response.ok) throw new Error(`Products request failed with ${response.status}`);
    const remoteProducts = await response.json();
    if (remoteProducts.length) {
      products.splice(0, products.length, ...remoteProducts.map((product) => ({
        ...product,
        old: product.old_price,
        reviews: Number(product.reviews).toLocaleString("en-IN")
      })));
      renderProducts();
    }
  } catch (error) {
    console.warn("Supabase products unavailable; using local catalogue.", error);
  }
}
async function saveOrderToSupabase(order, customer) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      id: order.uuid,
      customer_name: customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      pin: customer.pin,
      payment_method: customer.payment,
      total: order.total,
      status: order.status,
      items: order.cart
    })
  });
  if (!response.ok) throw new Error(`Order request failed with ${response.status}`);
}
function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2400)}
async function supabaseAuth(path, payload) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.error_description || "OTP request failed");
  return data;
}
function filteredProducts(){const list=products.filter((product)=>{const categoryMatch=state.category==="All"||product.category===state.category;const query=state.search.toLowerCase();const priceMatch=state.price==="all"||(state.price==="under500"&&product.price<500)||(state.price==="500to1000"&&product.price>=500&&product.price<=1000)||(state.price==="over1000"&&product.price>1000);return categoryMatch&&priceMatch&&(!query||`${product.name} ${product.category}`.toLowerCase().includes(query))});return list.sort((a,b)=>state.sort==="low"?a.price-b.price:state.sort==="high"?b.price-a.price:state.sort==="rating"?Number(b.rating)-Number(a.rating):Number(b.reviews.replace(",",""))-Number(a.reviews.replace(",","")))}
function renderProducts(){const visible=filteredProducts();grid.innerHTML=visible.map((product)=>{const saved=state.wishlist.includes(product.id);return `<article class="product-card" data-product="${product.id}"><div class="product-image" style="background:${product.color}"><span>${product.emoji}</span><label class="tag">${product.tag}</label><button class="wishlist ${saved?"saved":""}" data-wishlist="${product.id}" aria-label="${saved?"Remove":"Add"} ${product.name} ${saved?"from":"to"} wishlist">${saved?"♥":"♡"}</button></div><div class="product-info"><div class="product-category">${product.category}</div><div class="product-name">${product.name}</div><span class="rating">★ ${product.rating}</span><span class="reviews">(${product.reviews})</span><div class="price-row"><span class="price">${rupees(product.price)}</span><span class="old-price">${rupees(product.old)}</span><span class="discount">${product.discount}</span></div><button class="add-btn" data-add="${product.id}">Add to cart</button></div></article>`}).join("");emptyState.hidden=visible.length>0}
function updateAccount(){ $("#account-label").textContent=state.user?state.user.name.split(" ")[0]:"Login"; }
function updateCart(){const count=state.cart.reduce((sum,item)=>sum+item.quantity,0);$("#cart-count").textContent=count;$("#drawer-count").textContent=count;const total=state.cart.reduce((sum,item)=>sum+item.price*item.quantity,0);$("#cart-total").textContent=rupees(total);$("#checkout-total").textContent=rupees(total);$("#cart-items").innerHTML=state.cart.length?state.cart.map((item)=>`<div class="cart-row"><div class="cart-row-image" style="background:${item.color}">${item.emoji}</div><div class="cart-row-info"><strong>${item.name}</strong><small>${rupees(item.price)} each</small><div class="quantity"><button data-decrease="${item.id}">−</button><span>${item.quantity}</span><button data-increase="${item.id}">+</button></div></div><span class="cart-row-price">${rupees(item.price*item.quantity)}</span></div>`).join(""):'<div class="cart-empty">Your cart is waiting for good things ✨</div>';save()}
function openCart(){cartDrawer.classList.add("open");overlay.classList.add("show")}
function closeCart(){cartDrawer.classList.remove("open");overlay.classList.remove("show")}
function openModal(id){$(id).classList.add("open");$(id).setAttribute("aria-hidden","false")}
function closeModal(id){$(id).classList.remove("open");$(id).setAttribute("aria-hidden","true")}
function addToCart(id){const product=products.find((item)=>item.id===Number(id));const existing=state.cart.find((item)=>item.id===product.id);if(existing)existing.quantity+=1;else state.cart.push({...product,quantity:1});updateCart();showToast(`${product.name} added to your cart`)}
function renderDetail(product){const gallery=product.gallery||[product.emoji,product.emoji,product.emoji];$("#product-detail").innerHTML=`<div class="detail-layout"><div><div class="detail-image zoom-image" style="background:${product.color}"><span id="detail-emoji">${gallery[0]}</span></div><div class="gallery-thumbs">${gallery.map((image,index)=>`<button class="${index===0?"active":""}" data-gallery="${image}">${image}</button>`).join("")}</div></div><div class="detail-copy"><span class="product-category">${product.category}</span><h2>${product.name}</h2><span class="rating">★ ${product.rating}</span> <span class="reviews">${product.reviews} verified ratings</span><div class="detail-price">${rupees(product.price)} <del>${rupees(product.old)}</del> <b>${product.discount}</b></div><p class="stock-alert">Only ${product.stock||7} left in stock!</p>${product.variants?`<div class="variant-block"><strong>Select option</strong><div>${product.variants.map((v,i)=>`<button class="variant ${i===0?"active":""}">${v}</button>`).join("")}</div></div>`:""}<p>Quality checked by Atul Cart. Get fast delivery, secure packaging and easy 7-day returns on this product.</p><ul><li>Estimated delivery: <strong>${new Date(Date.now()+4*86400000).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</strong></li><li>7-day easy replacement</li><li>Cash on delivery available</li></ul><div class="detail-actions"><button class="primary-btn" data-detail-add="${product.id}">Add to cart <span>→</span></button><button class="secondary-btn" data-buy-now="${product.id}">Buy now</button></div><div class="review-box"><strong>Customer reviews</strong><p>★★★★★ “Great quality and fast delivery.” — Verified buyer</p><button class="text-btn" data-review="${product.id}">Write a review</button></div></div></div>`;openModal("#product-modal")}
function renderOrders(){const list=$("#orders-list");list.innerHTML=state.orders.length?state.orders.slice().reverse().map((order)=>`<div class="order-item"><div><strong>Order #${order.id}</strong><small>${order.date} · ${order.items} item(s)</small></div><b>${rupees(order.total)}</b><span class="order-status">${order.status}</span><div class="order-actions">${order.status==="Order Placed"?`<button data-cancel-order="${order.id}">Cancel</button>`:""}<button data-reorder="${order.id}">Re-order</button><button data-invoice="${order.id}">Invoice</button></div></div>`).join(""):'<div class="cart-empty">No orders yet. Your next great find is waiting.</div>'}
function renderAdmin(){const revenue=state.orders.reduce((sum,order)=>sum+order.total,0);$("#admin-stats").innerHTML=`<div><strong>${products.length}</strong><small>Products</small></div><div><strong>${state.orders.length}</strong><small>Orders</small></div><div><strong>${rupees(revenue)}</strong><small>Revenue</small></div>`;$("#admin-table").innerHTML=`<h3>Inventory</h3>${products.map((p)=>`<div class="admin-row"><span>${p.emoji} ${p.name}</span><b>${rupees(p.price)}</b><small>In stock</small></div>`).join("")}`}
$("#search-form").addEventListener("submit",(event)=>{event.preventDefault();state.search=$("#search-input").value.trim();renderProducts();$("#products").scrollIntoView({behavior:"smooth"})});
$("#search-input").addEventListener("input",(event)=>{state.search=event.target.value.trim();renderProducts()});
$("#sort-select").addEventListener("change",(event)=>{state.sort=event.target.value;renderProducts()});
document.querySelector(".filter-chips").addEventListener("click",(event)=>{const chip=event.target.closest("[data-price]");if(!chip)return;state.price=chip.dataset.price;document.querySelectorAll(".filter-chip").forEach((item)=>item.classList.toggle("active",item===chip));renderProducts()});
$(".categories").addEventListener("click",(event)=>{const button=event.target.closest("[data-category]");if(!button)return;state.category=button.dataset.category;document.querySelectorAll(".category-item").forEach((item)=>item.classList.toggle("active",item===button));renderProducts()});
grid.addEventListener("click",(event)=>{const wishlistButton=event.target.closest("[data-wishlist]");if(wishlistButton){event.stopPropagation();const id=Number(wishlistButton.dataset.wishlist),index=state.wishlist.indexOf(id);if(index===-1){state.wishlist.push(id);showToast("Added to your wishlist")}else{state.wishlist.splice(index,1);showToast("Removed from your wishlist")}save();renderProducts();return}const addButton=event.target.closest("[data-add]");if(addButton){event.stopPropagation();addToCart(addButton.dataset.add);return}const card=event.target.closest("[data-product]");if(card)renderDetail(products.find((item)=>item.id===Number(card.dataset.product)))});
$("#cart-items").addEventListener("click",(event)=>{const action=event.target.closest("[data-increase],[data-decrease]");if(!action)return;const id=Number(action.dataset.increase||action.dataset.decrease),item=state.cart.find((cartItem)=>cartItem.id===id);if(action.dataset.increase)item.quantity+=1;else if(item.quantity===1)state.cart=state.cart.filter((cartItem)=>cartItem.id!==id);else item.quantity-=1;updateCart()});
$("#cart-btn").addEventListener("click",openCart);$("#close-cart").addEventListener("click",closeCart);overlay.addEventListener("click",closeCart);
$("#shop-now").addEventListener("click",()=>$("#products").scrollIntoView({behavior:"smooth"}));
$("#view-all").addEventListener("click",()=>{state.category="All";state.search="";$("#search-input").value="";document.querySelectorAll(".category-item").forEach((item)=>item.classList.toggle("active",item.dataset.category==="All"));renderProducts()});
document.querySelectorAll(".promo-card button").forEach((button)=>button.addEventListener("click",()=>{state.category=button.dataset.category;document.querySelectorAll(".category-item").forEach((item)=>item.classList.toggle("active",item.dataset.category===state.category));renderProducts();$("#products").scrollIntoView({behavior:"smooth"})}));
$("#account-btn").addEventListener("click",()=>{if(state.user){const profile=state.profile||{name:state.user.name,phone:"",address:"",landmark:"",pin:""};Object.entries(profile).forEach(([key,value])=>{const field=$(`#profile-form [name="${key}"]`);if(field)field.value=value});$("#wallet-balance").textContent=rupees(state.wallet);openModal("#profile-modal")}else openModal("#auth-modal")});
$("#orders-btn").addEventListener("click",()=>{renderOrders();openModal("#orders-modal")});
$("#open-tracking").addEventListener("click",()=>{closeModal("#orders-modal");openModal("#tracking-modal")});
$("#admin-btn").addEventListener("click",()=>{renderAdmin();openModal("#admin-modal")});
$("#profile-form").addEventListener("submit",(event)=>{event.preventDefault();state.profile=Object.fromEntries(new FormData(event.target));state.user={...(state.user||{}),name:state.profile.name};localStorage.setItem("atul-user",JSON.stringify(state.user));updateAccount();save();showToast("Profile and address saved")});
$("#profile-orders").addEventListener("click",()=>{closeModal("#profile-modal");renderOrders();openModal("#orders-modal")});
$("#orders-list").addEventListener("click",(event)=>{const cancel=event.target.closest("[data-cancel-order]");const reorder=event.target.closest("[data-reorder]");const invoice=event.target.closest("[data-invoice]");if(cancel){const order=state.orders.find((item)=>item.id===cancel.dataset.cancelOrder);order.status="Cancelled";state.wallet+=Math.round(order.total*.02);save();renderOrders();showToast("Order cancelled; cashback added to wallet")}if(reorder){const order=state.orders.find((item)=>item.id===reorder.dataset.reorder);(order.cart||[]).forEach((item)=>addToCart(item.id));closeModal("#orders-modal");openCart()}if(invoice){const order=state.orders.find((item)=>item.id===invoice.dataset.invoice);const invoiceWindow=window.open("","_blank");if(invoiceWindow){invoiceWindow.document.write(`<h1>Atul Cart Invoice</h1><p>Order: ${order.id}</p><p>Date: ${order.date}</p><p>Total: ${rupees(order.total)}</p><p>Payment: Cash on delivery</p>`);invoiceWindow.print()}}});
$("#delivery-btn").addEventListener("click",()=>openModal("#location-modal"));
$("#location-form").addEventListener("submit",(event)=>{event.preventDefault();const pin=new FormData(event.target).get("pin");$("#delivery-label").textContent=pin;closeModal("#location-modal");showToast(`Delivery options updated for ${pin}`)});
$("#sell-btn").addEventListener("click",()=>showToast("Seller registration is coming soon"));
document.addEventListener("click",(event)=>{const close=event.target.closest("[data-close-modal]");if(close)closeModal(`#${close.dataset.closeModal}`);const gallery=event.target.closest("[data-gallery]");if(gallery){$("#detail-emoji").textContent=gallery.dataset.gallery;document.querySelectorAll(".gallery-thumbs button").forEach((item)=>item.classList.toggle("active",item===gallery))}const variant=event.target.closest(".variant");if(variant){document.querySelectorAll(".variant").forEach((item)=>item.classList.toggle("active",item===variant))}const detailAdd=event.target.closest("[data-detail-add]");if(detailAdd){addToCart(detailAdd.dataset.detailAdd);closeModal("#product-modal")}const buyNow=event.target.closest("[data-buy-now]");if(buyNow){addToCart(buyNow.dataset.buyNow);closeModal("#product-modal");openCart()}const review=event.target.closest("[data-review]");if(review)showToast("Review form is ready in the next update")});
document.querySelectorAll("[data-auth-tab]").forEach((tab)=>tab.addEventListener("click",()=>{state.authMode=tab.dataset.authTab;document.querySelectorAll("[data-auth-tab]").forEach((item)=>item.classList.toggle("active",item===tab));$("#auth-name").closest("label").style.display=state.authMode==="signup"?"block":"none";$("#auth-submit").innerHTML=state.authMode==="signup"?"Create account <span>→</span>":"Login securely <span>→</span>"}));
$("#auth-form").addEventListener("submit",async(event)=>{event.preventDefault();const email=$("#auth-email").value.trim();if(!email){showToast("Please enter a valid email");return}try{await supabaseAuth("otp",{email,options:{emailRedirectTo:window.location.href.split("#")[0]}});$("#auth-note").textContent=`Login link sent to ${email}`;showToast("Email check kijiye—login link bhej diya gaya")}catch(error){console.error(error);showToast(error.message||"Email login failed")}});
$("#checkout-btn").addEventListener("click",()=>{if(!state.cart.length){showToast("Your cart is empty");return}if(state.profile){const fields={name:state.profile.name,phone:state.profile.phone,address:state.profile.address,city:state.profile.city||"",pin:state.profile.pin};Object.entries(fields).forEach(([key,value])=>{const field=$(`#checkout-form [name="${key}"]`);if(field)field.value=value||""})}closeCart();openModal("#checkout-modal")});
$("#checkout-form").addEventListener("submit",async(event)=>{event.preventDefault();const form=new FormData(event.target),cart=[...state.cart],total=cart.reduce((sum,item)=>sum+item.price*item.quantity,0),customer={name:form.get("name"),phone:form.get("phone"),address:form.get("address"),city:form.get("city"),pin:form.get("pin"),payment:"cod"};const recentPhoneOrders=state.orders.filter((order)=>order.phone===customer.phone&&order.status!=="Cancelled").length;if(recentPhoneOrders>=3){showToast("This number needs a quick verification before another COD order.");return}const order={id:`AC${Date.now().toString().slice(-6)}`,uuid:crypto.randomUUID(),date:new Date().toLocaleDateString("en-IN"),items:cart.reduce((sum,item)=>sum+item.quantity,0),total,status:"Order Placed",phone:customer.phone,cart};try{await saveOrderToSupabase(order,customer);state.orders.push(order);state.cart=[];updateCart();event.target.reset();closeModal("#checkout-modal");showToast("COD order placed and saved successfully 🎉");renderOrders()}catch(error){console.error(error);showToast("Order save nahi hua. Please try again.")}});
$("#tracking-form").addEventListener("submit",(event)=>{event.preventDefault();const id=new FormData(event.target).get("order");$("#tracking-result").innerHTML=`<div class="tracking-result"><strong>Order ${id}</strong><div class="tracking-steps"><span class="done">✓ Confirmed</span><span class="done">✓ Packed</span><span>○ Shipped</span><span>○ Delivered</span></div></div>`});
$("#chat-toggle").addEventListener("click",()=>$("#chat-box").classList.toggle("open"));
document.querySelectorAll("[data-chat]").forEach((button)=>button.addEventListener("click",()=>{$("#chat-message").textContent={delivery:"Orders usually arrive in 3–5 business days.",returns:"You can request a return within 7 days.",order:"Open Orders above to view your order status."}[button.dataset.chat]}));
$("#theme-toggle").addEventListener("click",()=>{document.body.classList.toggle("dark-mode");localStorage.setItem("atul-theme",document.body.classList.contains("dark-mode")?"dark":"light")});
if(localStorage.getItem("atul-theme")==="dark")document.body.classList.add("dark-mode");
$("#voice-btn").addEventListener("click",()=>{const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechRecognition){showToast("Voice search is not supported in this browser");return}const recognition=new SpeechRecognition();recognition.lang="en-IN";recognition.onresult=(event)=>{$("#search-input").value=event.results[0][0].transcript;state.search=$("#search-input").value;renderProducts()};recognition.start();showToast("Listening for a product name…")});
document.querySelectorAll(".footer a").forEach((link)=>link.addEventListener("click",(event)=>{if(link.getAttribute("href")?.startsWith("#")){event.preventDefault();showToast("This page is coming soon")}}));
window.addEventListener("keydown",(event)=>{if(event.key==="Escape"){document.querySelectorAll(".modal-shell.open").forEach((modal)=>closeModal(`#${modal.id}`));closeCart()}});
async function restoreEmailSession(){const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));const accessToken=hash.get("access_token");if(!accessToken)return;const email=hash.get("user_metadata")||"";state.user={name:email||"Atul Cart customer",email,accessToken};localStorage.setItem("atul-user",JSON.stringify(state.user));updateAccount();window.history.replaceState({},document.title,window.location.pathname);showToast("Email login successful")}
renderProducts();updateCart();updateAccount();loadProductsFromSupabase();restoreEmailSession();
let flashSeconds=21600;setInterval(()=>{flashSeconds=Math.max(0,flashSeconds-1);const hours=String(Math.floor(flashSeconds/3600)).padStart(2,"0"),minutes=String(Math.floor((flashSeconds%3600)/60)).padStart(2,"0"),seconds=String(flashSeconds%60).padStart(2,"0");$("#flash-timer").textContent=`${hours}:${minutes}:${seconds}`},1000);
