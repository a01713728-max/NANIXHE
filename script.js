// ── MENÚ HAMBURGUESA (móvil) ──
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
});

// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); }
  });
}, { threshold: 0.12 });
reveals.forEach(r => observer.observe(r));

// ── BÚSQUEDA Y FILTROS ──
function filterMenu() {
  const input = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.menu-item').forEach(item => {
    const name = item.dataset.name.toLowerCase();
    item.style.display = name.includes(input) ? '' : 'none';
  });
}

function filterCategory(cat) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  document.querySelectorAll('.menu-cat').forEach(section => {
    if (cat === 'all' || section.dataset.category === cat) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
}

// ── LÓGICA DEL CARRITO ──
let cart = [];
const costEnvio = 35;

function toggleCart() {
  document.getElementById('cartDrawer').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
  renderCart();
}

function addToCart(id) {
  const itemEl = document.querySelector(`.menu-item[data-id="${id}"]`);
  const name = itemEl.dataset.name;
  const price = parseFloat(itemEl.dataset.price);

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  
  showToast(`<i class="ph ph-check-circle"></i> ${name} agregado al carrito`);
  renderCart();
  
  const btn = document.querySelector('.cart-floating-btn');
  btn.style.transform = 'scale(1.15) translateY(-6px)';
  setTimeout(() => btn.style.transform = '', 250);
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

function emptyCart() {
  cart = [];
  renderCart();
}

function updateShipping() {
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  const badge = document.getElementById('cart-count-badge');
  const checkoutForm = document.getElementById('checkoutForm');
  const btnCheckout = document.getElementById('btnCheckout');
  const status = document.getElementById('cartStatus');
  
  container.innerHTML = '';
  
  let totalItems = 0;
  let subtotal = 0;

  if (cart.length === 0) {
    status.innerHTML = `<i class="ph ph-shopping-cart"></i> Tu carrito está vacío`;
    status.style.background = "var(--arena)";
    checkoutForm.style.display = 'none';
    btnCheckout.disabled = true;
    document.getElementById('cartSubtotal').innerText = "$0.00";
    document.getElementById('cartTotal').innerText = "$0.00";
    document.getElementById('shippingRow').style.display = 'none';
    badge.innerText = "0";
    return;
  }

  status.innerHTML = `<i class="ph ph-check-circle"></i> Pedido en proceso`;
  status.style.background = "#E6EFE9"; // Verde sutil acorde a la paleta
  checkoutForm.style.display = 'flex';
  btnCheckout.disabled = false;

  cart.forEach(item => {
    totalItems += item.qty;
    subtotal += (item.price * item.qty);
    
    container.innerHTML += `
      <div class="cart-item">
        <div class="item-info">
          <h4>${item.name}</h4>
          <p>$${item.price} x ${item.qty}</p>
        </div>
        <div class="item-controls">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)"><i class="ph ph-minus"></i></button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)"><i class="ph ph-plus"></i></button>
          <button class="remove-btn" onclick="removeItem(${item.id})"><i class="ph ph-trash"></i></button>
        </div>
      </div>
    `;
  });

  badge.innerText = totalItems;
  document.getElementById('cartSubtotal').innerText = `$${subtotal.toFixed(2)}`;

  const method = document.getElementById('deliveryMethod').value;
  const shippingRow = document.getElementById('shippingRow');
  const addressGroup = document.getElementById('addressGroup');
  
  let total = subtotal;
  if (method === 'delivery') {
    shippingRow.style.display = 'flex';
    addressGroup.style.display = 'block';
    total += costEnvio;
  } else {
    shippingRow.style.display = 'none';
    addressGroup.style.display = 'none';
  }

  document.getElementById('cartTotal').innerText = `$${total.toFixed(2)}`;
}

// ── FLUJO WHATSAPP Y MODAL ──
function openConfirmModal() {
  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const method = document.getElementById('deliveryMethod').value;
  const address = document.getElementById('clientAddress').value.trim();
  
  if (!name || !phone) {
    showToast(`<i class="ph ph-warning-circle"></i> Por favor ingresa tu nombre y teléfono.`);
    return;
  }
  if (method === 'delivery' && !address) {
    showToast(`<i class="ph ph-warning-circle"></i> Por favor ingresa tu dirección para el envío.`);
    return;
  }

  const subtotal = cart.reduce((acc, el) => acc + (el.price * el.qty), 0);
  const total = method === 'delivery' ? subtotal + costEnvio : subtotal;
  const payMethod = document.getElementById('paymentMethod').options[document.getElementById('paymentMethod').selectedIndex].text;

  let text = `*NUEVO PEDIDO - Nanixthe*\n\n`;
  text += `*Cliente:* ${name}\n*Tel:* ${phone}\n`;
  text += `*Entrega:* ${method === 'delivery' ? 'A domicilio' : 'Recoger en local'}\n`;
  if (method === 'delivery') text += `*Dirección:* ${address}\n*Ref:* ${document.getElementById('clientRef').value}\n`;
  
  text += `\n*Detalle del pedido:*\n`;
  cart.forEach(item => {
    text += `• ${item.qty}x ${item.name} - $${item.price * item.qty}\n`;
  });
  
  text += `\n*Subtotal:* $${subtotal}`;
  if (method === 'delivery') text += `\n*Envío:* $${costEnvio}`;
  text += `\n*TOTAL:* $${total}\n`;
  text += `\n*Pago:* ${payMethod}\n`;

  document.getElementById('modalSummaryText').innerText = text;
  document.getElementById('confirmModal').classList.add('open');
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('open');
}

function sendOrderWhatsApp() {
  const text = document.getElementById('modalSummaryText').innerText;
  const finalMessage = text + "\n\n_Hola, envío el detalle de mi pedido. Quedo en espera de confirmación._";
  
  const encodedText = encodeURIComponent(finalMessage);
  window.open(`https://wa.me/5215624718830?text=${encodedText}`, '_blank');
  
  closeConfirmModal();
  toggleCart();
  emptyCart();
  showToast(`<i class="ph ph-whatsapp-logo"></i> Redirigiendo a WhatsApp...`);
}

// ── UTILIDADES ──
function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`<i class="ph ph-copy"></i> Copiado al portapapeles`);
  });
}

function showToast(msgHTML) {
  const toast = document.getElementById('toast');
  toast.innerHTML = msgHTML;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}