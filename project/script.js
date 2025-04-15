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

    document.getElementById("logInButton").addEventListener("click", goToLogin);
    document.getElementById("signUpButton").addEventListener("click", goToSignup);
    document.getElementById("sea-all-categories").addEventListener("click", goToCategories);
    document.getElementById("sea-all-curses").addEventListener("click", goToCategories);
    document.getElementById("sea-all-instructors").addEventListener("click", goToCategories);

    // Функція для перевірки авторизації
    function checkAuth() {
        const token = localStorage.getItem('userToken');
        const profileSection = document.querySelector('.profile-section');
        const loginBtn = document.getElementById('logInButton');
        const signupBtn = document.getElementById('signUpButton');
        
        if (token) {
            // Користувач авторизований
            profileSection.style.display = 'block';
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            
            // Отримуємо дані користувача
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const profileName = document.querySelector('.profile-name');
            if (profileName && userData.name) {
                profileName.textContent = userData.name;
            }
            
            // Перевіряємо роль користувача і відповідно змінюємо кнопки
            updateUIBasedOnRole(userData.role || 'student');
        } else {
            // Користувач не авторизований
            profileSection.style.display = 'none';
            loginBtn.style.display = 'block';
            signupBtn.style.display = 'block';
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

    // Обробник виходу з системи
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
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
});

