/* =====================================================
   Godavari Originals – main.js (FINAL, SAFE, STABLE)
   Works with index.html, shop.html, cart.html
   ===================================================== */

/* ================= STORAGE ================= */

const STORAGE_KEY = "godavari_cart_v6";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  renderNavBadge();
}

/* ================= NAV BADGE ================= */

function renderNavBadge() {
  const cart = getCart();
  let count = 0;
  Object.values(cart).forEach(i => count += i.qty || 0);

  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
  });
}

/* ================= TOAST ================= */

function showToast(msg) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position:fixed;
      right:18px;
      bottom:18px;
      background:#2d7a16;
      color:#fff;
      padding:10px 14px;
      border-radius:10px;
      z-index:9999;
      opacity:0;
      transition:.25s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = 1;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.style.opacity = 0, 1500);
}

/* ================= CART ACTIONS ================= */

function addToCart(id, name, price) {
  const cart = getCart();
  cart[id] ? cart[id].qty++ : cart[id] = { id, name, price, qty: 1 };
  saveCart(cart);
  showToast(`${name} added to cart`);
}

function changeQty(id, delta) {
  const cart = getCart();
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  saveCart(cart);
  renderCartPage();
}

function removeFromCart(id) {
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
  renderCartPage();
}

/* ================= PRODUCT CARD UI ================= */

function syncCard(card) {
  const id = card.dataset.id;
  const qty = getCart()[id]?.qty || 0;

  const addBtn = card.querySelector(".add-btn");
  const qtyBox = card.querySelector(".qty-box");
  const qtyText = card.querySelector(".qty");

  if (!addBtn || !qtyBox || !qtyText) return;

  addBtn.classList.toggle("d-none", qty > 0);
  qtyBox.classList.toggle("d-none", qty === 0);
  qtyText.textContent = qty;
}

/* ================= CLICK HANDLER ================= */

document.addEventListener("click", e => {
  const action = e.target.closest(".cart-action");
  if (!action) return;

  const { id, name, price } = action.dataset;

  if (e.target.classList.contains("add-btn")) addToCart(id, name, +price);
  if (e.target.classList.contains("plus")) changeQty(id, 1);
  if (e.target.classList.contains("minus")) changeQty(id, -1);

  syncCard(action);
});

/* ================= CART PAGE ================= */

function renderCartPage() {
  const list = document.getElementById("cart-list");
  const totalEl = document.getElementById("cart-total");
  if (!list || !totalEl) return;

  const cart = getCart();
  list.innerHTML = "";
  let total = 0;

  if (!Object.keys(cart).length) {
    list.innerHTML = `<div class="p-4 bg-white rounded">
      Your cart is empty. <a href="shop.html">Shop now</a>
    </div>`;
    totalEl.textContent = "₹0";
    return;
  }

  Object.values(cart).forEach(item => {
    total += item.price * item.qty;
    list.innerHTML += `
      <div class="cart-item d-flex gap-3 align-items-center p-3 bg-white rounded">
        <img src="images/product-${item.id.slice(1)}.png" width="80">
        <div class="flex-grow-1">
          <strong>${item.name}</strong>
          <div class="fw-bold">₹${item.price * item.qty}</div>
          <div class="qty-box mt-2">
            <button onclick="changeQty('${item.id}',-1)">−</button>
            <span class="px-2">${item.qty}</span>
            <button onclick="changeQty('${item.id}',1)">+</button>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-danger"
          onclick="removeFromCart('${item.id}')">✕</button>
      </div>`;
  });

  totalEl.textContent = "₹" + total;
}

/* ================= ACTIVE NAV ================= */

function markActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navbar a[href]").forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === path);
  });
}

/* ================= LANGUAGE AUTO TOGGLE ================= */

(function languageToggle() {
  const en = document.querySelector(".lang-text.english");
  const te = document.querySelector(".lang-text.telugu");
  if (!en || !te) return;

  en.classList.add("active");
  setInterval(() => {
    en.classList.toggle("active");
    te.classList.toggle("active");
  }, 2500);
})();

/* ================= GPS AUTO-FILL ================= */

function autoFillFromGPS() {
  if (!navigator.geolocation) {
    alert("Location not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
      );
      const data = await res.json();
      const addr = data.address || {};

      const addressEl = document.getElementById("cust-address");
      const cityEl = document.getElementById("cust-city");
      const pinEl = document.getElementById("cust-pincode");

      if (addressEl)
        addressEl.value = `${addr.house_number || ""} ${addr.road || ""}`.trim();
      if (cityEl)
        cityEl.value = addr.city || addr.town || addr.village || "";
      if (pinEl)
        pinEl.value = addr.postcode || "";

    } catch {
      alert("Unable to fetch location");
    }
  }, () => alert("Location permission denied"));
}

/* ================= PINCODE AUTO-FILL ================= */

document.addEventListener("DOMContentLoaded", () => {
  const pinInput = document.getElementById("cust-pincode");
  if (!pinInput) return;

  pinInput.addEventListener("blur", () => {
    const pin = pinInput.value.trim();
    if (!/^[0-9]{6}$/.test(pin)) return;

    fetch(`https://api.postalpincode.in/pincode/${pin}`)
      .then(r => r.json())
      .then(d => {
        if (d[0].Status === "Success") {
          const cityEl = document.getElementById("cust-city");
          if (cityEl) cityEl.value = d[0].PostOffice[0].District;
        }
      });
  });
});

/* ================= WHATSAPP CHECKOUT ================= */

function checkoutWhatsAppWithDetails() {
  const name = document.getElementById("cust-name")?.value.trim();
  const phone = document.getElementById("cust-phone")?.value.trim();
  const address = document.getElementById("cust-address")?.value.trim();
  const city = document.getElementById("cust-city")?.value.trim();
  const pin = document.getElementById("cust-pincode")?.value.trim();

  if (!name || !phone || !address || !city || !pin) {
    alert("Please fill all details");
    return;
  }

  const cart = getCart();
  if (!Object.keys(cart).length) {
    alert("Cart is empty");
    return;
  }

  let total = 0;
  let msg = `Hello Godavari Originals 👋\n\n🛒 Order:\n`;

  Object.values(cart).forEach(i => {
    total += i.price * i.qty;
    msg += `• ${i.name} × ${i.qty} = ₹${i.price * i.qty}\n`;
  });

  msg += `\n📍 ${address}, ${city} - ${pin}\n💰 Total: ₹${total}`;

  window.open(
    `https://wa.me/919000554236?text=${encodeURIComponent(msg)}`,
    "_blank"
  );

  localStorage.removeItem(STORAGE_KEY);
  setTimeout(() => location.href = "thankyou.html", 1200);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".cart-action").forEach(syncCard);
  renderNavBadge();
  renderCartPage();
  markActiveNav();
});
