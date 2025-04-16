document.addEventListener('DOMContentLoaded', function() {
    console.log("Сторінка профілю завантажується...");
    
    // Перевіряємо, чи користувач авторизований
    const token = localStorage.getItem('userToken');
    if (!token) {
        // Якщо користувач не авторизований, перенаправляємо на сторінку входу
        window.location.href = 'login.html';
        return;
    }
    
    // Отримуємо дані користувача
    let userData = JSON.parse(localStorage.getItem('userData') || '{}');
    console.log("Дані користувача з localStorage:", userData);
    
    // Оновлюємо дані користувача з сервера, якщо є ID
    if (userData.id) {
        // Отримуємо свіжі дані з сервера
        fetchUserData(userData.id)
            .then(updatedData => {
                userData = updatedData;
                updateProfileUI(userData);
            })
            .catch(error => {
                console.error('Помилка при оновленні даних користувача:', error);
                // Якщо не вдалося оновити дані, використовуємо дані з localStorage
                updateProfileUI(userData);
            });
    } else {
        // Якщо немає ID, використовуємо дані з localStorage
        updateProfileUI(userData);
    }
    
    // Функція для оновлення інтерфейсу профілю
    function updateProfileUI(userData) {
        // Заповнюємо дані профілю
        document.getElementById('profile-fullname').textContent = formatFullName(userData);
        document.getElementById('profile-email').textContent = maskEmail(userData.email);
        
        // Встановлюємо дату реєстрації
        const registrationDate = new Date().toLocaleDateString('uk-UA');
        document.getElementById('profile-registration-date').textContent = registrationDate;
        
        // Перевіряємо наявність додаткових даних профілю
        if (userData.gender) {
            let genderText = 'Не вказано';
            if (userData.gender === 'male') genderText = 'Чоловіча';
            else if (userData.gender === 'female') genderText = 'Жіноча';
            else if (userData.gender === 'other') genderText = 'Інша';
            document.getElementById('profile-gender').textContent = genderText;
        }
        
        if (userData.age) {
            document.getElementById('profile-age').textContent = userData.age;
        }
        
        if (userData.education) {
            document.getElementById('profile-education').textContent = userData.education;
        }
        
        if (userData.native_language) {
            document.getElementById('profile-language').textContent = userData.native_language;
        }
        
        // Встановлюємо аватар користувача, якщо він є
        console.log("Аватар користувача:", userData.avatar);
        if (userData.avatar) {
            const avatarUrl = getFullAvatarUrl(userData.avatar);
            console.log('Завантаження аватару з:', avatarUrl);
            
            // Оновлюємо обидва зображення аватару
            const profileAvatarImg = document.getElementById('profile-avatar-img');
            const headerAvatarImg = document.querySelector('.profile-avatar');
            
            if (profileAvatarImg) profileAvatarImg.src = avatarUrl;
            if (headerAvatarImg) headerAvatarImg.src = avatarUrl;
        }
        
        // Отримуємо актуальну роль з сервера
        if (userData.id) {
            getUserRoleFromServer(userData.id)
                .then(role => {
                    // Оновлюємо роль у локальному сховищі
                    userData.role = role;
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // Відображаємо роль користувача
                    const roleText = role === 'mentor' ? 'Ментор' : 'Студент';
                    document.getElementById('profile-role').textContent = roleText;
                    
                    // Оновлюємо UI елементи відповідно до ролі
                    updateUIBasedOnRole(role);
                })
                .catch(error => {
                    console.error('Помилка при отриманні ролі:', error);
                    
                    // У разі помилки використовуємо роль з localStorage
                    const role = userData.role || 'student';
                    const roleText = role === 'mentor' ? 'Ментор' : 'Студент';
                    document.getElementById('profile-role').textContent = roleText;
                    
                    // Оновлюємо UI елементи відповідно до ролі
                    updateUIBasedOnRole(role);
                });
        } else {
            // Відображаємо роль з localStorage, якщо немає ID
            const role = userData.role || 'student';
            const roleText = role === 'mentor' ? 'Ментор' : 'Студент';
            document.getElementById('profile-role').textContent = roleText;
            
            // Оновлюємо UI елементи відповідно до ролі
            updateUIBasedOnRole(role);
        }
        
        // Оновлюємо ім'я в хедері
        const profileName = document.querySelector('.profile-name');
        if (profileName) {
            profileName.textContent = formatFullName(userData);
        }
    }
    
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
                    // Оновлюємо існуючі дані користувача
                    const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                    
                    // Зберігаємо повні дані користувача
                    const updatedUserData = {
                        ...currentUserData,
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
                    };
                    
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                    resolve(updatedUserData);
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
    
    // Функція для отримання актуальної ролі користувача з сервера
    function getUserRoleFromServer(userId) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('user_id', userId);
            
            fetch('http://localhost/get_user_role.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data.role);
                } else {
                    reject(new Error(data.message || 'Помилка отримання ролі користувача'));
                }
            })
            .catch(error => {
                console.error('Помилка при запиті ролі:', error);
                reject(error);
            });
        });
    }
    
    // Функція для маскування email
    function maskEmail(email) {
        if (!email) return 'Не вказано';
        
        const parts = email.split('@');
        if (parts.length !== 2) return email;
        
        const username = parts[0];
        const domain = parts[1];
        
        // Якщо ім'я користувача коротке, маскуємо меншу кількість символів
        let maskedUsername = username;
        if (username.length <= 3) {
            maskedUsername = username[0] + '*' + (username.length > 2 ? username[username.length - 1] : '');
        } else {
            // Залишаємо перший та останній символ, решту маскуємо
            maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
        }
        
        return maskedUsername + '@' + domain;
    }
    
    // Функція для форматування повного імені
    function formatFullName(userData) {
        const firstName = userData.first_name || '';
        const lastName = userData.last_name || '';
        
        if (firstName || lastName) {
            return (firstName + ' ' + lastName).trim();
        } else {
            return userData.name || 'Не вказано';
        }
    }
    
    // Функція для отримання повного URL аватару
    function getFullAvatarUrl(avatar) {
        if (!avatar) return '';
        
        // Якщо аватар вже містить повний URL, повертаємо його
        if (avatar.startsWith('http')) {
            return avatar;
        }
        
        // Створюємо абсолютний URL для аватару
        const baseUrl = 'http://localhost';
        
        // Видаляємо початковий слеш, якщо він є
        if (avatar.startsWith('/')) {
            avatar = avatar.substring(1);
        }
        
        const fullUrl = `${baseUrl}/${avatar}`;
        console.log('Повний URL аватару:', fullUrl);
        return fullUrl;
    }
    
    // Оновлення UI елементів відповідно до ролі користувача
    function updateUIBasedOnRole(role) {
        const teachLink = document.querySelector('.teach-link');
        const addCourseLink = document.querySelector('.add-course-link');
        
        if (role === 'mentor') {
            // Ховаємо посилання на реєстрацію як ментор
            if (teachLink) teachLink.style.display = 'none';
            
            // Показуємо посилання на додавання курсу
            if (addCourseLink) addCourseLink.style.display = 'inline-block';
        } else {
            // Показуємо посилання на реєстрацію як ментор
            if (teachLink) {
                teachLink.style.display = 'inline-block';
                
                // Додаємо обробник для відкриття модального вікна верифікації
                teachLink.addEventListener('click', openVerificationModal);
            }
            
            // Ховаємо посилання на додавання курсу
            if (addCourseLink) addCourseLink.style.display = 'none';
        }
    }
    
    // Відкриття модального вікна верифікації
    function openVerificationModal() {
        const modal = document.getElementById('verificationModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    // Модальні вікна
    const editProfileModal = document.getElementById('editProfileModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    
    // Закриття модальних вікон
    document.getElementById('closeEditProfileModal').addEventListener('click', function() {
        editProfileModal.style.display = 'none';
    });
    
    document.getElementById('closeChangePasswordModal').addEventListener('click', function() {
        changePasswordModal.style.display = 'none';
    });
    
    // Закриття модального вікна при кліку поза ним
    window.addEventListener('click', function(event) {
        if (event.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
        if (event.target === changePasswordModal) {
            changePasswordModal.style.display = 'none';
        }
    });
    
    // Обробник для кнопки "Редагувати профіль"
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Заповнюємо форму даними користувача
            document.getElementById('edit-first-name').value = userData.first_name || '';
            document.getElementById('edit-last-name').value = userData.last_name || '';
            document.getElementById('edit-gender').value = userData.gender || '';
            document.getElementById('edit-age').value = userData.age || '';
            document.getElementById('edit-education').value = userData.education || '';
            document.getElementById('edit-language').value = userData.native_language || '';
            
            // Відкриваємо модальне вікно
            editProfileModal.style.display = 'block';
        });
    }
    
    // Обробник для форми редагування профілю
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(editProfileForm);
            formData.append('user_id', userData.id);
            
            // Надсилаємо дані на сервер
            fetch('http://localhost/update_profile.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Оновлюємо дані користувача в localStorage
                    if (data.user_data) {
                        Object.assign(userData, data.user_data);
                        localStorage.setItem('userData', JSON.stringify(userData));
                        
                        // Оновлюємо відображення на сторінці
                        document.getElementById('profile-fullname').textContent = formatFullName(userData);
                        document.getElementById('profile-email').textContent = maskEmail(userData.email);
                        
                        // Оновлюємо додаткові поля
                        let genderText = 'Не вказано';
                        if (userData.gender === 'male') genderText = 'Чоловіча';
                        else if (userData.gender === 'female') genderText = 'Жіноча';
                        else if (userData.gender === 'other') genderText = 'Інша';
                        document.getElementById('profile-gender').textContent = genderText;
                        
                        document.getElementById('profile-age').textContent = userData.age || 'Не вказано';
                        document.getElementById('profile-education').textContent = userData.education || 'Не вказано';
                        document.getElementById('profile-language').textContent = userData.native_language || 'Не вказано';
                        
                        // Оновлюємо ім'я в хедері
                        const profileName = document.querySelector('.profile-name');
                        if (profileName) {
                            profileName.textContent = formatFullName(userData);
                        }
                    }
                    
                    // Показуємо повідомлення про успіх
                    alert('Профіль успішно оновлено!');
                    
                    // Закриваємо модальне вікно
                    editProfileModal.style.display = 'none';
                } else {
                    // Показуємо повідомлення про помилку
                    alert('Помилка: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Помилка при оновленні профілю:', error);
                alert('Помилка при оновленні профілю. Спробуйте пізніше.');
            });
        });
    }
    
    // Обробник для кнопки "Змінити пароль"
    const changePasswordBtn = document.querySelector('.change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            // Очищаємо форму
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            
            // Відкриваємо модальне вікно
            changePasswordModal.style.display = 'block';
        });
    }
    
    // Обробник для форми зміни паролю
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Перевіряємо, чи співпадають паролі
            if (newPassword !== confirmPassword) {
                alert('Новий пароль і підтвердження не співпадають');
                return;
            }
            
            const formData = new FormData();
            formData.append('user_id', userData.id);
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);
            
            // Надсилаємо дані на сервер
            fetch('http://localhost/change_password.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Показуємо повідомлення про успіх
                    alert('Пароль успішно змінено!');
                    
                    // Закриваємо модальне вікно
                    changePasswordModal.style.display = 'none';
                } else {
                    // Показуємо повідомлення про помилку
                    alert('Помилка: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Помилка при зміні паролю:', error);
                alert('Помилка при зміні паролю. Спробуйте пізніше.');
            });
        });
    }
    
    // Обробник для кнопки "Змінити аватар"
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    
    if (changeAvatarBtn && avatarUpload) {
        changeAvatarBtn.addEventListener('click', function() {
            avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Перевіряємо розмір файлу (не більше 2 МБ)
                if (file.size > 2 * 1024 * 1024) {
                    alert('Файл занадто великий. Максимальний розмір - 2 МБ');
                    return;
                }
                
                // Перевіряємо тип файлу
                if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                    alert('Дозволені типи файлів: JPEG, PNG, GIF');
                    return;
                }
                
                // Попередній перегляд зображення
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('profile-avatar-img').src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Завантажуємо файл на сервер
                const formData = new FormData();
                formData.append('user_id', userData.id);
                formData.append('avatar', file);
                
                console.log('Відправка запиту для завантаження аватару...');
                fetch('http://localhost/upload_avatar.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    console.log('Статус відповіді:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Відповідь сервера:', data);
                    if (data.success) {
                        // Отримуємо URL аватара з відповіді сервера
                        const avatarUrl = data.avatar_url || '';
                        const fullAvatarUrl = getFullAvatarUrl(avatarUrl);
                        
                        console.log('Аватар URL:', avatarUrl);
                        console.log('Повний URL аватару:', fullAvatarUrl);
                        
                        // Оновлюємо аватар користувача в localStorage
                        userData.avatar = avatarUrl;
                        localStorage.setItem('userData', JSON.stringify(userData));
                        console.log('Збережені дані користувача:', JSON.parse(localStorage.getItem('userData')));
                        
                        // Оновлюємо аватар в хедері та на сторінці профілю
                        const profileAvatarImg = document.getElementById('profile-avatar-img');
                        const headerAvatarImg = document.querySelector('.profile-avatar');
                        
                        if (profileAvatarImg) profileAvatarImg.src = fullAvatarUrl;
                        if (headerAvatarImg) headerAvatarImg.src = fullAvatarUrl;
                        
                        // Показуємо повідомлення про успіх
                        alert('Аватар успішно оновлено!');
                    } else {
                        // Показуємо повідомлення про помилку
                        alert('Помилка: ' + data.message);
                        console.error('Помилка від сервера:', data.message);
                        
                        // Повертаємо попереднє зображення
                        const previousAvatar = userData.avatar ? getFullAvatarUrl(userData.avatar) : 'img/default-avatar.png';
                        document.getElementById('profile-avatar-img').src = previousAvatar;
                    }
                })
                .catch(error => {
                    console.error('Помилка при завантаженні аватару:', error);
                    alert('Помилка при завантаженні аватару. Спробуйте пізніше.');
                    
                    // Повертаємо попереднє зображення
                    const previousAvatar = userData.avatar ? getFullAvatarUrl(userData.avatar) : 'img/default-avatar.png';
                    document.getElementById('profile-avatar-img').src = previousAvatar;
                });
            }
        });
    }
    
    // Обробник для кнопки "Вийти"
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Скидаємо аватар до дефолтного перед видаленням даних
            const profileAvatarImg = document.getElementById('profile-avatar-img');
            const headerAvatarImg = document.querySelector('.profile-avatar');
            
            if (profileAvatarImg) profileAvatarImg.src = 'img/default-avatar.png';
            if (headerAvatarImg) headerAvatarImg.src = 'img/default-avatar.png';
            
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        });
    }
}); 