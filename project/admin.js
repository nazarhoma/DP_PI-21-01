document.addEventListener('DOMContentLoaded', function() {
    // Перевірка ролі користувача
    checkUserRole();

    // Ініціалізація вкладок та панелей
    initSidebar();
    initTabs();
    
    // Завантаження списку курсів
    loadCourses();
    
    // Завантаження відгуків
    loadReviews();
    
    // Завантаження чату
    loadChatUsers();
    
    // Ініціалізація модальних вікон
    initModals();
    
    // Обробники подій для кнопок
    document.getElementById('new-mentors-btn').addEventListener('click', showNewMentors);
    document.getElementById('export-csv').addEventListener('click', exportReviewsToCSV);
    document.getElementById('search-user').addEventListener('input', searchChatUsers);
    
    // Додаємо обробник для кнопки виходу
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Додаю обробники для фільтрів
    const ratingFilter = document.getElementById('rating-filter');
    const hasComment = document.getElementById('has-comment');
    const notAnswered = document.getElementById('not-answered');
    const sortFilter = document.getElementById('sort-filter');
    if (ratingFilter) ratingFilter.addEventListener('change', function() {
        reviewFilters.rating = this.value;
        currentReviewPage = 1;
        renderReviewsPage();
    });
    if (hasComment) hasComment.addEventListener('change', function() {
        reviewFilters.hasComment = this.checked;
        currentReviewPage = 1;
        renderReviewsPage();
    });
    if (notAnswered) notAnswered.addEventListener('change', function() {
        reviewFilters.notAnswered = this.checked;
        currentReviewPage = 1;
        renderReviewsPage();
    });
    if (sortFilter) sortFilter.addEventListener('change', function() {
        reviewFilters.sort = this.value;
        currentReviewPage = 1;
        renderReviewsPage();
    });

    // Додаю ініціалізацію фільтрів при активації вкладки "Відгуки"
    const communicationTabButtons = document.querySelectorAll('.communication-tabs .tab-btn');
    communicationTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (tabName === 'reviews') {
                setTimeout(initReviewFilters, 0);
                setTimeout(renderReviewsPage, 0);
            }
        });
    });
    // Якщо вкладка "Відгуки" активна при завантаженні — ініціалізуємо одразу
    if (document.querySelector('.tab-content[data-tab="reviews"]').classList.contains('active')) {
        setTimeout(initReviewFilters, 0);
        setTimeout(renderReviewsPage, 0);
    }

    // Додаю обробники для чату (винесено з renderChatMessages)
    const sendButton = document.querySelector('.send-btn');
    const messageInput = document.querySelector('.chat-input input');
    if (sendButton && messageInput) {
        sendButton.onclick = function() {
            if (messageInput.value.trim() !== '') {
                sendChatMessage();
            }
        };
        messageInput.onkeypress = function(e) {
            if (e.key === 'Enter' && messageInput.value.trim() !== '') {
                sendChatMessage();
            }
        };
    }
});

// Функція виходу з системи
function logout() {
    // Видаляємо дані користувача з localStorage
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('user_id');
    
    // Показуємо повідомлення
    alert('Ви успішно вийшли з системи');
    
    // Перенаправляємо на сторінку входу
    window.location.href = 'login.html';
}

// Перевірка ролі користувача
function checkUserRole() {
    // Отримання ID користувача з localStorage
    let userId = localStorage.getItem('user_id');
    
    // Якщо не знайдено user_id, спробуємо отримати з userData
    if (!userId) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData && userData.id) {
            userId = userData.id;
            console.log('ID користувача отримано з userData:', userId);
            
            // Якщо роль користувача вже відома як "admin", не потрібно робити запит на сервер
            if (userData.role === 'admin') {
                console.log('Користувач вже має роль адміністратора в localStorage');
                // Встановлюємо ім'я користувача
                getUserInfo(userId);
                return; // Не потрібно робити додатковий запит на сервер
            }
        }
    }
    
    console.log('Перевірка користувача, ID:', userId);
    
    if (!userId) {
        // Якщо користувач не авторизований, перенаправляємо на сторінку логіну
        console.log('Користувач не авторизований, перенаправлення на login.html');
        window.location.href = 'login.html';
        return;
    }
    
    // Запит на сервер для перевірки ролі
    const formData = new FormData();
    formData.append('user_id', userId);
    
    fetch('/server/get_user_role.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Відповідь сервера отримана, статус:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Дані про роль:', data);
        
        if (!data.success || data.role !== 'admin') {
            // Якщо роль не адмін, перенаправляємо на головну сторінку
            console.log('Користувач не є адміністратором, перенаправлення на index.html');
            window.location.href = 'index.html';
        } else {
            // Встановлюємо ім'я користувача
            console.log('Користувач є адміністратором, отримуємо дані');
            getUserInfo(userId);
        }
    })
    .catch(error => {
        console.error('Помилка при перевірці ролі:', error);
        alert('Помилка при перевірці ролі користувача: ' + error.message);
        window.location.href = 'index.html';
    });
}

