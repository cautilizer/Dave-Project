function toggleReservationModal() {
    const resModal = document.getElementById('reservationModal');
    resModal.classList.toggle('hidden');
    if (!resModal.classList.contains('hidden')) {
        // focus first input when opened
        const first = resModal.querySelector('input');
        if (first) first.focus();
    }
}

// Ensure clicking the backdrop closes this modal too
window.addEventListener('click', function(event) {
    const resModal = document.getElementById('reservationModal');
    if (resModal && event.target == resModal) {
        resModal.classList.add('hidden');
    }
});

// On load set up auth UI and reservation form handling
document.addEventListener('DOMContentLoaded', function () {
    // initAuthUI will be available after auth.js is loaded in index.html
    if (typeof initAuthUI === 'function') initAuthUI();

    // Wire logout if present
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', function (e) { e.preventDefault(); logout(); });

    // Reservation form persistence (simple localStorage-backed)
    const form = document.getElementById('resForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const data = {};
            const fields = form.querySelectorAll('input, select, textarea');
            fields.forEach(f => {
                if (!f.name) {
                    // use id or placeholder as key fallback
                    const key = f.id || (f.placeholder ? f.placeholder.replace(/\s+/g, '_').toLowerCase() : null);
                    if (key) data[key] = f.value;
                } else {
                    data[f.name] = f.value;
                }
            });
            // Attach meta
            const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
            data._createdBy = user ? user.username : 'anonymous';
            data._createdAt = new Date().toISOString();

            // Save
            const key = 'ncs_reservations';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(data);
            localStorage.setItem(key, JSON.stringify(existing));

            // simple success feedback
            alert('Reservation saved (demo).');
            // close modal
            toggleReservationModal();
            // reset form
            form.reset();
            // refresh UI if needed (no list implemented yet)
        });
    }
});
