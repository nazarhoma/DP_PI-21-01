const contactLink = document.getElementById("contactLink");
const contactModal = document.getElementById("contactModal");
const closeModal = document.getElementById("closeModal");
const confirmationModal = document.getElementById("confirmationModal");
const closeConfirmationModal = document.getElementById("closeConfirmationModal");
const closeModalConfirm = document.getElementById("closeModalConfirm");

window.onload = function() {
    if (contactModal) contactModal.style.display = "none";
    if (confirmationModal) confirmationModal.style.display = "none";
    if (closeModalConfirm) closeModalConfirm.style.display = "none";
}

if (contactLink) {
    contactLink.onclick = function() {
        contactModal.style.display = "block";
    }
}

if (closeModal) {
    closeModal.onclick = function() {
        contactModal.style.display = "none";
    }
}

window.onclick = function(event) {
    if (contactModal && event.target === contactModal) {
        if (closeModalConfirm) closeModalConfirm.style.display = "block";
    }
    if ((confirmationModal && event.target === confirmationModal) || 
        (closeModalConfirm && event.target === closeModalConfirm)) {
        if (confirmationModal) confirmationModal.style.display = "none";
        if (closeModalConfirm) closeModalConfirm.style.display = "none";
    }
}

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.onsubmit = function(event) {
        event.preventDefault();
        if (contactModal) contactModal.style.display = "none";
        if (confirmationModal) confirmationModal.style.display = "block";
    }
}

const confirmSend = document.getElementById("confirmSend");
if (confirmSend) {
    confirmSend.onclick = function() {
        if (confirmationModal) confirmationModal.style.display = "none";
        alert("Форма відправлена!");
    }
}

const cancelSend = document.getElementById("cancelSend");
if (cancelSend) {
    cancelSend.onclick = function() {
        if (confirmationModal) confirmationModal.style.display = "none";
        if (contactModal) contactModal.style.display = "block";
    }
}

const confirmClose = document.getElementById("confirmClose");
if (confirmClose) {
    confirmClose.onclick = function() {
        if (contactModal) contactModal.style.display = "none";
        if (closeModalConfirm) closeModalConfirm.style.display = "none";
    }
}

const cancelClose = document.getElementById("cancelClose");
if (cancelClose) {
    cancelClose.onclick = function() {
        if (closeModalConfirm) closeModalConfirm.style.display = "none";
        if (contactModal) contactModal.style.display = "block";
    }
}

if (closeConfirmationModal) {
    closeConfirmationModal.onclick = function() {
        if (confirmationModal) confirmationModal.style.display = "none";
    }
}