// Отримання інформації про користувача
function getUserInfo(userId) {
    // Спочатку перевіряємо, чи є дані користувача в localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData && userData.id == userId) {
        console.log('Використовуємо дані користувача з localStorage:', userData);
        
        // Встановлюємо ім'я користувача, якщо воно є
        if (userData.first_name && userData.last_name) {
            document.getElementById('user-name').textContent = userData.first_name + ' ' + userData.last_name;
        } else if (userData.name) {
            document.getElementById('user-name').textContent = userData.name;
        } else {
            document.getElementById('user-name').textContent = 'Admin';
        }
        
        // Завжди встановлюємо дефолтну аватарку для запобігання помилок
        const avatarImg = document.querySelector('.avatar img');
        if (avatarImg) {
            avatarImg.src = 'img/avatars/default-avatar.png';
        }
        
        return; // Не потрібно робити запит на сервер
    }
    
    // Якщо в localStorage даних немає, робимо запит на сервер
    const formData = new FormData();
    formData.append('user_id', userId);
    
    fetch('/server/get_user_data.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Отримані дані користувача:', data);
        if (data.success && data.user) {
            // Встановлюємо ім'я користувача, якщо воно є
            if (data.user.name) {
                document.getElementById('user-name').textContent = data.user.name;
            } else {
                document.getElementById('user-name').textContent = 'Admin';
            }
            
            // Завжди встановлюємо дефолтну аватарку для запобігання помилок
            const avatarImg = document.querySelector('.avatar img');
            if (avatarImg) {
                avatarImg.src = 'img/avatars/default-avatar.png';
            }
        } else {
            console.error('Помилка отримання даних:', data.message || 'Невідома помилка');
        }
    })
    .catch(error => {
        console.error('Помилка при отриманні даних користувача:', error);
    });
}

// Ініціалізація сайдбару
function initSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            
            // Видаляємо активний клас з усіх посилань
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Додаємо активний клас до поточного посилання
            this.classList.add('active');
            
            // Ховаємо всі секції
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Показуємо цільову секцію
            document.getElementById(`${targetSection}-section`).classList.add('active');
        });
    });
}

// Ініціалізація вкладок
function initTabs() {
    // Комунікаційні вкладки
    const communicationTabButtons = document.querySelectorAll('.communication-tabs .tab-btn');
    
    communicationTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Видаляємо активний клас з усіх кнопок вкладок
            communicationTabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Додаємо активний клас до поточної кнопки
            this.classList.add('active');
            
            // Ховаємо всі вкладки
            document.querySelectorAll('.communication-tabs .tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Показуємо цільову вкладку
            document.querySelector(`.communication-tabs .tab-content[data-tab="${tabName}"]`).classList.add('active');
        });
    });
    
    // Вкладки деталей курсу
    const courseTabButtons = document.querySelectorAll('.course-detail-tabs .tab-btn');
    
    courseTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Видаляємо активний клас з усіх кнопок вкладок
            courseTabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Додаємо активний клас до поточної кнопки
            this.classList.add('active');
            
            // Оновлюємо вміст вкладки курсу
            loadCourseTabContent(tabName);
        });
    });
}

// Завантаження курсів
function loadCourses() {
    // Отримання курсів з сервера
    fetch('/server/admin_get_courses.php')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            renderCourses(data.courses);
        } else {
            showMessage('Помилка при завантаженні курсів');
        }
    })
    .catch(error => {
        console.error('Помилка при завантаженні курсів:', error);
    });
}

