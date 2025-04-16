// Функція для перевірки авторизації користувача
function checkAuth() {
    const token = localStorage.getItem('userToken');
    const profileSection = document.querySelector('.profile-section');
    const loginBtn = document.getElementById('logInButton');
    const signupBtn = document.getElementById('signUpButton');
    const teachLink = document.querySelector('.teach-link');
    
    if (token) {
        // Користувач авторизований
        if (profileSection) {
            profileSection.style.display = 'block';
        }
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        if (signupBtn) {
            signupBtn.style.display = 'none';
        }
        
        // Отримуємо дані користувача
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const profileName = document.querySelector('.profile-name');
        if (profileName && userData.name) {
            profileName.textContent = userData.name;
        }
        
        // Показуємо посилання на реєстрацію як ментор для звичайних користувачів
        if (teachLink && userData.role !== 'mentor') {
            teachLink.style.display = 'inline-block';
        } else if (teachLink && userData.role === 'mentor') {
            teachLink.style.display = 'none';
        }
        
        // Показуємо посилання на додавання курсу для менторів
        const addCourseLink = document.querySelector('.add-course-link');
        if (addCourseLink && userData.role === 'mentor') {
            addCourseLink.style.display = 'inline-block';
        }
    } else {
        // Користувач не авторизований
        if (profileSection) {
            profileSection.style.display = 'none';
        }
        if (loginBtn) {
            loginBtn.style.display = 'block';
        }
        if (signupBtn) {
            signupBtn.style.display = 'block';
        }
        
        // Приховуємо кнопку "Викладати на Byway" для незареєстрованих користувачів
        if (teachLink) {
            teachLink.style.display = 'none';
        }
        
        // Приховуємо посилання на додавання курсу
        const addCourseLink = document.querySelector('.add-course-link');
        if (addCourseLink) {
            addCourseLink.style.display = 'none';
        }
    }
}

// Обробник виходу з системи
document.addEventListener('DOMContentLoaded', function() {
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
}); 