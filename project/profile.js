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
    console.log("Всі поля з localStorage:", Object.keys(userData));
    
    // Додаткова перевірка наявності розширених полів
    if (!userData.first_name && !userData.last_name && !userData.gender) {
        console.warn("Увага! Розширені дані профілю відсутні в localStorage.");
    }
    
    // Завжди завантажуємо актуальні дані користувача з сервера, якщо є ID
    if (userData.id) {
        console.log("Запит на отримання даних користувача з ID:", userData.id);
        // Отримуємо свіжі дані з сервера
        fetchUserData(userData.id)
            .then(updatedData => {
                console.log("Отримано свіжі дані з сервера:", updatedData);
                console.log("Поля у свіжих даних:", Object.keys(updatedData));
                userData = updatedData;
                updateProfileUI(userData);
                
                // Завантажуємо курси користувача після оновлення даних
                loadUserCourses(userData.id);
            })
            .catch(error => {
                console.error('Помилка при оновленні даних користувача:', error);
                // Якщо не вдалося оновити дані, використовуємо дані з localStorage
                console.log("Використовуємо дані з localStorage через помилку:", userData);
                updateProfileUI(userData);
                
                // Все одно спробуємо завантажити курси
                loadUserCourses(userData.id);
            });
    } else {
        // Якщо немає ID, використовуємо дані з localStorage
        console.warn("Не знайдено ID користувача! Використовуємо дані з localStorage без оновлення.");
        updateProfileUI(userData);
    }
    
    // Функція для завантаження курсів користувача
    function loadUserCourses(userId) {
        console.log("Завантаження курсів для користувача з ID:", userId);
        
        // Створюємо об'єкт FormData для відправки на сервер
        const formData = new FormData();
        formData.append('user_id', userId);
        
        // Робимо запит на сервер для отримання курсів користувача
        fetch('/server/get_user_courses.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Відповідь від сервера про курси:", data);
            
            if (data.success && data.courses && data.courses.length > 0) {
                displayUserCourses(data.courses);
            } else {
                // Якщо курсів немає або сталася помилка, показуємо відповідне повідомлення
                console.log("Курси не знайдені або сталася помилка:", data.message);
                const coursesSection = document.querySelector('.courses-list');
                if (coursesSection) {
                    coursesSection.innerHTML = '<p class="no-courses">У вас поки немає записаних курсів</p>';
                }
            }
        })
        .catch(error => {
            console.error("Помилка при завантаженні курсів:", error);
            const coursesSection = document.querySelector('.courses-list');
            if (coursesSection) {
                coursesSection.innerHTML = '<p class="no-courses">Помилка завантаження курсів. Спробуйте оновити сторінку.</p>';
            }
        });
    }
    
    // Функція для відображення курсів користувача
    function displayUserCourses(courses) {
        console.log("Відображення курсів користувача:", courses);
        
        const coursesSection = document.querySelector('.courses-list');
        if (!coursesSection) {
            console.error("Не знайдено контейнер для курсів!");
            return;
        }
        
        // Очищуємо контейнер перед додаванням нових курсів
        coursesSection.innerHTML = '';
        
        // Перебираємо курси та створюємо картки для кожного
        courses.forEach(course => {
            // Створюємо елемент картки курсу
            const courseCard = document.createElement('article');
            courseCard.className = 'course-card jcsb';
            
            // Визначаємо відображення статусу курсу
            let statusText = '';
            let statusClass = '';
            
            switch(course.status) {
                case 'active':
                    statusText = 'Активний';
                    statusClass = 'status-active';
                    break;
                case 'completed':
                    statusText = 'Завершений';
                    statusClass = 'status-completed';
                    break;
                case 'dropped':
                    statusText = 'Призупинено';
                    statusClass = 'status-dropped';
                    break;
                default:
                    statusText = 'Активний';
                    statusClass = 'status-active';
            }
            
            // Додаємо HTML вміст картки
            courseCard.innerHTML = `
                <div class="course-image-container">
                    <img class="course-image" src="${course.image}" alt="${course.title}">
                    <span class="course-status ${statusClass}">${statusText}</span>
                </div>
                <div class="course-details">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-author">Автор: ${course.author_fullname || course.author}</p>
                    <div class="course-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${course.progress || 0}%"></div>
                        </div>
                        <span class="progress-text">${course.progress || 0}% завершено</span>
                    </div>
                    <a href="course.html?id=${course.id}" class="continue-btn">Продовжити навчання</a>
                </div>
            `;
            
            // Додаємо картку до контейнера
            coursesSection.appendChild(courseCard);
        });
    }
    
    // Функція для оновлення інтерфейсу профілю
    function updateProfileUI(userData) {
        console.log("Оновлення інтерфейсу з даними:", userData);
        
        // Заповнюємо дані профілю
        const fullName = formatFullName(userData);
        console.log("Форматоване повне ім'я:", fullName);
        document.getElementById('profile-fullname').textContent = fullName;
        
        const maskedEmail = maskEmail(userData.email);
        console.log("Замаскований email:", maskedEmail);
        document.getElementById('profile-email').textContent = maskedEmail;
        
        // Встановлюємо дату реєстрації
        if (userData.registration_date) {
            // Конвертуємо timestamp у локальну дату
            const date = new Date(userData.registration_date);
            const formattedDate = date.toLocaleDateString('uk-UA');
            console.log("Дата реєстрації з БД:", userData.registration_date, "відформатована:", formattedDate);
            document.getElementById('profile-registration-date').textContent = formattedDate;
        } else {
            // Якщо дата реєстрації не доступна, показуємо поточну дату
            const currentDate = new Date().toLocaleDateString('uk-UA');
            console.log("Дата реєстрації відсутня, використовуємо поточну:", currentDate);
            document.getElementById('profile-registration-date').textContent = currentDate;
        }
        
        // Перевіряємо наявність додаткових даних профілю
        if (userData.gender) {
            let genderText = 'Не вказано';
            if (userData.gender === 'male') genderText = 'Чоловіча';
            else if (userData.gender === 'female') genderText = 'Жіноча';
            else if (userData.gender === 'other') genderText = 'Інша';
            console.log("Стать з БД:", userData.gender, "відображається як:", genderText);
            document.getElementById('profile-gender').textContent = genderText;
        } else {
            console.log("Стать не вказана в даних");
        }
        
        if (userData.age) {
            console.log("Вік з БД:", userData.age);
            document.getElementById('profile-age').textContent = userData.age;
        } else {
            console.log("Вік не вказаний в даних");
        }
        
        if (userData.education) {
            console.log("Освіта з БД:", userData.education);
            document.getElementById('profile-education').textContent = userData.education;
        } else {
            console.log("Освіта не вказана в даних");
        }
        
        if (userData.native_language) {
            console.log("Рідна мова з БД:", userData.native_language);
            document.getElementById('profile-language').textContent = userData.native_language;
        } else {
            console.log("Рідна мова не вказана в даних");
        }
        
        // Встановлюємо аватар користувача, якщо він є
        console.log("Аватар користувача з даних:", userData.avatar);
        if (userData.avatar) {
            const avatarUrl = getFullAvatarUrl(userData.avatar);
            console.log('Завантаження аватару з URL:', avatarUrl);
            
            // Оновлюємо обидва зображення аватару
            const profileAvatarImg = document.getElementById('profile-avatar-img');
            const headerAvatarImg = document.querySelector('.profile-avatar');
            
            if (profileAvatarImg) {
                profileAvatarImg.src = avatarUrl;
                profileAvatarImg.onerror = function() {
                    console.log("Помилка завантаження аватару. Використовую запасний аватар.");
                    this.src = 'img/default-avatar.png';
                    this.onerror = null; // Запобігаємо зациклюванню
                };
            }
            
            if (headerAvatarImg) {
                headerAvatarImg.src = avatarUrl;
                headerAvatarImg.onerror = function() {
                    console.log("Помилка завантаження аватару в хедері. Використовую запасний аватар.");
                    this.src = 'img/default-avatar.png';
                    this.onerror = null; // Запобігаємо зациклюванню
                };
            }
        } else {
            console.log("Аватар не вказаний в даних, використовуємо дефолтний");
            // Встановлюємо запасний аватар для обох зображень
            const profileAvatarImg = document.getElementById('profile-avatar-img');
            const headerAvatarImg = document.querySelector('.profile-avatar');
            
            if (profileAvatarImg) profileAvatarImg.src = 'img/default-avatar.png';
            if (headerAvatarImg) headerAvatarImg.src = 'img/default-avatar.png';
        }
        
        // Оновлюємо роль
        const role = userData.role || 'student';
        const roleText = role === 'mentor' ? 'Ментор' : 'Студент';
        console.log("Роль з даних:", role, "відображається як:", roleText);
        document.getElementById('profile-role').textContent = roleText;
            
        // Оновлюємо UI елементи відповідно до ролі
        updateUIBasedOnRole(role);
        
        // Оновлюємо ім'я в хедері
        const profileName = document.querySelector('.profile-name');
        if (profileName) {
            profileName.textContent = fullName;
            console.log("Оновлено ім'я в хедері:", fullName);
        }
    }
    
    // Функція для отримання повних даних користувача з сервера
    function fetchUserData(userId) {
        return new Promise((resolve, reject) => {
            console.log("Запит даних користувача з сервера для ID:", userId);
            const formData = new FormData();
            formData.append('user_id', userId);
            
            fetch('/server/get_user_data.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log("Отримано відповідь від сервера зі статусом:", response.status);
                return response.json();
            })
            .then(data => {
                console.log("Розпарсені дані від сервера:", data);
                if (data.success) {
                    console.log("Отримано успішні дані з БД:", data.user_data);
                    console.log("Поля в даних з сервера:", Object.keys(data.user_data));
                    
                    // Оновлюємо існуючі дані користувача
                    const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                    console.log("Поточні дані з localStorage перед оновленням:", currentUserData);
                    
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
                        native_language: data.user_data.native_language,
                        registration_date: data.user_data.created_at
                    };
                    
                    console.log("Оновлені дані для збереження в localStorage:", updatedUserData);
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                    resolve(updatedUserData);
                } else {
                    console.error("Помилка від сервера:", data.message);
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
            
            fetch('/server/get_user_role.php', {
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
        if (userData.first_name && userData.last_name) {
            return `${userData.first_name} ${userData.last_name}`;
        } else if (userData.first_name) {
            return userData.first_name;
        } else if (userData.name) {
            return userData.name;
        } else {
            return 'Користувач';
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
        const baseUrl = '/server/';
        
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
            modal.style.display = 'flex';
            modal.classList.add('show');
        }
    }
    
    // Модальні вікна
    const editProfileModal = document.getElementById('editProfileModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    
    // Закриття модальних вікон
    document.getElementById('closeEditProfileModal').addEventListener('click', function() {
        const modal = document.getElementById('editProfileModal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    
    document.getElementById('closeChangePasswordModal').addEventListener('click', function() {
        const modal = document.getElementById('changePasswordModal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    
    // Закриття модального вікна при кліку поза ним
    window.addEventListener('click', function(event) {
        const editProfileModal = document.getElementById('editProfileModal');
        const changePasswordModal = document.getElementById('changePasswordModal');
        
        if (event.target === editProfileModal) {
            editProfileModal.style.display = 'none';
            editProfileModal.classList.remove('show');
        }
        if (event.target === changePasswordModal) {
            changePasswordModal.style.display = 'none';
            changePasswordModal.classList.remove('show');
        }
    });
    
    // Обробник для кнопки "Редагувати профіль"
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            const modal = document.getElementById('editProfileModal');
            modal.style.display = 'flex';
            modal.classList.add('show');
            
            // Заповнюємо форму поточними даними користувача
            document.getElementById('edit-first-name').value = userData.first_name || '';
            document.getElementById('edit-last-name').value = userData.last_name || '';
            document.getElementById('edit-gender').value = userData.gender || '';
            document.getElementById('edit-age').value = userData.age || '';
            document.getElementById('edit-education').value = userData.education || '';
            document.getElementById('edit-language').value = userData.native_language || '';
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
            fetch('/server/update_profile.php', {
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
                    const modal = document.getElementById('editProfileModal');
                    modal.style.display = 'none';
                    modal.classList.remove('show');
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
            const modal = document.getElementById('changePasswordModal');
            modal.style.display = 'flex';
            modal.classList.add('show');
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
            fetch('/server/change_password.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Показуємо повідомлення про успіх
                    alert('Пароль успішно змінено!');
                    
                    // Закриваємо модальне вікно
                    const modal = document.getElementById('changePasswordModal');
                    modal.style.display = 'none';
                    modal.classList.remove('show');
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
                fetch('/server/upload_avatar.php', {
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
    
    // Обробник збереження змін профілю
    $(document).on('click', '#saveProfileChanges', function() {
        const userId = userData.id;
        const firstName = $('#edit-first-name').val();
        const lastName = $('#edit-last-name').val();
        const gender = $('#edit-gender').val();
        const age = $('#edit-age').val();
        const education = $('#edit-education').val();
        const nativeLanguage = $('#edit-language').val();
        
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('gender', gender);
        formData.append('age', age);
        formData.append('education', education);
        formData.append('native_language', nativeLanguage);
        
        fetch('/server/update_profile.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Профіль успішно оновлено:", data);
                
                // Оновлюємо дані користувача в localStorage
                fetchUserData(userId).then(updatedData => {
                    // Закриваємо модальне вікно
                    $('#editProfileModal').modal('hide');
                    
                    // Оновлюємо інтерфейс з новими даними
                    updateProfileUI(updatedData);
                    
                    showNotification('Профіль успішно оновлено!', 'success');
                });
            } else {
                console.error('Помилка при оновленні профілю:', data.message);
                showNotification('Помилка при оновленні профілю!', 'error');
            }
        })
        .catch(error => {
            console.error('Помилка при надсиланні даних:', error);
            showNotification('Помилка з\'єднання з сервером!', 'error');
        });
    });
}); 