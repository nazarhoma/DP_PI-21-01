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
    
    // Оновлюємо ім'я в хедері
    const profileName = document.querySelector('.profile-name');
    if (profileName && userData.name) {
        profileName.textContent = userData.name;
    }
    
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
}); 