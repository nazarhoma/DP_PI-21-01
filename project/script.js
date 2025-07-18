document.addEventListener('DOMContentLoaded', () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const navMenu = document.querySelector('.nav-menu');
    burgerMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    const searchBtn = document.querySelector('.search-btn');
    const searchBar = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar-input');
    
    // Перевіряємо розмір екрану перед додаванням слухачів подій
    function isMobileDevice() {
        return window.innerWidth <= 768;
    }
    
    // Функція для оновлення видимості пошукового рядка при зміні розміру вікна
    function updateSearchBarVisibility() {
        if (!isMobileDevice()) {
            // На великих екранах пошук завжди видимий
            searchBar.style.display = 'flex';
            searchBtn.style.display = 'none';
        } else {
            // На мобільних пристроях пошук схований
            searchBar.style.display = 'none';
            searchBtn.style.display = 'block';
        }
    }
    
    // Викликаємо при завантаженні
    updateSearchBarVisibility();
    
    // І також при зміні розміру вікна
    window.addEventListener('resize', updateSearchBarVisibility);
    
    // Додаємо слухачі лише для мобільних пристроїв
    searchBtn.addEventListener('click', () => {
        if (isMobileDevice()) {
            searchBar.style.display = 'flex';
            searchBtn.style.display = 'none';
            searchInput.focus();
        }
    });
    
    searchInput.addEventListener('blur', () => {
        if (isMobileDevice() && searchInput.value.trim() === '') {
            searchBar.style.display = 'none';
            searchBtn.style.display = 'block';
        }
    });
    
    // Приховуємо пошукову форму при натисканні Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isMobileDevice()) {
            if (searchBar && searchBtn) {
                searchBar.style.display = 'none';
                searchBtn.style.display = 'block';
            }
        }
    });
    
    // Додаємо обробник пошуку
    const searchForm = document.querySelector('.form-search');
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const query = searchInput.value.trim();
            
            if (query) {
                // Перенаправляємо на сторінку пошуку з параметром
                window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
            }
        });
    }

    // Ініціалізуємо кнопки прокрутки для блоку коментарів
    function initializeCommentSlider() {
        const commentsContainer = document.querySelector('.comments-list');
        const leftButton = document.querySelector('.comments-button-left');
        const rightButton = document.querySelector('.comments-button-right');
        
        if (commentsContainer && leftButton && rightButton) {
            const cards = commentsContainer.querySelectorAll('.comment-card');
            if (cards.length === 0) {
                setTimeout(initializeCommentSlider, 500);
                return;
            }
            
            const scrollAmount = cards[0].offsetWidth + 8;

            leftButton.addEventListener('click', () => {
                commentsContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });

            rightButton.addEventListener('click', () => {
                commentsContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    }
    
    // Додаємо спостерігач за змінами в DOM для ініціалізації слайдера після завантаження коментарів
    const commentsObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Перевіряємо чи додалися карточки коментарів
                initializeCommentSlider();
                break;
            }
        }
    });
    
    const commentsContainer = document.querySelector('.comments-list');
    if (commentsContainer) {
        commentsObserver.observe(commentsContainer, { childList: true });
        // Також спробуємо ініціалізувати слайдер відразу
        initializeCommentSlider();
    }

    const courseList = document.querySelector('.courses-list');
    if (courseList) {
        // Видалено функцію manageRowVisibility, оскільки вона створює проблему з пробілами в сітці
        // Тепер використовується CSS Grid в файлі jsonLoader.js
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
            if (profileSection) profileSection.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'none';
            if (signupBtn) signupBtn.style.display = 'none';
            
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
                            headerAvatarImg.onerror = function() {
                                console.log("Помилка завантаження аватару в хедері. Використовую запасний аватар.");
                                this.src = 'img/avatars/default-avatar.png';
                                this.onerror = null; // Запобігаємо зациклюванню
                            };
                        } else if (headerAvatarImg) {
                            headerAvatarImg.src = 'img/avatars/default-avatar.png';
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
                            headerAvatarImg.onerror = function() {
                                console.log("Помилка завантаження аватару в хедері. Використовую запасний аватар.");
                                this.src = 'img/avatars/default-avatar.png';
                                this.onerror = null; // Запобігаємо зациклюванню
                            };
                        } else if (headerAvatarImg) {
                            headerAvatarImg.src = 'img/avatars/default-avatar.png';
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
                    headerAvatarImg.onerror = function() {
                        console.log("Помилка завантаження аватару в хедері. Використовую запасний аватар.");
                        this.src = 'img/avatars/default-avatar.png';
                        this.onerror = null; // Запобігаємо зациклюванню
                    };
                } else if (headerAvatarImg) {
                    headerAvatarImg.src = 'img/avatars/default-avatar.png';
                }
                
                // Оновлюємо UI відповідно до ролі з localStorage
                updateUIBasedOnRole(userData.role || 'student');
            }
        } else {
            // Користувач не авторизований
            if (profileSection) profileSection.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
            if (signupBtn) signupBtn.style.display = 'block';
            
            // Скидаємо аватар до дефолтного
            if (headerAvatarImg) {
                headerAvatarImg.src = 'img/avatars/default-avatar.png';
            }
            
            // Приховуємо кнопку "Викладати на Byway" для незареєстрованих користувачів
            if (teachLink) teachLink.style.display = 'none';
        }
    }
    
    // Оновлення UI елементів відповідно до ролі користувача
    function updateUIBasedOnRole(role) {
        const teachLink = document.querySelector('.teach-link');
        const addCourseLink = document.querySelector('.add-course-link');
        
        // Верхній банер - кнопка "Почати шлях інструктора"
        const bannerButton = document.querySelector('.banner-button');
        const instructorPathButton = document.getElementById('instructorPathButton');
        
        // Нижній банер "Стань інструктором" та його кнопка
        const firstLastBanner = document.querySelector('.last-banners .last-banner:first-child');
        const lastBannerButton = document.querySelector('.last-banner-button');
        const startCareerButton = document.getElementById('startCareerButton');
        
        // Елементи меню профілю користувача
        const profileMenu = document.querySelector('.profile-menu');
        
        // Перевіряємо, чи авторизований користувач
        const token = localStorage.getItem('userToken');
        
        if (!token) {
            console.log("updateUIBasedOnRole: користувач не авторизований");
            
            // Для неавторизованих користувачів встановлюємо прямі посилання на login.html
            if (bannerButton) {
                bannerButton.href = "login.html";
            }
            
            if (lastBannerButton) {
                lastBannerButton.href = "login.html";
            }
            
            // Приховуємо посилання на реєстрацію як ментор
            if (teachLink) teachLink.style.display = 'none';
            
            // Приховуємо посилання на додавання курсу
            if (addCourseLink) addCourseLink.style.display = 'none';
            
            return; // Припиняємо виконання функції
        }
        
        console.log("updateUIBasedOnRole: користувач авторизований, роль:", role);
        
        // Додаємо базові пункти меню для всіх ролей
        if (profileMenu) {
            // Очищаємо меню перед додаванням нових пунктів
            profileMenu.innerHTML = '';
            
            // Додаємо базові пункти для всіх користувачів
            const profileLink = document.createElement('a');
            profileLink.href = 'profile.html';
            profileLink.className = 'profile-menu-item';
            profileLink.textContent = 'Мій профіль';
            profileMenu.appendChild(profileLink);
            
            const chatLink = document.createElement('a');
            chatLink.href = 'chats.html';
            chatLink.className = 'profile-menu-item';
            chatLink.textContent = 'Чат';
            profileMenu.appendChild(chatLink);
        }
        
        // Додаємо різні пункти меню залежно від ролі
        if (role === 'admin' && profileMenu) {
            // Додаємо "Адмін панель" для адміністраторів
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.className = 'profile-menu-item admin-link';
            adminLink.textContent = 'Адмін панель';
            profileMenu.appendChild(adminLink);
            
            // Додаємо "Мої курси" для адміністраторів (як у менторів)
            const coursesLink = document.createElement('a');
            coursesLink.href = 'mentor-courses.html';
            coursesLink.className = 'profile-menu-item';
            coursesLink.textContent = 'Мої курси';
            profileMenu.appendChild(coursesLink);
        }
        
        if (role === 'mentor' && profileMenu) {
            // Додаємо "Мої курси" для менторів
            const coursesLink = document.createElement('a');
            coursesLink.href = 'mentor-courses.html';
            coursesLink.className = 'profile-menu-item';
            coursesLink.textContent = 'Мої курси';
            profileMenu.appendChild(coursesLink);
        }
        
        // Додаємо кнопку "Вийти" в кінці меню для всіх ролей
        if (profileMenu) {
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.className = 'profile-menu-item logout';
            logoutLink.textContent = 'Вийти';
            profileMenu.appendChild(logoutLink);
            
            // Додаємо функціонал кнопки "Вийти"
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('userToken');
                localStorage.removeItem('userData');
                window.location.reload();
            });
        }
        
        if (role === 'mentor') {
            // Ховаємо посилання на реєстрацію як ментор
            if (teachLink) teachLink.style.display = 'none';
            
            // Показуємо посилання на додавання курсу
            if (addCourseLink) addCourseLink.style.display = 'inline-block';
            
            // Змінюємо верхню кнопку банера для менторів
            if (bannerButton) {
                bannerButton.href = 'new-course.html';
                if (bannerButton.querySelector('.button-text')) {
                    bannerButton.querySelector('.button-text').textContent = 'Створити новий курс';
                }
            }
            
            // Приховуємо нижній банер "Стань інструктором" для менторів
            if (firstLastBanner) {
                firstLastBanner.style.display = 'none';
            }
        } else {
            // Показуємо посилання на реєстрацію як ментор
            if (teachLink) {
                teachLink.style.display = 'inline-block';
                
                // Додаємо обробник для відкриття модального вікна верифікації
                const newTeachLink = teachLink.cloneNode(true);
                teachLink.parentNode.replaceChild(newTeachLink, teachLink);
                newTeachLink.addEventListener('click', openVerificationModal);
            }
            
            // Ховаємо посилання на додавання курсу
            if (addCourseLink) addCourseLink.style.display = 'none';
            
            // Змінюємо верхню кнопку банера для звичайних користувачів
            if (bannerButton) {
                bannerButton.removeAttribute('href'); // Видаляємо пряме посилання
                if (bannerButton.querySelector('.button-text')) {
                    bannerButton.querySelector('.button-text').textContent = 'Почати шлях інструктора';
                }
                
                // Очищуємо всі існуючі обробники
                const newBannerButton = bannerButton.cloneNode(true);
                bannerButton.parentNode.replaceChild(newBannerButton, bannerButton);
                
                // Додаємо обробник для модального вікна
                newBannerButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    openVerificationModal();
                });
            }
            
            // Показуємо нижній банер "Стань інструктором" для звичайних користувачів
            if (firstLastBanner) {
                firstLastBanner.style.display = 'flex';
            }
            
            // Налаштовуємо кнопку в нижньому банері
            if (lastBannerButton) {
                lastBannerButton.removeAttribute('href'); // Видаляємо пряме посилання
                
                // Очищуємо всі існуючі обробники
                const newLastBannerButton = lastBannerButton.cloneNode(true);
                lastBannerButton.parentNode.replaceChild(newLastBannerButton, lastBannerButton);
                
                // Додаємо обробник для модального вікна
                newLastBannerButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    openVerificationModal();
                });
            }
        }
    }
    
    // Відкриття модального вікна верифікації
    function openVerificationModal() {
        // Перевіряємо, чи користувач авторизований
        const token = localStorage.getItem('userToken');
        if (!token) {
            // Якщо користувач не авторизований, перенаправляємо на сторінку входу
            console.log("Користувач не авторизований, перенаправляємо на login.html");
            window.location.href = "login.html";
            return;
        }
        
        // Якщо користувач авторизований, відкриваємо модальне вікно
        const modal = document.getElementById('verificationModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
        }
    }
    
    // Закриття модального вікна верифікації
    const closeVerificationBtn = document.getElementById('closeVerificationModal');
    if (closeVerificationBtn) {
        closeVerificationBtn.addEventListener('click', function() {
            const modal = document.getElementById('verificationModal');
            modal.style.display = 'none';
            modal.classList.remove('show');
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
            const phone = document.getElementById('mentor-phone').value.trim();
            const organization = document.getElementById('mentor-organization').value.trim();
            const mentorDescription = document.getElementById('mentor-description').value.trim();
            if (!phone || !organization || !mentorDescription) {
                alert('Будь ласка, заповніть всі поля форми.');
                return;
            }
            const formData = new FormData();
            formData.append('user_id', userData.id);
            formData.append('phone', phone);
            formData.append('organization', organization);
            formData.append('mentor_description', mentorDescription);
            fetch('/server/mentor_application.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('verificationModal').style.display = 'none';
                    alert('Ваша заявка на менторство успішно відправлена! Очікуйте рішення адміністратора.');
                } else {
                    alert('Помилка: ' + (data.message || 'Не вдалося відправити заявку.'));
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
        if (!avatar || avatar === '') {
            // Якщо аватар не вказано, повертаємо дефолтний
            return 'img/avatars/default-avatar.png';
        }
        
        // Якщо аватар вже містить повний URL, повертаємо його
        if (avatar.startsWith('http')) {
            return avatar;
        }
        
        // Видаляємо початковий слеш, якщо він є
        if (avatar.startsWith('/')) {
            avatar = avatar.substring(1);
        }
        
        // Повертаємо шлях до аватару як є
        return avatar;
    }

    // Обробник виходу з системи
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Скидаємо аватар до дефолтного перед видаленням даних
            const headerAvatarImg = document.querySelector('.profile-avatar');
            if (headerAvatarImg) {
                headerAvatarImg.src = 'img/avatars/default-avatar.png';
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
            verificationModal.classList.remove('show');
        }
        
        // Існуючий код для інших модальних вікон
        const contactModal = document.getElementById('contactModal');
        const confirmationModal = document.getElementById('confirmationModal');
        const closeModalConfirm = document.getElementById('closeModalConfirm');
        
        if (event.target === contactModal) {
            closeModalConfirm.style.display = 'flex';
            closeModalConfirm.classList.add('show');
        }
        if (event.target === confirmationModal || event.target === closeModalConfirm) {
            confirmationModal.style.display = 'none';
            confirmationModal.classList.remove('show');
            closeModalConfirm.style.display = 'none';
            closeModalConfirm.classList.remove('show');
        }
    }

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
                    
                    // Перевіряємо, чи є у відповіді дані користувача
                    if (!data.user) {
                        console.error("Отримано успішну відповідь, але дані користувача відсутні");
                        reject(new Error('Дані користувача відсутні у відповіді сервера'));
                        return;
                    }
                    
                    // Отримуємо поточні дані користувача, якщо вони є
                    const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
                    console.log("Поточні дані в localStorage:", currentUserData);
                    
                    // Зберігаємо повні дані користувача
                    const updatedUserData = {
                        ...currentUserData,
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

