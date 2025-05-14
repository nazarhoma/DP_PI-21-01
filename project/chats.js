document.addEventListener('DOMContentLoaded', () => {
  // Перевірка авторизації
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (!userData.id) {
    window.location.href = 'login.html';
    return;
  }

  let currentChatId = null;
  const currentUserId = userData.id;
  let lastMessageId = 0;
  let chatUpdateInterval = null;
  const CHAT_UPDATE_INTERVAL = 5000; // Оновлювати чат кожні 5 секунд
  
  console.log("Поточний користувач:", userData);

  // Додаємо параметр для уникнення кешування
  const getNoCacheParam = () => `v=${Date.now()}`;

  // Перевіряємо чи є параметр mentor_id в URL (для переходу з сторінки курсу)
  const urlParams = new URLSearchParams(window.location.search);
  const mentorIdFromUrl = urlParams.get('mentor_id');
  
  // Елемент для відображення статусу завантаження
  const usersListElement = document.querySelector('.chats-users-list');
  usersListElement.innerHTML = '<p>Завантаження співрозмовників...</p>';

  // Адаптуємо базовий URL залежно від середовища
  const isProduction = window.location.hostname !== 'localhost';
  const baseUrl = isProduction ? '' : 'http://localhost:8080';

  // Елементи чату
  const chatHeader = document.querySelector('.chat-header');
  const chatMessages = document.querySelector('.chat-messages');
  const chatUserName = document.querySelector('.chat-user-name');
  const chatUserAvatar = document.querySelector('.chat-user-avatar');
  const chatInputBlock = document.querySelector('.chat-input-block');
  const chatInput = document.querySelector('.chat-input');
  const sendChatBtn = document.querySelector('.send-chat-btn');
  const chatToggleBtn = document.querySelector('.chat-toggle-users');
  const usersListBlock = document.querySelector('.chats-users-list-block');

  // Обробник кнопки перемикання списку користувачів (для мобільних)
  chatToggleBtn.addEventListener('click', () => {
    usersListBlock.classList.toggle('active');
    if (usersListBlock.classList.contains('active')) {
      chatToggleBtn.textContent = 'Сховати список';
    } else {
      chatToggleBtn.textContent = 'Список чатів';
    }
  });

  // Початкове налаштування для мобільних пристроїв
  function initMobileView() {
    if (window.innerWidth <= 900) {
      usersListBlock.classList.remove('active');
    } else {
      usersListBlock.classList.remove('active');
      chatToggleBtn.style.display = 'none';
    }
  }

  initMobileView();
  window.addEventListener('resize', initMobileView);

  // Завантаження списку співрозмовників
  function loadChatUsers() {
    const formData = new FormData();
    formData.append('user_id', currentUserId);
    
    fetch(`${baseUrl}/server/get_user_chats.php?${getNoCacheParam()}`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP помилка: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Отримано список співрозмовників:", data);
      
      if (data.success) {
        displayChatUsers(data.users);
        
        // Якщо є mentor_id в URL, автоматично відкриваємо чат з цим ментором
        if (mentorIdFromUrl) {
          const mentorItem = document.querySelector(`.chat-user-item[data-user-id="${mentorIdFromUrl}"]`);
          if (mentorItem) {
            mentorItem.click();
          }
        }
      } else {
        usersListElement.innerHTML = `<p>Помилка: ${data.message}</p>`;
      }
    })
    .catch(error => {
      console.error("Помилка при отриманні списку чатів:", error);
      usersListElement.innerHTML = `<p>Не вдалося завантажити список співрозмовників. Спробуйте пізніше.</p>`;
    });
  }

  // Відображення списку співрозмовників
  function displayChatUsers(users) {
    if (!users || users.length === 0) {
      usersListElement.innerHTML = '<p>У вас немає активних чатів</p>';
      return;
    }

    usersListElement.innerHTML = '';
    users.forEach(user => {
      const userItem = document.createElement('div');
      userItem.classList.add('chat-user-item');
      userItem.dataset.userId = user.id;

      const avatarUrl = user.avatar || 'img/avatars/default-avatar.png';
      
      userItem.innerHTML = `
        <img class="chat-user-avatar" src="${avatarUrl}" alt="${user.first_name} ${user.last_name}">
        <span class="chat-user-name-list">${user.first_name} ${user.last_name}</span>
      `;

      userItem.addEventListener('click', () => {
        // Видаляємо активний клас з усіх користувачів
        document.querySelectorAll('.chat-user-item').forEach(item => {
          item.classList.remove('active');
        });
        
        // Додаємо активний клас вибраному
        userItem.classList.add('active');
        
        openChat(user.id, `${user.first_name} ${user.last_name}`, avatarUrl);
        
        // На мобільних пристроях закриваємо список після вибору
        if (window.innerWidth <= 900) {
          usersListBlock.classList.remove('active');
          chatToggleBtn.textContent = 'Список чатів';
        }
      });

      usersListElement.appendChild(userItem);
    });
  }

  // Відкриття чату з вибраним користувачем
  function openChat(userId, userName, userAvatar) {
    currentChatId = userId;
    lastMessageId = 0; // Скидаємо для отримання всіх повідомлень
    
    chatUserName.textContent = userName;
    chatUserAvatar.src = userAvatar;
    chatUserAvatar.style.display = 'block';
    chatInputBlock.style.display = 'flex';
    
    // Очищаємо відображення повідомлень
    chatMessages.innerHTML = '<div class="no-messages">Завантаження повідомлень...</div>';
    
    // Завантажуємо повідомлення
    loadChatMessages(userId);
    
    // Налаштовуємо інтервал оновлення
    if (chatUpdateInterval) {
      clearInterval(chatUpdateInterval);
    }
    
    chatUpdateInterval = setInterval(() => {
      loadChatMessages(userId, true);
    }, CHAT_UPDATE_INTERVAL);
  }

  // Завантаження повідомлень чату
  function loadChatMessages(userId, isUpdate = false) {
    const formData = new FormData();
    formData.append('user_id', currentUserId);
    formData.append('chat_user_id', userId);
    if (lastMessageId > 0 && isUpdate) {
      formData.append('last_message_id', lastMessageId);
    }
    
    fetch(`${baseUrl}/server/get_chat_messages.php?${getNoCacheParam()}`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP помилка: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Отримано повідомлення чату:", data);
      
      if (data.success) {
        if (!isUpdate || data.messages.length > 0) {
          displayChatMessages(data.messages, isUpdate);
        }
      } else {
        if (!isUpdate) {
          chatMessages.innerHTML = `<div class="no-messages">Помилка: ${data.message}</div>`;
        }
      }
    })
    .catch(error => {
      console.error("Помилка при завантаженні повідомлень:", error);
      if (!isUpdate) {
        chatMessages.innerHTML = `<div class="no-messages">Не вдалося завантажити повідомлення. Спробуйте пізніше.</div>`;
      }
    });
  }

  // Відображення повідомлень чату
  function displayChatMessages(messages, isUpdate = false) {
    if (!messages || messages.length === 0) {
      if (!isUpdate) {
        chatMessages.innerHTML = '<div class="no-messages">Немає повідомлень. Почніть розмову!</div>';
      }
      return;
    }
    
    if (!isUpdate) {
      // Очищаємо повністю при першому завантаженні
      chatMessages.innerHTML = '';
    } else {
      // При оновленні перевіряємо, чи це нові повідомлення
      // Якщо немає елементів з класом chat-message, то просто відображаємо
      if (chatMessages.querySelectorAll('.chat-message').length === 0) {
        isUpdate = false;
        chatMessages.innerHTML = '';
      }
    }
    
    let currentDate = '';
    if (isUpdate) {
      // Знаходимо останній роздільник дати, якщо він є
      const dateSeparators = chatMessages.querySelectorAll('.chat-date-separator');
      if (dateSeparators.length > 0) {
        const lastDateSeparator = dateSeparators[dateSeparators.length - 1];
        currentDate = lastDateSeparator.getAttribute('data-date') || '';
      }
    }
    
    messages.forEach(message => {
      // Оновлюємо ID останнього повідомлення
      if (message.id > lastMessageId) {
        lastMessageId = message.id;
      }
      
      // Перевіряємо, чи вже є таке повідомлення в чаті
      if (isUpdate && document.querySelector(`.chat-message[data-id="${message.id}"]`)) {
        return; // Пропускаємо, якщо повідомлення вже відображено
      }
      
      // Перевіряємо чи змінилася дата
      if (message.date !== currentDate) {
        currentDate = message.date;
        
        // Перевіряємо, чи вже є роздільник з такою датою
        const existingSeparator = document.querySelector(`.chat-date-separator[data-date="${message.date}"]`);
        if (!existingSeparator) {
          const dateElement = document.createElement('div');
          dateElement.classList.add('chat-date-separator');
          dateElement.setAttribute('data-date', message.date);
          dateElement.textContent = formatDate(message.date);
          chatMessages.appendChild(dateElement);
        }
      }
      
      const messageElement = document.createElement('div');
      messageElement.classList.add('chat-message');
      messageElement.classList.add(message.outgoing ? 'outgoing' : 'incoming');
      messageElement.setAttribute('data-id', message.id);
      
      messageElement.innerHTML = `
        <div class="message-text">${message.text}</div>
        <div class="message-time">${message.time}</div>
      `;
      
      chatMessages.appendChild(messageElement);
    });
    
    // Прокручуємо до останнього повідомлення
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Форматування дати для роздільника
  function formatDate(dateStr) {
    const dateParts = dateStr.split('.');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Сьогодні';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Вчора';
    } else {
      return dateStr;
    }
  }

  // Обробник натискання Enter у полі вводу
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  // Обробник натискання кнопки відправлення
  sendChatBtn.addEventListener('click', sendMessage);

  // Функція відправлення повідомлення
  function sendMessage() {
    const messageText = chatInput.value.trim();
    
    if (!messageText || !currentChatId) {
      return;
    }
    
    const formData = new FormData();
    formData.append('user_id', currentUserId);
    formData.append('recipient_id', currentChatId);
    formData.append('message', messageText);
    
    fetch(`${baseUrl}/server/send_chat_message.php?${getNoCacheParam()}`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP помилка: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Результат відправлення повідомлення:", data);
      
      if (data.success) {
        // Очищаємо поле вводу
        chatInput.value = '';
        
        // Оновлюємо повідомлення в чаті
        loadChatMessages(currentChatId);
      } else {
        alert(`Помилка відправки повідомлення: ${data.message}`);
      }
    })
    .catch(error => {
      console.error("Помилка при відправленні повідомлення:", error);
      alert("Не вдалося відправити повідомлення. Спробуйте пізніше.");
    });
  }

  // Завантажуємо список користувачів при завантаженні сторінки
  loadChatUsers();
}); 