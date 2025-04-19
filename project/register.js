// Перевірка паролю при вводі
document.getElementById('password').addEventListener('input', function() {
    const password = this.value;
    const requirementElement = document.querySelector('.password-requirements small');
    
    if (password.length < 8) {
        requirementElement.style.color = '#E53E3E'; // червоний колір
    } else {
        requirementElement.style.color = '#10B981'; // зелений колір
    }
    
    // Перевірка співпадіння паролів при зміні поля пароля
    checkPasswordMatch();
});

// Перевірка співпадіння паролів
document.getElementById('confirm-password').addEventListener('input', function() {
    checkPasswordMatch();
});

function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const matchElement = document.querySelector('.password-match');
    
    if (confirmPassword.length > 0) {
        matchElement.style.display = 'block';
        
        if (password === confirmPassword) {
            matchElement.querySelector('small').textContent = '* Паролі співпадають';
            matchElement.querySelector('small').style.color = '#10B981'; // зелений колір
        } else {
            matchElement.querySelector('small').textContent = '* Паролі не співпадають';
            matchElement.querySelector('small').style.color = '#E53E3E'; // червоний колір
        }
    } else {
        matchElement.style.display = 'none';
    }
}

document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Перевірка довжини пароля
    const password = document.getElementById('password').value;
    if (password.length < 8) {
        // Не використовуємо alert, а підсвічуємо вимогу червоним
        const requirementElement = document.querySelector('.password-requirements small');
        requirementElement.style.color = '#E53E3E';
        return;
    }

    // Перевірка співпадіння паролів
    const confirmPassword = document.getElementById('confirm-password').value;
    if (password !== confirmPassword) {
        const matchElement = document.querySelector('.password-match');
        matchElement.style.display = 'block';
        matchElement.querySelector('small').textContent = '* Паролі не співпадають';
        matchElement.querySelector('small').style.color = '#E53E3E';
        return;
    }

    const formData = new FormData(this);

    fetch('http://localhost/register.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log('Сервер надіслав:', data.message);
            if (data.message === 'Електронна пошта вже використовується') {
                alert('Ця електронна пошта вже зареєстрована!');
            } else if (data.message === 'Логін вже використовується') {
                alert('Цей логін вже зареєстрований!');
            } else if (data.message === 'Користувач успішно зареєстрований') {
                alert('Реєстрація успішна!');
                window.location.href = 'login.html';
            } else {
                alert('Сталася помилка: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert('Сталася помилка при відправці форми.');
        });
});