// Відображення курсів
function renderCourses(courses) {
    const coursesGrid = document.querySelector('.courses-grid');
    coursesGrid.innerHTML = '';
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.classList.add('course-card');
        courseCard.setAttribute('data-course-id', course.id);
        
        courseCard.innerHTML = `
            <div class="course-header">
                <span>Free</span>
            </div>
            <div class="course-body">
                <h3 class="course-title">${course.title}</h3>
                
                <div class="course-stats">
                    <div class="stat-item">
                        <span class="stat-value">${Number(course.price) === 0 || !course.price ? 'Безкоштовно' : Number(course.price).toFixed(2) + ' ₴'}</span>
                        <span class="stat-label">Ціна</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${course.chapters_count || 0}</span>
                        <span class="stat-label">Chapters</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${course.orders_count || 0}</span>
                        <span class="stat-label">Orders</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${course.reviews_count || 0}</span>
                        <span class="stat-label">Reviews</span>
                    </div>
                </div>
            </div>
        `;
        
        // Обробник кліку для карточки курсу
        courseCard.addEventListener('click', function() {
            openCourseModal(course.id);
        });
        
        coursesGrid.appendChild(courseCard);
    });
}

// --- УНІВЕРСАЛЬНА ПАГІНАЦІЯ ---
function renderSmartPagination({container, totalPages, currentPage, onPageChange}) {
    container.innerHTML = '';
    if (totalPages <= 1) return;
    // Кнопка "Попередня"
    const prevButton = document.createElement('button');
    prevButton.textContent = '«';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    });
    container.appendChild(prevButton);
    // Визначаємо діапазон сторінок
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(totalPages, currentPage + 3);
    if (currentPage <= 4) end = Math.min(7, totalPages);
    if (currentPage > totalPages - 4) start = Math.max(1, totalPages - 6);
    for (let i = start; i <= end; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) pageButton.classList.add('active');
        pageButton.addEventListener('click', () => onPageChange(i));
        container.appendChild(pageButton);
    }
    // Поле для вводу номера сторінки (по центру)
    if (totalPages > 7) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 1;
        input.max = totalPages;
        input.value = currentPage;
        input.className = 'pagination-input';
        input.style.width = '50px';
        input.addEventListener('change', () => {
            let val = parseInt(input.value);
            if (isNaN(val) || val < 1) val = 1;
            if (val > totalPages) val = totalPages;
            onPageChange(val);
        });
        container.appendChild(input);
    }
    // Кнопка "Наступна"
    const nextButton = document.createElement('button');
    nextButton.textContent = '»';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    });
    container.appendChild(nextButton);
}
// --- КІНЕЦЬ УНІВЕРСАЛЬНОЇ ПАГІНАЦІЇ ---

// --- ПАГІНАЦІЯ ДЛЯ ВІДГУКІВ ГОЛОВНОЇ ---
let allReviews = [];
let currentReviewPage = 1;
const reviewsPerPage = 10;

// --- ФІЛЬТРИ ДЛЯ ВІДГУКІВ ---
let reviewFilters = {
    rating: 'all',
    hasComment: false,
    notAnswered: false,
    sort: 'newest'
};

function loadReviews() {
    fetch('/server/admin_get_reviews.php')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            allReviews = data.reviews;
            currentReviewPage = 1;
            renderReviewsPage();
        } else {
            showMessage('Помилка при завантаженні відгуків');
        }
    })
    .catch(error => {
        console.error('Помилка при завантаженні відгуків:', error);
    });
}

