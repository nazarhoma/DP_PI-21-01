const contactLink = document.getElementById("contactLink");
const contactModal = document.getElementById("contactModal");
const closeModal = document.getElementById("closeModal");
const confirmationModal = document.getElementById("confirmationModal");
const closeConfirmationModal = document.getElementById("closeConfirmationModal");
const closeModalConfirm = document.getElementById("closeModalConfirm");
window.onload = function() {
    contactModal.style.display = "none";
    confirmationModal.style.display = "none";
    closeModalConfirm.style.display = "none";
}
contactLink.onclick = function() {
    contactModal.style.display = "block";
}
closeModal.onclick = function() {
    contactModal.style.display = "none";
}
window.onclick = function(event) {
    if (event.target === contactModal) {
        closeModalConfirm.style.display = "block";
    }
    if (event.target === confirmationModal || event.target === closeModalConfirm) {
        confirmationModal.style.display = "none";
        closeModalConfirm.style.display = "none";
    }
}
document.getElementById("contactForm").onsubmit = function(event) {
    event.preventDefault();
    contactModal.style.display = "none";
    confirmationModal.style.display = "block";
}
document.getElementById("confirmSend").onclick = function() {
    confirmationModal.style.display = "none";
    alert("Форма відправлена!");
}
document.getElementById("cancelSend").onclick = function() {
    confirmationModal.style.display = "none";
    contactModal.style.display = "block";
}
document.getElementById("confirmClose").onclick = function() {
    contactModal.style.display = "none";
    closeModalConfirm.style.display = "none";
}
document.getElementById("cancelClose").onclick = function() {
    closeModalConfirm.style.display = "none";
    contactModal.style.display = "block";
}
document.getElementById("closeConfirmationModal").onclick = function() {
    confirmationModal.style.display = "none";
}