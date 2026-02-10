// orders.js — render and manage orders for staff (depends on auth.js + shop.js)

function renderOrders() {
  const container = document.getElementById('ordersList');
  if (!container) return;
  const orders = JSON.parse(localStorage.getItem('ncs_orders') || '[]');
  container.innerHTML = '';
  if (!orders.length) {
    container.innerHTML = '<div class="text-sm text-gray-400">No orders yet.</div>';
    return;
  }

  // show newest first
  orders.slice().reverse().forEach(order => {
    const el = document.createElement('div');
    el.className = 'p-4 rounded-lg bg-white/5 flex justify-between items-start';
    const itemsHtml = order.items.map(it => `<div class="text-sm">${it.item.name} <span class="text-xs text-gray-400">x${it.qty}</span></div>`).join('');
    el.innerHTML = `
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <div class="text-sm text-gray-400">${order.id}</div>
          <div class="font-medium">${order.items.length} items</div>
          <div class="text-xs text-gray-400">${order.createdBy || ''}</div>
          <div class="ml-3 px-2 py-1 text-xs rounded ${order.paid ? 'bg-green-700' : (order.served ? 'bg-blue-700' : 'bg-yellow-700')}">${order.paid ? 'PAID' : (order.served ? 'SERVED' : 'PENDING')}</div>
        </div>
        <div class="mt-2 text-sm text-gray-300">${order.items.length} line(s)</div>
        <div class="mt-2 text-xs text-gray-400">Seat: ${order.seat || '-'}</div>
        <div class="mt-2 text-sm text-gray-200">${itemsHtml}</div>
      </div>
      <div class="flex flex-col gap-2 ml-4">
        <div class="text-lg font-bold">$${(order.total || 0).toFixed(2)}</div>
        <div class="flex flex-col">
          <button class="serveBtn px-3 py-1 rounded bg-white/5">Mark Served</button>
          <button class="payBtn px-3 py-1 rounded bg-green-600 text-white mt-1">Proceed to Pay</button>
        </div>
      </div>
    `;

    // wire actions
    el.querySelector('.serveBtn').addEventListener('click', function () {
      toggleServe(order.id);
    });
    el.querySelector('.payBtn').addEventListener('click', function () {
      // go to payment page
      location.href = `payment.html?orderId=${encodeURIComponent(order.id)}`;
    });

    container.appendChild(el);
  });
}

function toggleServe(orderId) {
  const orders = JSON.parse(localStorage.getItem('ncs_orders') || '[]');
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return;
  orders[idx].served = !orders[idx].served;
  localStorage.setItem('ncs_orders', JSON.stringify(orders));
  renderOrders();
}

// Create order form
function renderCreateItems() {
  const container = document.getElementById('createItems');
  if (!container) return;
  container.innerHTML = '';
  (window.shop && shop.MENU_ITEMS ? shop.MENU_ITEMS : []).forEach(it => {
    const row = document.createElement('div');
    row.className = 'flex justify-between items-center p-2 border-b border-white/5';
    row.innerHTML = `
      <div>
        <div class="font-medium">${it.name}</div>
        <div class="text-xs text-gray-400">$${it.price.toFixed(2)} • ${it.category}</div>
      </div>
      <div class="flex items-center gap-2">
        <input type="number" min="0" value="0" data-item-id="${it.id}" class="itemQty w-16 bg-white/5 p-1 rounded" />
      </div>
    `;
    container.appendChild(row);
  });
}

function createOrderFromForm(e) {
  e.preventDefault();
  const guest = document.getElementById('oGuest').value.trim();
  const seat = document.getElementById('oSeat').value.trim();
  const qtyInputs = Array.from(document.querySelectorAll('.itemQty'));
  const items = [];
  qtyInputs.forEach(inp => {
    const q = Number(inp.value || 0);
    if (q > 0) {
      const id = inp.getAttribute('data-item-id');
      const item = (window.shop && shop.MENU_ITEMS ? shop.MENU_ITEMS : []).find(i => i.id === id);
      if (item) items.push({ item, qty: q, guest: guest || null });
    }
  });
  if (!items.length) { alert('Please choose at least one item.'); return; }
  const total = items.reduce((s, it) => s + it.item.price * it.qty, 0);
  const id = 'ORD-' + Date.now();
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const order = { id, items, total, createdBy: user ? user.username : 'anonymous', createdByRole: user ? user.role : null, createdAt: new Date().toISOString(), seat };
  const existing = JSON.parse(localStorage.getItem('ncs_orders') || '[]');
  existing.push(order);
  localStorage.setItem('ncs_orders', JSON.stringify(existing));
  // reset form
  document.getElementById('createOrderForm').reset();
  renderCreateItems();
  renderOrders();
  alert('Order created: ' + id);
}

// Init
document.addEventListener('DOMContentLoaded', function () {
  renderCreateItems();
  renderOrders();
  const form = document.getElementById('createOrderForm');
  if (form) form.addEventListener('submit', createOrderFromForm);

  // refresh when storage changes
  window.addEventListener('storage', function () { renderOrders(); });

  // render current user
  const cu = getCurrentUser ? getCurrentUser() : null;
  const e = document.getElementById('currentUser');
  if (e) e.textContent = cu ? `${cu.username} (${cu.role})` : '';
});