function renderReviewsPage() {
    // Фільтрація
    let filtered = allReviews.slice();
    if (reviewFilters.rating !== 'all') {
        filtered = filtered.filter(r => String(r.rating) === reviewFilters.rating);
    }
    if (reviewFilters.hasComment) {
        filtered = filtered.filter(r => r.text && r.text.trim().length > 0);
    }
    if (reviewFilters.notAnswered) {
        // Для прикладу: якщо є поле answer або reply, фільтруємо ті, де його немає
        filtered = filtered.filter(r => !r.answer && !r.reply);
    }
    // Сортування
    if (reviewFilters.sort === 'newest') {
        filtered.sort((a, b) => new Date(b.date.split('.').reverse().join('-')) - new Date(a.date.split('.').reverse().join('-')));
    } else {
        filtered.sort((a, b) => new Date(a.date.split('.').reverse().join('-')) - new Date(b.date.split('.').reverse().join('-')));
    }
    const start = (currentReviewPage - 1) * reviewsPerPage;
    const end = start + reviewsPerPage;
    const pageReviews = filtered.slice(start, end);
    renderReviews(pageReviews);
    const pagination = document.querySelector('.pagination');
    renderSmartPagination({
        container: pagination,
        totalPages: Math.ceil(filtered.length / reviewsPerPage),
        currentPage: currentReviewPage,
        onPageChange: (page) => {
            currentReviewPage = page;
            renderReviewsPage();
        }
    });
}
// --- КІНЕЦЬ ПАГІНАЦІЇ ДЛЯ ВІДГУКІВ ГОЛОВНОЇ ---

// Завантаження користувачів для чату
function loadChatUsers() {
    fetch('/server/admin_get_chat_users.php')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            renderChatUsers(data.users);
        } else {
            showMessage('Помилка при завантаженні користувачів чату');
        }
    })
    .catch(error => {
        console.error('Помилка при завантаженні користувачів чату:', error);
    });
}

// Відображення користувачів чату
function renderChatUsers(users) {
    const usersList = document.querySelector('.users-list');
    if (!usersList) {
        console.error('Елемент списку користувачів не знайдено');
        return;
    }
    
    usersList.innerHTML = '';
    
    if (!users || users.length === 0) {
        usersList.innerHTML = '<div class="no-users">Немає доступних користувачів</div>';
        return;
    }
    
    // Сортуємо користувачів за датою останнього повідомлення (спочатку найновіші)
    users = users.slice().sort((a, b) => {
        if (a.last_message_time && b.last_message_time) {
            return new Date(b.last_message_time) - new Date(a.last_message_time);
        } else if (a.last_message_time) {
            return -1;
        } else if (b.last_message_time) {
            return 1;
        } else {
            return 0;
        }
    });
    
    users.forEach(user => {
        if (!user || !user.id) {
            console.warn('Пропускаємо користувача з недійсними даними:', user);
            return;
        }
        const userItem = document.createElement('div');
        userItem.classList.add('user-item');
        userItem.setAttribute('data-user-id', user.id);
        const avatarSrc = user.avatar_url && user.avatar_url !== '' ? user.avatar_url : 'img/avatars/default-avatar.png';
        const userName = user.name || 'Невідомий користувач';
        const userStatus = user.status || 'Student';
        userItem.innerHTML = `
            <img src="${avatarSrc}" alt="${userName}">
            <div class="user-item-details">
                <div class="user-item-name">${userName}</div>
                <div class="user-item-status">${userStatus}</div>
            </div>
            ${user.unread_messages ? `<div class="new-message">${user.unread_messages}</div>` : ''}
        `;
        userItem.addEventListener('click', function() {
            document.querySelectorAll('.user-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            loadChatMessages(user.id);
            updateChatHeader(user);
        });
        usersList.appendChild(userItem);
    });
}

// Пошук користувачів чату
function searchChatUsers() {
    const searchQuery = document.getElementById('search-user').value.toLowerCase();
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const userName = item.querySelector('.user-item-name').textContent.toLowerCase();
        
        if (userName.includes(searchQuery)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Оновлення заголовка чату
function updateChatHeader(user) {
    const chatHeader = document.querySelector('.chat-header');
    if (!chatHeader) {
        console.error('Елемент заголовка чату не знайдено');
        return;
    }
    
    if (!user) {
        console.error('Дані користувача відсутні');
        return;
    }
    
    const userInfoImg = chatHeader.querySelector('.chat-user-info img');
    if (userInfoImg) {
        userInfoImg.src = user.avatar_url && user.avatar_url !== '' ? user.avatar_url : 'img/avatars/default-avatar.png';
    }
    
    const userNameElem = chatHeader.querySelector('.user-name');
    if (userNameElem) {
        userNameElem.textContent = user.name || 'Користувач';
    }
    
    const userStatusElem = chatHeader.querySelector('.user-status');
    if (userStatusElem) {
        userStatusElem.textContent = user.status || 'Student';
    }
    
    // Встановлюємо ID користувача для кнопок дій
    const actionButtons = chatHeader.querySelectorAll('.chat-actions button');
    if (actionButtons && actionButtons.length > 0) {
        actionButtons.forEach(button => {
            button.setAttribute('data-user-id', user.id);
        });
    }
}

// Завантаження повідомлень чату
function loadChatMessages(userId) {
    if (!userId) {
        console.error('ID користувача не вказано для завантаження повідомлень');
        return;
    }
    
    const formData = new FormData();
    formData.append('user_id', userId);
    
    fetch('/server/admin_get_chat_messages.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.messages) {
            renderChatMessages(data.messages);
        } else {
            console.error('Помилка при завантаженні повідомлень:', data.message || 'Невідома помилка');
            showMessage('Помилка при завантаженні повідомлень');
        }
    })
    .catch(error => {
        console.error('Помилка при завантаженні повідомлень:', error);
    });
}

// Відображення повідомлень чату
function renderChatMessages(messages) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) {
        console.error('Елемент контейнера повідомлень не знайдено');
        return;
    }
    
    chatMessages.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = '<div class="no-messages">Немає повідомлень</div>';
        return;
    }
    
    messages.forEach(message => {
        if (!message) return;
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        // Визначаємо, чи це вхідне або вихідне повідомлення
        if (message.is_admin) {
            messageElement.classList.add('message-outgoing');
        } else {
            messageElement.classList.add('message-incoming');
        }
        
        const messageText = message.text || '';
        const messageTime = message.time || '';
        
        messageElement.innerHTML = `
            <div class="message-text">${messageText}</div>
            <div class="message-time">${messageTime}</div>
        `;
        
        chatMessages.appendChild(messageElement);
    });
    
    // Прокручуємо до останнього повідомлення
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Додаємо обробник подій для надсилання повідомлень
    const sendButton = document.querySelector('.send-btn');
    const messageInput = document.querySelector('.chat-input input');
    
    if (sendButton && messageInput) {
        sendButton.onclick = function() {
            if (messageInput.value.trim() !== '') {
                sendChatMessage();
            }
        };
        
        messageInput.onkeypress = function(e) {
            if (e.key === 'Enter' && messageInput.value.trim() !== '') {
                sendChatMessage();
            }
        };
    }
}

