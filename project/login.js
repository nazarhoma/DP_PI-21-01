document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    fetch('http://localhost/login.php', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            console.log('Сервер надіслав:', data.message);

            if (data.message === 'Авторизація успішна!') {
                alert('Авторизація успішна!');
                
                // Зберігаємо дані користувача в правильному форматі
                localStorage.setItem('userToken', 'auth_token_' + data.user.id);
                localStorage.setItem('userData', JSON.stringify({
                    id: data.user.id,
                    name: data.user.username,
                    email: data.user.email,
                    role: data.user.role || 'student' // Додаємо роль зі значенням за замовчуванням
                }));
                
                window.location.href = 'index.html';
            } else {
                alert('Помилка: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert('Сталася помилка при відправці форми.');
        });
});