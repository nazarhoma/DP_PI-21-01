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
                // Зберігаємо токен авторизації
                localStorage.setItem('userToken', 'auth_token_' + data.user.id);
                
                // Отримуємо повні дані користувача з сервера після успішної авторизації
                fetchUserData(data.user.id).then(() => {
                    alert('Авторизація успішна!');
                    window.location.href = 'index.html';
                }).catch(error => {
                    console.error('Помилка отримання даних користувача:', error);
                    // Якщо не вдалося отримати повні дані, використовуємо базові
                    localStorage.setItem('userData', JSON.stringify({
                        id: data.user.id,
                        name: data.user.username,
                        email: data.user.email,
                        role: data.user.role || 'student'
                    }));
                    alert('Авторизація успішна! (Не вдалося завантажити повні дані профілю)');
                    window.location.href = 'index.html';
                });
            } else {
                alert('Помилка: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert('Сталася помилка при відправці форми.');
        });
});

// Функція для отримання повних даних користувача з сервера
function fetchUserData(userId) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('user_id', userId);
        
        fetch('http://localhost/get_user_data.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Зберігаємо повні дані користувача
                localStorage.setItem('userData', JSON.stringify({
                    id: data.user_data.id,
                    name: data.user_data.username,
                    email: data.user_data.email,
                    role: data.user_data.role || 'student',
                    first_name: data.user_data.first_name,
                    last_name: data.user_data.last_name,
                    avatar: data.user_data.avatar,
                    gender: data.user_data.gender,
                    age: data.user_data.age,
                    education: data.user_data.education,
                    native_language: data.user_data.native_language
                }));
                resolve();
            } else {
                reject(new Error(data.message || 'Не вдалося отримати дані користувача'));
            }
        })
        .catch(error => {
            console.error('Помилка при отриманні даних користувача:', error);
            reject(error);
        });
    });
}