// Надсилання повідомлення в чаті
function sendChatMessage() {
    const messageInput = document.querySelector('.chat-input input');
    const message = messageInput.value.trim();
    const activeUser = document.querySelector('.user-item.active');
    
    if (!activeUser) {
        showMessage('Виберіть користувача для відправки повідомлення');
        return;
    }
    
    const userId = activeUser.getAttribute('data-user-id');
    
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('message', message);
    
    fetch('/server/admin_send_message.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Очищаємо поле введення
            messageInput.value = '';
            
            // Оновлюємо повідомлення
            loadChatMessages(userId);
        } else {
            showMessage('Помилка при надсиланні повідомлення');
        }
    })
    .catch(error => {
        console.error('Помилка при надсиланні повідомлення:', error);
    });
}

// Ініціалізація модальних вікон
function initModals() {
    // Отримуємо модальні вікна
    const mentorModal = document.getElementById('mentor-modal');
    const courseModal = document.getElementById('course-modal');
    
    // Отримуємо кнопки закриття
    const closeButtons = document.querySelectorAll('.close');
    
    // Додаємо обробники подій для кнопок закриття
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            mentorModal.style.display = 'none';
            courseModal.style.display = 'none';
        });
    });
    
    // Закриваємо модальне вікно, коли користувач клікає поза ним
    window.addEventListener('click', function(event) {
        if (event.target === mentorModal) {
            mentorModal.style.display = 'none';
        }
        if (event.target === courseModal) {
            courseModal.style.display = 'none';
        }
    });
    
    // Додаємо обробники подій для кнопок в модальних вікнах
    document.getElementById('approve-mentor').addEventListener('click', approveMentor);
    document.getElementById('reject-mentor').addEventListener('click', rejectMentor);
    document.getElementById('delete-course').addEventListener('click', deleteCourse);
}

