function updateCartCount() {
    // Перевіряємо чи користувач авторизований
    if (!isUserLoggedIn()) {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.style.display = 'none';
        }
        return;
    }

    fetch('server/cart.php', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include' // Додаємо для передачі cookies
    })
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            return response.json();
        })
        .then(items => {
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = items.length;
                cartCount.style.display = items.length > 0 ? 'block' : 'none';
            }
        })
        .catch(error => {
            console.error('Error updating cart count:', error);
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.style.display = 'none';
            }
        });
}

// Функція для перевірки авторизації користувача
function isUserLoggedIn() {
    const userData = localStorage.getItem('userData');
    if (!userData) return false;
    
    try {
        const user = JSON.parse(userData);
        return Boolean(user && user.id);
    } catch (e) {
        return false;
    }
}

// Оновлюємо лічильник при завантаженні сторінки
document.addEventListener('DOMContentLoaded', updateCartCount);

// Експортуємо функцію для використання в інших файлах
window.updateCartCount = updateCartCount; 