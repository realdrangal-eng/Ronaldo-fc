const PRODUCTS = [
  {
    id: "gta6",
    title: "Grand Theft Auto VI",
    edition: "Standard Edition",
    price: 14.99,
    badge: "New",
    art: "assets/gta6-cover.jpg",
    desc: "Return to Vice City in the next chapter of the Grand Theft Auto series — a sprawling sun-soaked open world built around Lucia and Jason.",
    platforms: "PS5 · Xbox Series X|S · PC"
  },
  {
    id: "gta5",
    title: "Grand Theft Auto V",
    edition: "Premium Online Edition",
    price: 9.99,
    badge: "Best seller",
    art: "assets/gta5-cover.jpg",
    desc: "The complete story mode plus GTA Online and the Criminal Enterprise Starter Pack. Los Santos, three protagonists, endless chaos.",
    platforms: "PS5 · Xbox Series X|S · PC"
  }
];

const money = n => "$" + n.toFixed(2);

/* ---------- Render store ---------- */
const grid = document.getElementById("grid");

grid.innerHTML = PRODUCTS.map(p => `
  <article class="card">
    <div class="card-art">
      <img src="${p.art}" alt="${p.title} cover art">
      <span class="badge">${p.badge}</span>
    </div>
    <div class="card-body">
      <h3>${p.title}</h3>
      <p class="edition">${p.edition}</p>
      <p class="desc">${p.desc}</p>
      <p class="platforms">${p.platforms}</p>
      <div class="price-row">
        <span class="price">${money(p.price)}</span>
        <button class="btn btn-primary" data-add="${p.id}">Add to cart</button>
      </div>
    </div>
  </article>
`).join("");

/* ---------- Cart state ---------- */
const STORAGE_KEY = "rockstar-shop-cart";

let cart = [];
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) cart = JSON.parse(saved);
} catch (e) {
  cart = [];
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    /* storage unavailable — cart stays in memory only */
  }
}

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const line = cart.find(l => l.id === id);
  if (line) line.qty++;
  else cart.push({ id, qty: 1 });

  save();
  render();
  toast(`${product.title} added to cart`);
}

function setQty(id, delta) {
  const line = cart.find(l => l.id === id);
  if (!line) return;

  line.qty += delta;
  if (line.qty < 1) cart = cart.filter(l => l.id !== id);

  save();
  render();
}

function removeFromCart(id) {
  cart = cart.filter(l => l.id !== id);
  save();
  render();
}

/* ---------- Render cart ---------- */
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

function render() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const total = cart.reduce((sum, l) => {
    const p = PRODUCTS.find(x => x.id === l.id);
    return sum + (p ? p.price * l.qty : 0);
  }, 0);

  cartCount.textContent = count;
  cartTotal.textContent = money(total);

  if (!cart.length) {
    cartItems.innerHTML = `<p class="empty">Your cart is empty.</p>`;
    return;
  }

  cartItems.innerHTML = cart.map(l => {
    const p = PRODUCTS.find(x => x.id === l.id);
    return `
      <div class="line">
        <img src="${p.art}" alt="">
        <div>
          <p class="line-title">${p.title}</p>
          <p class="line-price">${money(p.price)}</p>
          <div class="qty">
            <button data-qty="${p.id}" data-delta="-1" aria-label="Decrease quantity">&minus;</button>
            <span>${l.qty}</span>
            <button data-qty="${p.id}" data-delta="1" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="remove" data-remove="${p.id}">Remove</button>
      </div>
    `;
  }).join("");
}

/* ---------- Drawer ---------- */
const drawer = document.getElementById("cart");
const overlay = document.getElementById("overlay");

function openCart() { drawer.hidden = false; overlay.hidden = false; }
function closeCart() { drawer.hidden = true; overlay.hidden = true; }

document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeCart();
});

/* ---------- Delegated clicks ---------- */
document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  if (add) {
    addToCart(add.dataset.add);
    return;
  }

  const qty = e.target.closest("[data-qty]");
  if (qty) {
    setQty(qty.dataset.qty, Number(qty.dataset.delta));
    return;
  }

  const remove = e.target.closest("[data-remove]");
  if (remove) removeFromCart(remove.dataset.remove);
});

document.getElementById("checkout").addEventListener("click", () => {
  if (!cart.length) {
    toast("Your cart is empty");
    return;
  }
  const total = cart.reduce((sum, l) => {
    const p = PRODUCTS.find(x => x.id === l.id);
    return sum + p.price * l.qty;
  }, 0);
  toast(`Order placed — ${money(total)}. Thanks for shopping!`);
  cart = [];
  save();
  render();
  closeCart();
});

/* ---------- Toast ---------- */
const toastEl = document.getElementById("toast");
let toastTimer;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2400);
}

render();
