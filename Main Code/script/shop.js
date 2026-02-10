// shop.js — client-side menu, cart, and checkout (DEMO)
// Depends on auth.js for current user info

const MENU_ITEMS = [
  { id: 'd1', name: 'Classic Mojito', category: 'Drinks', price: 12.00 },
  { id: 'd2', name: 'Passionfruit Martini', category: 'Drinks', price: 14.00 },
  { id: 'd3', name: 'House Red Wine (Glass)', category: 'Drinks', price: 9.00 },
  { id: 'f1', name: 'Truffle Fries', category: 'Food', price: 8.50 },
  { id: 'f2', name: 'Chicken Skewers (3)', category: 'Food', price: 10.00 },
  { id: 'f3', name: 'Cheese Platter', category: 'Food', price: 22.00 }
];

function _getCart() {
  try { return JSON.parse(localStorage.getItem('ncs_cart') || '[]'); } catch (e) { return []; }
}
function _saveCart(cart) { localStorage.setItem('ncs_cart', JSON.stringify(cart)); window.dispatchEvent(new Event('storage')); }

function addToCart(itemId, qty = 1, guest = null) {
  const item = MENU_ITEMS.find(i => i.id === itemId);
  if (!item) return false;
  const cart = _getCart();
  const existing = cart.find(c => c.item.id === itemId && c.guest === guest);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ item: item, qty: qty, guest: guest });
  }
  _saveCart(cart);
  renderCartBadge();
  return true;
}

function removeFromCart(index) {
  const cart = _getCart();
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  _saveCart(cart);
  renderCartModal();
  renderCartBadge();
}

function clearCart() { localStorage.removeItem('ncs_cart'); renderCartModal(); renderCartBadge(); }

function cartTotal(cart) {
  return cart.reduce((s, c) => s + (c.item.price * c.qty), 0);
}

function openOrderModal(guestName) {
  // show menu modal and set current guest
  const menuGuest = document.getElementById('menuGuest');
  if (menuGuest) menuGuest.textContent = guestName || 'Guest';
  const menuModal = document.getElementById('menuModal');
  if (menuModal) menuModal.classList.remove('hidden');
  renderMenuItems();
}

function closeMenuModal() {
  const menuModal = document.getElementById('menuModal');
  if (menuModal) menuModal.classList.add('hidden');
}

function renderMenuItems() {
  const container = document.getElementById('menuItems');
  if (!container) return;
  container.innerHTML = '';
  MENU_ITEMS.forEach(it => {
    const el = document.createElement('div');
    el.className = 'flex justify-between items-center p-3 rounded-lg bg-white/5 mb-2';
    el.innerHTML = `
      <div>
        <div class="font-medium">${it.name}</div>
        <div class="text-xs text-gray-400">${it.category}</div>
      </div>
      <div class="flex items-center gap-2">
        <div class="text-sm text-white">$${it.price.toFixed(2)}</div>
        <button data-item-id="${it.id}" class="addToCartBtn ml-2 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-sm">Add</button>
      </div>
    `;
    container.appendChild(el);
  });
  // wire add buttons
  container.querySelectorAll('.addToCartBtn').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-item-id');
      const guest = document.getElementById('menuGuest') ? document.getElementById('menuGuest').textContent : null;
      addToCart(id, 1, guest);
      // small feedback
      btn.textContent = 'Added';
      setTimeout(() => btn.textContent = 'Add', 700);
    });
  });
}

function openCartModal() {
  const cartModal = document.getElementById('cartModal');
  if (cartModal) cartModal.classList.remove('hidden');
  renderCartModal();
}
function closeCartModal() { const cartModal = document.getElementById('cartModal'); if (cartModal) cartModal.classList.add('hidden'); }

function renderCartModal() {
  const list = document.getElementById('cartList');
  const totalEl = document.getElementById('cartTotal');
  if (!list) return;
  const cart = _getCart();
  list.innerHTML = '';
  cart.forEach((c, idx) => {
    const row = document.createElement('div');
    row.className = 'flex justify-between items-center p-2 border-b border-white/5';
    row.innerHTML = `
      <div>
        <div class="font-medium">${c.item.name} <span class="text-xs text-gray-400">x${c.qty}</span></div>
        <div class="text-xs text-gray-400">${c.guest ? 'For: ' + c.guest : ''}</div>
      </div>
      <div class="flex items-center gap-2">
        <div class="text-sm">$${(c.item.price * c.qty).toFixed(2)}</div>
        <button class="text-xs text-red-400 removeBtn" data-idx="${idx}">Remove</button>
      </div>
    `;
    list.appendChild(row);
  });
  if (totalEl) totalEl.textContent = `$${cartTotal(cart).toFixed(2)}`;
  // wire remove
  list.querySelectorAll('.removeBtn').forEach(b => b.addEventListener('click', function () {
    const idx = Number(b.getAttribute('data-idx'));
    removeFromCart(idx);
  }));
}

function renderCartBadge() {
  const badge = document.getElementById('cartBadge');
  const cart = _getCart();
  const count = cart.reduce((s, c) => s + c.qty, 0);
  if (!badge) return;
  badge.textContent = count > 0 ? count : '';
}

function proceedToPayment() {
  // simulate payment: create order record and clear cart
  const cart = _getCart();
  if (!cart.length) { alert('Cart is empty'); return; }
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const order = {
    id: 'ORD-' + Date.now(),
    items: cart,
    total: cartTotal(cart),
    createdBy: user ? user.username : 'anonymous',
    createdByRole: user ? user.role : null,
    createdAt: new Date().toISOString()
  };
  const existing = JSON.parse(localStorage.getItem('ncs_orders') || '[]');
  existing.push(order);
  localStorage.setItem('ncs_orders', JSON.stringify(existing));
  // clear cart
  clearCart();
  closeCartModal();
  alert('Payment processed (demo). Order id: ' + order.id);
  // notify other parts
  window.dispatchEvent(new Event('ncs_order_created'));
}

// Management helper: compute weekly total, orders list
function getOrders() {
  try { return JSON.parse(localStorage.getItem('ncs_orders') || '[]'); } catch (e) { return []; }
}
function computeWeeklySales() {
  const orders = getOrders();
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const week = orders.filter(o => new Date(o.createdAt).getTime() >= oneWeekAgo);
  const total = week.reduce((s, o) => s + (o.total || 0), 0);
  return { count: week.length, total };
}

// Expose functions
window.shop = {
  MENU_ITEMS, addToCart, openOrderModal, openCartModal, renderCartBadge, proceedToPayment, getOrders, computeWeeklySales, renderMenuItems
};

// Init on load
document.addEventListener('DOMContentLoaded', function () {
  // wire global cart button if present
  const cartBtn = document.getElementById('cartButton');
  if (cartBtn) cartBtn.addEventListener('click', openCartModal);
  // wire proceed button
  const payBtn = document.getElementById('payBtn');
  if (payBtn) payBtn.addEventListener('click', proceedToPayment);
  // wire close menu
  const menuClose = document.getElementById('menuClose');
  if (menuClose) menuClose.addEventListener('click', closeMenuModal);
  renderCartBadge();
});
