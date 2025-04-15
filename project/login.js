document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    fetch('http://localhost/login.php', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            console.log('Сервер надіслав:', data.message);

            if (data.message === 'Авторизація успішна!') {
                alert('Авторизація успішна!');
                localStorage.setItem('user_id', data.user.id);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('email', data.user.email);
                window.location.href = 'index.html';
            } else {
                alert('Помилка: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Помилка:', error);
            alert('Сталася помилка при відправці форми.');
        });
});