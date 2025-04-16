const contactLink = document.getElementById("contactLink");
const contactModal = document.getElementById("contactModal");
const closeModal = document.getElementById("closeModal");
const confirmationModal = document.getElementById("confirmationModal");
const closeConfirmationModal = document.getElementById("closeConfirmationModal");
const closeModalConfirm = document.getElementById("closeModalConfirm");

window.onload = function() {
    // Ховаємо всі модальні вікна при завантаженні сторінки
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        modal.style.display = "none";
        modal.classList.remove('show');
    });
}

if (contactLink) {
    contactLink.onclick = function() {
        contactModal.style.display = "flex";
        contactModal.classList.add('show');
    }
}

if (closeModal) {
    closeModal.onclick = function() {
        contactModal.style.display = "none";
        contactModal.classList.remove('show');
    }
}

window.onclick = function(event) {
    if (contactModal && event.target === contactModal) {
        if (closeModalConfirm) {
            closeModalConfirm.style.display = "flex";
            closeModalConfirm.classList.add('show');
        }
    }
    if ((confirmationModal && event.target === confirmationModal) || 
        (closeModalConfirm && event.target === closeModalConfirm)) {
        if (confirmationModal) {
            confirmationModal.style.display = "none";
            confirmationModal.classList.remove('show');
        }
        if (closeModalConfirm) {
            closeModalConfirm.style.display = "none";
            closeModalConfirm.classList.remove('show');
        }
    }
}

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.onsubmit = function(event) {
        event.preventDefault();
        if (contactModal) {
            contactModal.style.display = "none";
            contactModal.classList.remove('show');
        }
        if (confirmationModal) {
            confirmationModal.style.display = "flex";
            confirmationModal.classList.add('show');
        }
    }
}

const confirmSend = document.getElementById("confirmSend");
if (confirmSend) {
    confirmSend.onclick = function() {
        if (confirmationModal) {
            confirmationModal.style.display = "none";
            confirmationModal.classList.remove('show');
        }
        alert("Форма відправлена!");
    }
}

const cancelSend = document.getElementById("cancelSend");
if (cancelSend) {
    cancelSend.onclick = function() {
        if (confirmationModal) {
            confirmationModal.style.display = "none";
            confirmationModal.classList.remove('show');
        }
        if (contactModal) {
            contactModal.style.display = "flex";
            contactModal.classList.add('show');
        }
    }
}

const confirmClose = document.getElementById("confirmClose");
if (confirmClose) {
    confirmClose.onclick = function() {
        if (contactModal) {
            contactModal.style.display = "none";
            contactModal.classList.remove('show');
        }
        if (closeModalConfirm) {
            closeModalConfirm.style.display = "none";
            closeModalConfirm.classList.remove('show');
        }
    }
}

const cancelClose = document.getElementById("cancelClose");
if (cancelClose) {
    cancelClose.onclick = function() {
        if (closeModalConfirm) {
            closeModalConfirm.style.display = "none";
            closeModalConfirm.classList.remove('show');
        }
        if (contactModal) {
            contactModal.style.display = "flex";
            contactModal.classList.add('show');
        }
    }
}

if (closeConfirmationModal) {
    closeConfirmationModal.onclick = function() {
        if (confirmationModal) {
            confirmationModal.style.display = "none";
            confirmationModal.classList.remove('show');
        }
    }
}