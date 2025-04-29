document.addEventListener('DOMContentLoaded', function() {
    // Перевіряємо чи користувач авторизований
    if (!isUserLoggedIn()) {
        showNotification('Будь ласка, увійдіть в систему', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Отримуємо параметри з URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course_id');
    
    if (!courseId) {
        window.location.href = 'index.html';
        return;
    }

    // Завантажуємо інформацію про курс
    loadCourseInfo(courseId);

    // Обробка форми оплати
    const form = document.getElementById('payment-confirmation-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const confirmedPrice = parseFloat(document.getElementById('confirm-price').value);
        const actualPrice = parseFloat(document.getElementById('course-price').textContent);
        
        if (confirmedPrice === actualPrice) {
            processPurchase(courseId);
        } else {
            document.querySelector('.price-mismatch-error').style.display = 'block';
        }
    });
});

function loadCourseInfo(courseId) {
    fetch(`server/get_course.php?id=${courseId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(course => {
            if (course.error) {
                throw new Error(course.error);
            }
            document.getElementById('course-title').textContent = course.title;
            document.getElementById('course-price').textContent = course.price;
            if (course.image) {
                document.getElementById('course-image').src = course.image;
            }
        })
        .catch(error => {
            console.error('Error loading course:', error);
            showNotification('Помилка завантаження інформації про курс', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        });
}

function processPurchase(courseId) {
    // Показуємо індикатор завантаження
    const payButton = document.querySelector('.pay-button');
    const originalText = payButton.textContent;
    payButton.disabled = true;
    payButton.textContent = 'Обробка оплати...';

    fetch('server/purchase.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ course_id: courseId })
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Необхідна авторизація');
            } else if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Помилка валідації даних');
                });
            } else if (response.status === 404) {
                throw new Error('Курс не знайдено');
            } else if (response.status === 500) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Помилка сервера');
                });
            }
            throw new Error('Помилка мережі');
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        showNotification('Оплата пройшла успішно!', 'success');
        setTimeout(() => {
            window.location.href = `course.html?id=${courseId}`;
        }, 2000);
    })
    .catch(error => {
        console.error('Error processing purchase:', error);
        showNotification(error.message || 'Помилка при обробці оплати', 'error');
    })
    .finally(() => {
        // Відновлюємо кнопку
        payButton.disabled = false;
        payButton.textContent = originalText;
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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