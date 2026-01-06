function toggleReservationModal() {
    const resModal = document.getElementById('reservationModal');
    resModal.classList.toggle('hidden');
}

// Ensure clicking the backdrop closes this modal too
window.addEventListener('click', function(event) {
    const resModal = document.getElementById('reservationModal');
    if (event.target == resModal) {
        resModal.classList.add('hidden');
    }
});