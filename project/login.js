document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    fetch('/server/login.php', {
        method: 'POST',
        body: formData,
    })
        .then(response => {
            console.log('Статус відповіді:', response.status);
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Помилка парсингу JSON:', e);
                    console.log('Отриманий текст:', text);
                    throw new Error('Невалідний JSON: ' + text);
                }
            });
        })
        .then(data => {
            console.log('Сервер надіслав:', data);

            // Перевіряємо на успішність авторизації
            if (data.success === true && data.message === 'Авторизація успішна!') {
                // Зберігаємо токен авторизації
                localStorage.setItem('userToken', 'auth_token_' + data.user.id);
                
                console.log("Отримано повні дані користувача при авторизації:", data.user);
                
                // Повні дані користувача вже повернені від сервера
                if (data.user && Object.keys(data.user).length > 4) { // Якщо у нас є більше, ніж базові поля
                    const userData = {
                        id: data.user.id,
                        name: data.user.username,
                        email: data.user.email,
                        role: data.user.role || 'student',
                        first_name: data.user.first_name,
                        last_name: data.user.last_name,
                        avatar: data.user.avatar,
                        gender: data.user.gender,
                        age: data.user.age,
                        education: data.user.education,
                        native_language: data.user.native_language,
                        registration_date: data.user.created_at
                    };
                    
                    console.log("Зберігаємо повні дані:", userData);
                    localStorage.setItem('userData', JSON.stringify(userData));
                    alert('Авторизація успішна!');
                    
                    // Перевіряємо, чи є користувач адміністратором
                    if (userData.role === 'admin') {
                        // Якщо користувач адмін, перенаправляємо на адмін-панель
                        window.location.href = 'admin.html';
                    } else {
                        // Якщо звичайний користувач, на головну сторінку
                        window.location.href = 'index.html';
                    }
                } 
                // Якщо повні дані не повернені, отримуємо їх окремим запитом
                else {
                    fetchUserData(data.user.id).then((userData) => {
                        console.log("Авторизація успішна! Отримано повні дані користувача:", userData);
                        alert('Авторизація успішна!');
                        
                        // Перевіряємо, чи є користувач адміністратором
                        if (userData.role === 'admin') {
                            // Якщо користувач адмін, перенаправляємо на адмін-панель
                            window.location.href = 'admin.html';
                        } else {
                            // Якщо звичайний користувач, на головну сторінку
                            window.location.href = 'index.html';
                        }
                    }).catch(error => {
                        console.error('Помилка отримання даних користувача:', error);
                        // Якщо не вдалося отримати повні дані, використовуємо базові
                        const basicUserData = {
                            id: data.user.id,
                            name: data.user.username,
                            email: data.user.email,
                            role: data.user.role || 'student'
                        };
                        console.log("Використовуємо базові дані користувача:", basicUserData);
                        localStorage.setItem('userData', JSON.stringify(basicUserData));
                        alert('Авторизація успішна! (Не вдалося завантажити повні дані профілю)');
                        
                        // Перевіряємо, чи є користувач адміністратором
                        if (basicUserData.role === 'admin') {
                            // Якщо користувач адмін, перенаправляємо на адмін-панель
                            window.location.href = 'admin.html';
                        } else {
                            // Якщо звичайний користувач, на головну сторінку
                            window.location.href = 'index.html';
                        }
                    });
                }
            } else {
                alert('Помилка: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert('Сталася помилка при відправці форми: ' + error.message);
        });
});

// Функція для отримання повних даних користувача з сервера
function fetchUserData(userId) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('user_id', userId);
        
        fetch('/server/get_user_data.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Отримано дані користувача з БД:", data.user);
                
                // Перевіряємо, чи є дані користувача
                if (!data.user) {
                    console.error("Отримано успішну відповідь, але дані користувача відсутні");
                    reject(new Error('Дані користувача відсутні у відповіді сервера'));
                    return;
                }
                
                // Створюємо об'єкт з усіма даними користувача
                const userData = {
                    id: data.user.id,
                    name: data.user.name || data.user.username,
                    email: data.user.email,
                    role: data.user.role || 'student',
                    first_name: data.user.first_name,
                    last_name: data.user.last_name,
                    avatar: data.user.avatar_url || data.user.avatar,
                    gender: data.user.gender,
                    age: data.user.age,
                    education: data.user.education,
                    native_language: data.user.native_language,
                    registration_date: data.user.created_at
                };
                
                console.log("Зберігаємо в localStorage повні дані:", userData);
                
                // Зберігаємо повні дані користувача
                localStorage.setItem('userData', JSON.stringify(userData));
                resolve(userData);
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