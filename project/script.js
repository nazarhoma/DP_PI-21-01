document.addEventListener('DOMContentLoaded', () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const navMenu = document.querySelector('.nav-menu');
    burgerMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    const searchBtn = document.querySelector('.search-btn');
    const searchBar = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar-input');
    searchBtn.addEventListener('click', () => {
        searchBar.style.display = 'flex';
        searchBtn.style.display = 'none';
        searchInput.focus();
    });
    searchInput.addEventListener('blur', () => {
        searchBar.style.display = 'none';
        searchBtn.style.display = 'block';
    });

    const commentsContainer = document.querySelector('.comments-list');
    const leftButton = document.querySelector('.comments-button-left');
    const rightButton = document.querySelector('.comments-button-right');
    const card = document.querySelector('.comment-card');
    if (commentsContainer && leftButton && rightButton && card) {
        const scrollAmount = card.offsetWidth + 8;

        leftButton.addEventListener('click', () => {
            commentsContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        rightButton.addEventListener('click', () => {
            commentsContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }

    const courseList = document.querySelector('.courses-list');
    if (courseList) {
        function manageRowVisibility() {
            const courseList = document.querySelector('.courses-list');
            const cards = Array.from(courseList.children);
            const containerWidth = courseList.clientWidth;
            const cardStyle = getComputedStyle(cards[0]);
            const cardWidth = cards[0].offsetWidth + parseInt(cardStyle.marginRight) + parseInt(cardStyle.marginLeft);
            const cardsPerRow = Math.floor(containerWidth / cardWidth);
            cards.forEach((card, index) => {
                const rowNumber = Math.floor(index / cardsPerRow);
                if (rowNumber > 0) {
                    card.style.display = index >= cardsPerRow && index < cardsPerRow * 2 && cards.slice(cardsPerRow, cardsPerRow * 2).length < cardsPerRow
                        ? 'none'
                        : 'flex';
                }
            });
        }
        window.addEventListener('load', manageRowVisibility);
        window.addEventListener('resize', manageRowVisibility);
    }

    function goToLogin() {
        window.location.href = "login.html";
    }

    function goToSignup() {
        window.location.href = "signup.html";
    }

    function goToCategories() {
        window.location.href = "category.html";
    }

    // Отримуємо елементи та перевіряємо їх наявність перед додаванням обробників подій
    const logInButton = document.getElementById("logInButton");
    const signUpButton = document.getElementById("signUpButton");
    const categoryButton = document.getElementById("sea-all-categories");
    const cursesButton = document.getElementById("sea-all-curses");
    const instructorsButton = document.getElementById("sea-all-instructors");

    if (logInButton) logInButton.addEventListener("click", goToLogin);
    if (signUpButton) signUpButton.addEventListener("click", goToSignup);
    if (categoryButton) categoryButton.addEventListener("click", goToCategories);
    if (cursesButton) cursesButton.addEventListener("click", goToCategories);
    if (instructorsButton) instructorsButton.addEventListener("click", goToCategories);

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

    // Функція для перевірки авторизації
    function checkAuth() {
        const token = localStorage.getItem('userToken');
        const profileSection = document.querySelector('.profile-section');
        const loginBtn = document.getElementById('logInButton');
        const signupBtn = document.getElementById('signUpButton');
        const teachLink = document.querySelector('.teach-link');
        const headerAvatarImg = document.querySelector('.profile-avatar');
        
        if (token) {
            // Користувач авторизований
            profileSection.style.display = 'block';
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            
            // Отримуємо дані користувача
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            // Оновлюємо дані користувача з сервера, якщо є ID
            if (userData.id) {
                // Отримуємо свіжі дані з сервера
                fetchUserData(userData.id)
                    .then(updatedData => {
                        // Оновлюємо інтерфейс з актуальними даними
                        const profileName = document.querySelector('.profile-name');
                        if (profileName) {
                            profileName.textContent = formatFullName(updatedData);
                        }
                        
                        // Встановлюємо аватар, якщо він є
                        if (headerAvatarImg && updatedData.avatar) {
                            const avatarUrl = getFullAvatarUrl(updatedData.avatar);
                            headerAvatarImg.src = avatarUrl;
                        }
                        
                        // Отримуємо актуальну роль та оновлюємо інтерфейс
                        updateUIBasedOnRole(updatedData.role || 'student');
                    })
                    .catch(error => {
                        console.error('Помилка при оновленні даних користувача:', error);
                        
                        // У разі помилки використовуємо дані з localStorage
                        const profileName = document.querySelector('.profile-name');
                        if (profileName && userData.name) {
                            profileName.textContent = formatFullName(userData);
                        }
                        
                        // Встановлюємо аватар з localStorage, якщо він є
                        if (headerAvatarImg && userData.avatar) {
                            const avatarUrl = getFullAvatarUrl(userData.avatar);
                            headerAvatarImg.src = avatarUrl;
                        }
                        
                        // Оновлюємо UI відповідно до ролі з localStorage
                        updateUIBasedOnRole(userData.role || 'student');
                    });
            } else {
                // Якщо немає ID, використовуємо дані з localStorage
                const profileName = document.querySelector('.profile-name');
                if (profileName && userData.name) {
                    profileName.textContent = formatFullName(userData);
                }
                
                // Встановлюємо аватар з localStorage, якщо він є
                if (headerAvatarImg && userData.avatar) {
                    const avatarUrl = getFullAvatarUrl(userData.avatar);
                    headerAvatarImg.src = avatarUrl;
                }
                
                // Оновлюємо UI відповідно до ролі з localStorage
                updateUIBasedOnRole(userData.role || 'student');
            }
        } else {
            // Користувач не авторизований
            profileSection.style.display = 'none';
            loginBtn.style.display = 'block';
            signupBtn.style.display = 'block';
            
            // Скидаємо аватар до дефолтного
            if (headerAvatarImg) {
                headerAvatarImg.src = 'img/default-avatar.png';
            }
            
            // Приховуємо кнопку "Викладати на Byway" для незареєстрованих користувачів
            if (teachLink) teachLink.style.display = 'none';
        }
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
    
    // Закриття модального вікна верифікації
    const closeVerificationBtn = document.getElementById('closeVerificationModal');
    if (closeVerificationBtn) {
        closeVerificationBtn.addEventListener('click', function() {
            document.getElementById('verificationModal').style.display = 'none';
        });
    }
    
    // Обробка відправки форми верифікації
    const verificationForm = document.getElementById('verificationForm');
    if (verificationForm) {
        verificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (!userData.id) {
                alert('Помилка: Неможливо ідентифікувати користувача. Будь ласка, увійдіть заново.');
                return;
            }
            
            const formData = new FormData();
            formData.append('user_id', userData.id);
            
            fetch('http://localhost/update_role.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Оновлюємо роль у локальному сховищі
                    userData.role = 'mentor';
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // Оновлюємо UI
                    updateUIBasedOnRole('mentor');
                    
                    // Закриваємо модальне вікно
                    document.getElementById('verificationModal').style.display = 'none';
                    
                    // Показуємо повідомлення про успіх
                    alert('Ваш аккаунт успішно змінено на менторський!');
                } else {
                    alert('Помилка: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Помилка:', error);
                alert('Виникла помилка під час обробки запиту.');
            });
        });
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
        return fullUrl;
    }

    // Обробник виходу з системи
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Скидаємо аватар до дефолтного перед видаленням даних
            const headerAvatarImg = document.querySelector('.profile-avatar');
            if (headerAvatarImg) {
                headerAvatarImg.src = 'img/default-avatar.png';
            }
            
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            window.location.reload();
        });
    }
    
    // Перевіряємо авторизацію при завантаженні сторінки
    checkAuth();
    
    // Закриття модального вікна при кліці поза ним
    window.onclick = function(event) {
        const verificationModal = document.getElementById('verificationModal');
        if (event.target === verificationModal) {
            verificationModal.style.display = 'none';
        }
        
        // Існуючий код для інших модальних вікон
        const contactModal = document.getElementById('contactModal');
        const confirmationModal = document.getElementById('confirmationModal');
        const closeModalConfirm = document.getElementById('closeModalConfirm');
        
        if (event.target === contactModal) {
            closeModalConfirm.style.display = 'block';
        }
        if (event.target === confirmationModal || event.target === closeModalConfirm) {
            confirmationModal.style.display = 'none';
            closeModalConfirm.style.display = 'none';
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
                    console.log("Отримано дані користувача з БД:", data.user_data);
                    
                    // Отримуємо поточні дані користувача, якщо вони є
                    const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                    console.log("Поточні дані в localStorage:", currentUserData);
                    
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
                    
                    console.log("Оновлені дані для localStorage:", updatedUserData);
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                    
                    // Повертаємо оновлені дані користувача
                    resolve(updatedUserData);
                } else {
                    console.error("Помилка отримання даних:", data.message);
                    reject(new Error(data.message || 'Не вдалося отримати дані користувача'));
                }
            })
            .catch(error => {
                console.error('Помилка при отриманні даних користувача:', error);
                reject(error);
            });
        });
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
});