// Показати нових менторів
function showNewMentors() {
    fetch('/server/admin_get_new_mentors.php')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.mentors.length > 0) {
            showMentorModal(data.mentors[0]);
        } else {
            showMessage('Немає нових заявок від менторів');
        }
    })
    .catch(error => {
        console.error('Помилка при отриманні нових менторів:', error);
    });
}

// Показати модальне вікно ментора
function showMentorModal(mentor) {
    const mentorModal = document.getElementById('mentor-modal');
    const mentorInfo = mentorModal.querySelector('.mentor-info');
    const fullName = [mentor.first_name, mentor.last_name].filter(Boolean).join(' ').trim();
    mentorInfo.innerHTML = `
        <div class="mentor-info-item">
            <label>ПІБ:</label>
            <div class="value">${fullName || 'Не вказано'}</div>
        </div>
        <div class="mentor-info-item">
            <label>Email:</label>
            <div class="value">${mentor.email || 'Не вказано'}</div>
        </div>
        <div class="mentor-info-item">
            <label>Телефон:</label>
            <div class="value">${mentor.phone || 'Не вказано'}</div>
        </div>
        <div class="mentor-info-item">
            <label>Організація:</label>
            <div class="value">${mentor.organization || 'Не вказано'}</div>
        </div>
        <div class="mentor-info-item">
            <label>Опис:</label>
            <div class="value">${mentor.mentor_description || 'Не вказано'}</div>
        </div>
    `;
    // Зберігаємо ID заявки для кнопок прийняття або відхилення
    document.getElementById('approve-mentor').setAttribute('data-mentor-id', mentor.application_id);
    document.getElementById('reject-mentor').setAttribute('data-mentor-id', mentor.application_id);
    // Показуємо модальне вікно
    mentorModal.style.display = 'block';
}

// Прийняти ментора
function approveMentor() {
    const mentorId = this.getAttribute('data-mentor-id');
    
    const formData = new FormData();
    formData.append('mentor_id', mentorId);
    formData.append('status', 'approved');
    
    fetch('/server/admin_update_mentor_status.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Ментора успішно прийнято');
            document.getElementById('mentor-modal').style.display = 'none';
        } else {
            showMessage('Помилка при прийнятті ментора');
        }
    })
    .catch(error => {
        console.error('Помилка при прийнятті ментора:', error);
    });
}

// Відхилити ментора
function rejectMentor() {
    const mentorId = this.getAttribute('data-mentor-id');
    
    const formData = new FormData();
    formData.append('mentor_id', mentorId);
    formData.append('status', 'rejected');
    
    fetch('/server/admin_update_mentor_status.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Заявку ментора відхилено');
            document.getElementById('mentor-modal').style.display = 'none';
        } else {
            showMessage('Помилка при відхиленні ментора');
        }
    })
    .catch(error => {
        console.error('Помилка при відхиленні ментора:', error);
    });
}

// Оновити модальне вікно курсу
function openCourseModal(courseId) {
    const courseModal = document.getElementById('course-modal');
    
    // Завантажуємо інформацію про курс
    fetch(`/server/admin_get_course_details.php?course_id=${courseId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Встановлюємо ID курсу для кнопки видалення
            document.getElementById('delete-course').setAttribute('data-course-id', courseId);
            
            // Завантажуємо вміст активної вкладки
            const activeTab = document.querySelector('.course-detail-tabs .tab-btn.active').getAttribute('data-tab');
            loadCourseTabContent(activeTab, courseId);
            
            // Показуємо модальне вікно
            courseModal.style.display = 'block';
        } else {
            showMessage('Помилка при завантаженні деталей курсу');
        }
    })
    .catch(error => {
        console.error('Помилка при завантаженні деталей курсу:', error);
    });
}

// Завантажити вміст вкладки курсу
function loadCourseTabContent(tabName, courseId) {
    if (!courseId) {
        courseId = document.getElementById('delete-course').getAttribute('data-course-id');
    }
    
    const contentContainer = document.querySelector('.course-detail-content');
    
    // Очищаємо контейнер
    contentContainer.innerHTML = '<div class="loading">Завантаження...</div>';
    
    // Завантажуємо вміст відповідної вкладки
    fetch(`/server/admin_get_course_tab.php?tab=${tabName}&course_id=${courseId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Відображаємо вміст залежно від вкладки
            switch (tabName) {
                case 'course-reviews':
                    renderCourseReviewsTab(data.data);
                    break;
                case 'customers':
                    renderCustomersTab(data.data);
                    break;
                case 'chapters':
                    renderChaptersTab(data.data);
                    break;
            }
        } else {
            contentContainer.innerHTML = '<div class="error">Помилка при завантаженні даних</div>';
        }
    })
    .catch(error => {
        console.error(`Помилка при завантаженні вкладки ${tabName}:`, error);
        contentContainer.innerHTML = '<div class="error">Помилка при завантаженні даних</div>';
    });
}

