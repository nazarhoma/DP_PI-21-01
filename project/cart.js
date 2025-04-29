document.addEventListener('DOMContentLoaded', function() {
    loadCartItems();
    
    // Обробник для кнопки "Придбати все"
    document.getElementById('checkout-all').addEventListener('click', purchaseAllItems);
});

function loadCartItems() {
    fetch('server/cart.php', {
        credentials: 'include'
    })
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            return response.json();
        })
        .then(items => {
            const cartContainer = document.getElementById('cart-items');
            let totalPrice = 0;
            
            if (items.length === 0) {
                cartContainer.innerHTML = '<p class="empty-cart">Ваш кошик порожній</p>';
                document.querySelector('.cart-summary').style.display = 'none';
                return;
            }
            
            document.querySelector('.cart-summary').style.display = 'flex';
            
            const itemsHTML = items.map(item => {
                totalPrice += parseFloat(item.price);
                return `
                    <div class="cart-item" data-id="${item.cart_id}" data-course-id="${item.id}">
                        <div class="cart-item-image-container">
                            <img src="../${item.image}" alt="${item.title}" class="cart-item-image">
                        </div>
                        <div class="cart-item-details">
                            <div class="cart-item-header">
                                <h3 class="cart-item-title">${item.title}</h3>
                            </div>
                            <p class="cart-item-author">Автор: ${item.author}</p>
                            <div class="cart-item-price">${item.price} грн</div>
                            <button class="remove-btn" onclick="removeFromCart(${item.cart_id})" aria-label="Видалити з кошика">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            cartContainer.innerHTML = itemsHTML;
            document.getElementById('total-price').textContent = totalPrice.toFixed(2);
        })
        .catch(error => {
            console.error('Error loading cart:', error);
            if (error.message === 'Unauthorized') {
                window.location.href = 'login.html';
            } else {
                showNotification('Помилка завантаження кошика', 'error');
            }
        });
}

function removeFromCart(cartId) {
    fetch(`server/cart.php?id=${cartId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            showNotification('Курс видалено з кошика', 'success');
            loadCartItems();
            updateCartCount();
        })
        .catch(error => {
            console.error('Error removing item:', error);
            showNotification('Помилка видалення з кошика', 'error');
        });
}

function purchaseAllItems() {
    const cartItems = document.querySelectorAll('.cart-item');
    if (cartItems.length === 0) {
        showNotification('Кошик порожній', 'error');
        return;
    }

    // Отримуємо course_id першого товару (для демонстрації купуємо один товар)
    const courseId = cartItems[0].getAttribute('data-course-id');
    window.location.href = `checkout.html?course_id=${courseId}`;
}

function purchaseItem(courseId) {
    return fetch('server/purchase.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ course_id: courseId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    });
}

// Функція для показу сповіщень
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateCartCount() {
    // Реалізація оновлення лічильника
} 