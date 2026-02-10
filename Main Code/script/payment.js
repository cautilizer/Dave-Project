// payment.js — simulate payment flows and mark orders as paid (DEMO)

function qs(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

function loadOrder() {
  const id = qs('orderId');
  if (!id) {
    document.getElementById('orderSummary').innerHTML = '<div class="text-sm text-red-400">No order specified.</div>';
    return null;
  }
  const orders = JSON.parse(localStorage.getItem('ncs_orders') || '[]');
  const order = orders.find(o => o.id === id);
  if (!order) {
    document.getElementById('orderSummary').innerHTML = '<div class="text-sm text-red-400">Order not found.</div>';
    return null;
  }
  // render
  const html = `
    <div class="mb-2">
      <div class="text-xs text-gray-400">Order</div>
      <div class="font-bold">${order.id} • ${order.createdBy || ''}</div>
      <div class="text-xs text-gray-400">Seat: ${order.seat || '-'}</div>
    </div>
    <div class="mt-2">
      ${order.items.map(it => `<div class="flex justify-between"><div class="text-sm">${it.item.name} x${it.qty}</div><div class="text-sm">$${(it.item.price * it.qty).toFixed(2)}</div></div>`).join('')}
    </div>
    <div class="mt-3 flex justify-between items-center">
      <div class="text-sm text-gray-400">Total</div>
      <div class="font-bold">$${(order.total || 0).toFixed(2)}</div>
    </div>
  `;
  document.getElementById('orderSummary').innerHTML = html;
  return order;
}

function markOrderPaid(orderId, method, meta) {
  const orders = JSON.parse(localStorage.getItem('ncs_orders') || '[]');
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return false;
  orders[idx].paid = true;
  orders[idx].payment = { method, meta: meta || null, paidAt: new Date().toISOString() };
  localStorage.setItem('ncs_orders', JSON.stringify(orders));
  window.dispatchEvent(new Event('ncs_order_created'));
  return true;
}

// UI wiring
let currentOrder = null;

document.addEventListener('DOMContentLoaded', function () {
  currentOrder = loadOrder();
  // buttons
  document.getElementById('tngBtn').addEventListener('click', function () {
    document.getElementById('tngArea').classList.remove('hidden');
    document.getElementById('qrArea').classList.add('hidden');
    document.getElementById('bankArea').classList.add('hidden');
  });
  document.getElementById('qrBtn').addEventListener('click', function () {
    document.getElementById('qrArea').classList.remove('hidden');
    document.getElementById('tngArea').classList.add('hidden');
    document.getElementById('bankArea').classList.add('hidden');
    renderQr();
  });
  document.getElementById('bankBtn').addEventListener('click', function () {
    document.getElementById('bankArea').classList.remove('hidden');
    document.getElementById('tngArea').classList.add('hidden');
    document.getElementById('qrArea').classList.add('hidden');
  });

  // Touch n go simulate
  document.getElementById('tngSimBtn').addEventListener('click', function () {
    if (!currentOrder) return;
    // simulate delay
    setTimeout(() => {
      markOrderPaid(currentOrder.id, 'tng', { provider: 'TouchNGo' });
      alert('Payment success (Touch n Go).');
      location.href = 'orders.html';
    }, 1200);
  });
  document.getElementById('tngCancel').addEventListener('click', function () {
    document.getElementById('tngArea').classList.add('hidden');
  });

  // QR area
  document.getElementById('qrPaidBtn').addEventListener('click', function () {
    if (!currentOrder) return;
    markOrderPaid(currentOrder.id, 'qr', { provider: 'QR Demo' });
    alert('Payment success (QR).');
    location.href = 'orders.html';
  });
  document.getElementById('qrCancel').addEventListener('click', function () { document.getElementById('qrArea').classList.add('hidden'); });

  // bank
  document.getElementById('bankPaidBtn').addEventListener('click', function () {
    if (!currentOrder) return;
    const ref = document.getElementById('bankRef').value.trim();
    if (!ref) { alert('Please enter transaction reference'); return; }
    markOrderPaid(currentOrder.id, 'bank', { ref });
    alert('Payment success (Bank).');
    location.href = 'orders.html';
  });
  document.getElementById('bankCancel').addEventListener('click', function () { document.getElementById('bankArea').classList.add('hidden'); });
});

function renderQr() {
  const qrImage = document.getElementById('qrImage');
  if (!qrImage || !currentOrder) return;
  // For demo, render a simple data URL with order id as text (not a real QR)
  qrImage.innerHTML = `<div class="text-xs text-gray-400">QR: ${currentOrder.id}</div>`;
}