// --- ПАГІНАЦІЯ ДЛЯ ВІДГУКІВ У МОДАЛЬНОМУ ВІКНІ ---
let modalCourseReviews = [];
let modalCourseReviewPage = 1;
const modalCourseReviewsPerPage = 10;

function renderCourseReviewsTab(data) {
    modalCourseReviews = Array.isArray(data) ? data : [];
    modalCourseReviewPage = 1;
    renderCourseReviewsPage();
}

function renderCourseReviewsPage() {
    const contentContainer = document.querySelector('.course-detail-content');
    if (!modalCourseReviews || modalCourseReviews.length === 0) {
        contentContainer.innerHTML = '<div class="no-data">Немає відгуків для цього курсу</div>';
        return;
    }
    // Сітка по 2 в ряд
    let reviewsHtml = '<div class="course-reviews-list grid-2">';
    const start = (modalCourseReviewPage - 1) * modalCourseReviewsPerPage;
    const end = start + modalCourseReviewsPerPage;
    const pageReviews = modalCourseReviews.slice(start, end);
    pageReviews.forEach(review => {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += i <= review.rating ? '<span>★</span>' : '<span>☆</span>';
        }
        const avatarSrc = 'img/avatars/default-avatar.png';
        reviewsHtml += `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-rating">${starsHtml}</div>
                    <div class="review-actions">
                        <button class="delete-review-modal" data-review-id="${review.id}">✕</button>
                    </div>
                </div>
                <div class="review-author">
                    <img src="${avatarSrc}" alt="${review.user_name}">
                    <div>
                        <div class="author-name">${review.user_name}</div>
                        <div class="author-date">${review.date}</div>
                    </div>
                </div>
                <div class="review-text">${review.text}</div>
            </div>
        `;
    });
    reviewsHtml += '</div>';
    reviewsHtml += '<div class="pagination modal-pagination"></div>';
    contentContainer.innerHTML = reviewsHtml;
    // Додаємо обробники подій для кнопок видалення
    const deleteBtns = contentContainer.querySelectorAll('.delete-review-modal');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const reviewId = this.getAttribute('data-review-id');
            if (confirm('Ви впевнені, що хочете видалити цей відгук?')) {
                deleteReviewFromModal(reviewId);
            }
        });
    });
    // Пагінація
    const pag = contentContainer.querySelector('.modal-pagination');
    renderSmartPagination({
        container: pag,
        totalPages: Math.ceil(modalCourseReviews.length / modalCourseReviewsPerPage),
        currentPage: modalCourseReviewPage,
        onPageChange: (page) => {
            modalCourseReviewPage = page;
            renderCourseReviewsPage();
        }
    });
}
// --- КІНЕЦЬ ПАГІНАЦІЇ ДЛЯ ВІДГУКІВ У МОДАЛЬНОМУ ВІКНІ ---

