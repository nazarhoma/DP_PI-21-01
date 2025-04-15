document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    fetch('http://localhost/register.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log('Сервер надіслав:', data.message);
            if (data.message === 'Електронна пошта вже використовується') {
                alert('Ця електронна пошта вже зареєстрована!');
            } else if (data.message === 'Логін вже використовується') {
                alert('Цей логін вже зареєстрований!');
            } else if (data.message === 'Користувач успішно зареєстрований') {
                alert('Реєстрація успішна!');
                window.location.href = 'login.html';
            } else {
                alert('Сталася помилка: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert('Сталася помилка при відправці форми.');
        });
});