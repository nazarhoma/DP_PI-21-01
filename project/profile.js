document.addEventListener('DOMContentLoaded', function() {
    // Перевіряємо, чи користувач авторизований
    const token = localStorage.getItem('userToken');
    if (!token) {
        // Якщо користувач не авторизований, перенаправляємо на сторінку входу
        window.location.href = 'login.html';
        return;
    }
    
    // Отримуємо дані користувача
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Заповнюємо дані профілю
    document.getElementById('profile-username').textContent = userData.name || 'Не вказано';
    document.getElementById('profile-email').textContent = userData.email || 'Не вказано';
    
    // Встановлюємо дату реєстрації (можна додати в userData при реєстрації)
    const registrationDate = new Date().toLocaleDateString('uk-UA');
    document.getElementById('profile-registration-date').textContent = registrationDate;
    
    // Відображаємо роль користувача
    const role = userData.role || 'student';
    const roleText = role === 'mentor' ? 'Ментор' : 'Студент';
    document.getElementById('profile-role').textContent = roleText;
    
    // Оновлюємо ім'я в хедері
    const profileName = document.querySelector('.profile-name');
    if (profileName && userData.name) {
        profileName.textContent = userData.name;
    }
    
    // Оновлюємо UI елементи відповідно до ролі
    updateUIBasedOnRole(role);
    
    // Обробник для кнопки "Редагувати профіль"
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            alert('Функція редагування профілю буде доступна найближчим часом');
        });
    }
    
    // Обробник для кнопки "Змінити пароль"
    const changePasswordBtn = document.querySelector('.change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            alert('Функція зміни паролю буде доступна найближчим часом');
        });
    }
    
    // Обробник для кнопки "Змінити аватар"
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            alert('Функція зміни аватара буде доступна найближчим часом');
        });
    }
    
    // Обробник для кнопки "Вийти"
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        });
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
}); 