// Відображення вкладки покупців
function renderCustomersTab(data) {
    const contentContainer = document.querySelector('.course-detail-content');
    
    let customersHtml = `
        <table class="customers-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Користувач</th>
                    <th>Логін</th>
                    <th>Email</th>
                    <th>Дата реєстрації</th>
                    <th>Номер запису</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (Array.isArray(data) && data.length > 0) {
        data.forEach(customer => {
            customersHtml += `
                <tr>
                    <td>${customer.id || ''}</td>
                    <td>${customer.name || ''}</td>
                    <td>${customer.username || ''}</td>
                    <td>${customer.email || ''}</td>
                    <td>${customer.joined_date || ''}</td>
                    <td>${customer.order_number || ''}</td>
                </tr>
            `;
        });
    } else {
        customersHtml += `
            <tr>
                <td colspan="6" style="text-align: center;">Немає покупців для цього курсу</td>
            </tr>
        `;
    }
    
    customersHtml += `
            </tbody>
        </table>
    `;
    
    contentContainer.innerHTML = customersHtml;
}

// Відображення вкладки розділів
function renderChaptersTab(data) {
    const contentContainer = document.querySelector('.course-detail-content');
    
    if (!data || data.length === 0) {
        contentContainer.innerHTML = '<div class="no-data">Немає розділів для цього курсу</div>';
        return;
    }
    
    let chaptersHtml = '<div class="chapters-list">';
    
    data.forEach(chapter => {
        chaptersHtml += `
            <div class="chapter-item">
                <div class="chapter-header">
                    <h3 class="chapter-title">${chapter.title}</h3>
                    <div class="chapter-order">Порядковий номер: ${chapter.order}</div>
                </div>
                <div class="chapter-description">${chapter.description || 'Немає опису'}</div>
                <div class="chapter-resources">Ресурсів: ${chapter.resources_count}</div>
            </div>
        `;
    });
    
    chaptersHtml += '</div>';
    contentContainer.innerHTML = chaptersHtml;
}

// Видалення курсу
function deleteCourse() {
    const courseId = this.getAttribute('data-course-id');
    
    if (confirm('Ви впевнені, що хочете видалити цей курс? Ця дія незворотна.')) {
        const formData = new FormData();
        formData.append('course_id', courseId);
        
        fetch('/server/admin_delete_course.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Курс успішно видалено');
                document.getElementById('course-modal').style.display = 'none';
                
                // Оновлюємо список курсів
                loadCourses();
            } else {
                showMessage('Помилка при видаленні курсу');
            }
        })
        .catch(error => {
            console.error('Помилка при видаленні курсу:', error);
        });
    }
}

// Показати повідомлення
function showMessage(message) {
    alert(message);
}

function renderReviews(reviews) {
    const reviewsList = document.querySelector('.reviews-list');
    reviewsList.innerHTML = '';
    reviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.classList.add('review-item');
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += i <= review.rating ? '<span>★</span>' : '<span>☆</span>';
        }
        const avatarSrc = 'img/avatars/default-avatar.png';
        reviewItem.innerHTML = `
            <div class="review-header">
                <div class="review-rating">${starsHtml}</div>
                <div class="review-actions">
                    <button class="delete-review" data-review-id="${review.id}">✕</button>
                </div>
            </div>
            <div class="review-course">${review.course_title}</div>
            <div class="review-author">
                <img src="${avatarSrc}" alt="User">
                <div>
                    <div class="author-name">${review.user_name}</div>
                    <div class="author-date">${review.date}</div>
                </div>
            </div>
            <div class="review-text">${review.text}</div>
        `;
        reviewItem.querySelector('.delete-review').addEventListener('click', function(e) {
            e.stopPropagation();
            deleteReview(review.id);
        });
        reviewsList.appendChild(reviewItem);
    });
}

let filtersInitialized = false;

function initReviewFilters() {
    if (filtersInitialized) return;
    filtersInitialized = true;
    const ratingFilter = document.getElementById('rating-filter');
    const hasComment = document.getElementById('has-comment');
    const notAnswered = document.getElementById('not-answered');
    const sortFilter = document.getElementById('sort-filter');
    if (ratingFilter) ratingFilter.addEventListener('change', function() {
        reviewFilters.rating = this.value;
        currentReviewPage = 1;
        renderReviewsPage();
    });
    if (hasComment) hasComment.addEventListener('change', function() {
        reviewFilters.hasComment = this.checked;
        currentReviewPage = 1;
        renderReviewsPage();
    });
    if (notAnswered) notAnswered.addEventListener('change', function() {
        reviewFilters.notAnswered = this.checked;
        currentReviewPage = 1;
        renderReviewsPage();
    });
    if (sortFilter) sortFilter.addEventListener('change', function() {
        reviewFilters.sort = this.value;
        currentReviewPage = 1;
        renderReviewsPage();
    });
}

function exportReviewsToCSV() {
    fetch('/server/admin_export_reviews.php')
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'reviews.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('Помилка при експорті відгуків:', error);
    });
} 