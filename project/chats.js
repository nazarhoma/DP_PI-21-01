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
  const CHAT_UPDATE_INTERVAL = 3000; // Оновлювати чат кожні 3 секунди
  
  console.log("Поточний користувач:", userData);

  // Додаємо параметр для уникнення кешування
  const getNoCacheParam = () => `v=${Date.now()}`;

  // Перевіряємо чи є параметр mentor_id в URL (для переходу з сторінки курсу)
  const urlParams = new URLSearchParams(window.location.search);
  const mentorIdFromUrl = urlParams.get('mentor_id');
  
  // Елементи чату
  const usersListElement = document.querySelector('.chats-users-list');
  const chatHeader = document.querySelector('.chat-header');
  const chatMessages = document.querySelector('.chat-messages');
  const chatUserName = document.querySelector('.chat-user-name');
  const chatUserAvatar = document.querySelector('.chat-user-avatar');
  const chatInputBlock = document.querySelector('.chat-input-block');
  const chatInput = document.querySelector('.chat-input');
  const sendChatBtn = document.querySelector('.send-chat-btn');
  const chatToggleBtn = document.querySelector('.chat-toggle-users');
  const usersListBlock = document.querySelector('.chats-users-list-block');

  // Елемент для відображення статусу завантаження
  usersListElement.innerHTML = '<p>Завантаження співрозмовників...</p>';

  // Адаптуємо базовий URL залежно від середовища
  const isProduction = window.location.hostname !== 'localhost';
  const baseUrl = isProduction ? '' : 'http://localhost:8080';

  // Перевіряємо, чи користувач був внизу чату перед оновленням
  let isUserAtBottom = true;

  // Створюємо і додаємо кнопку прокрутки вниз до контейнера чату
  const scrollToBottomBtn = document.createElement('button');
  scrollToBottomBtn.className = 'scroll-to-bottom';
  scrollToBottomBtn.setAttribute('title', 'Прокрутити донизу');
  chatInputBlock.appendChild(scrollToBottomBtn);

  // Показуємо кнопку прокрутки при скролі вверх
  chatMessages.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = chatMessages;
    isUserAtBottom = scrollTop >= scrollHeight - clientHeight - 50;
    
    if (!isUserAtBottom) {
      scrollToBottomBtn.classList.add('visible');
    } else {
      scrollToBottomBtn.classList.remove('visible');
    }
  });

  // Прокрутка вниз при натисканні на кнопку
  scrollToBottomBtn.addEventListener('click', () => {
    scrollToBottom(true); // true означає, що це примусова прокрутка
  });

  // Функція для прокрутки до останнього повідомлення
  function scrollToBottom(force = false) {
    // Прокручуємо лише якщо force=true або користувач уже був внизу
    if (force || isUserAtBottom) {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });
      isUserAtBottom = true;
    }
  }

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
    formData.append('user_role', userData.role || 'student'); // Додаємо роль користувача
    
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
        usersListElement.innerHTML = `<p>Помилка: ${data.message || 'Невідома помилка'}</p>`;
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
      if (!user || !user.id) return; // Перевірка на валідні дані користувача
      
      const userItem = document.createElement('div');
      userItem.classList.add('chat-user-item');
      userItem.dataset.userId = user.id;

      const avatarUrl = user.avatar || 'img/avatars/default-avatar.png';
      const displayName = user.role === 'admin' ? 'Адміністратор' : `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const userRole = user.role === 'admin' ? '' : getUserRoleText(user.role);
      
      userItem.innerHTML = `
        <img class="chat-user-avatar" src="${avatarUrl}" alt="${displayName}">
        <div class="chat-user-info">
          <span class="chat-user-name-list">${displayName}</span>
          ${userRole ? `<span class="chat-user-role">${userRole}</span>` : ''}
        </div>
      `;

      userItem.addEventListener('click', () => {
        // Видаляємо активний клас з усіх користувачів
        document.querySelectorAll('.chat-user-item').forEach(item => {
          item.classList.remove('active');
        });
        
        // Додаємо активний клас вибраному
        userItem.classList.add('active');
        
        openChat(user.id, displayName, avatarUrl, user.role);
        
        // На мобільних пристроях закриваємо список після вибору
        if (window.innerWidth <= 900) {
          usersListBlock.classList.remove('active');
          chatToggleBtn.textContent = 'Список чатів';
        }
      });

      usersListElement.appendChild(userItem);
    });
  }

  // Функція для отримання текстового представлення ролі користувача
  function getUserRoleText(role) {
    switch (role) {
      case 'mentor':
        return 'Ментор';
      case 'student':
        return 'Студент';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
    }
  }

  // Відкриття чату з вибраним користувачем
  function openChat(userId, userName, userAvatar, userRole) {
    currentChatId = userId;
    lastMessageId = 0; // Скидаємо для отримання всіх повідомлень
    
    chatUserName.textContent = userName || 'Чат';
    chatUserAvatar.src = userAvatar || 'img/avatars/default-avatar.png';
    chatUserAvatar.style.display = 'block';
    chatInputBlock.style.display = 'flex';
    
    // Додаємо роль користувача в заголовок чату (якщо не адмін)
    const roleSpan = document.querySelector('.chat-user-role-header');
    if (roleSpan) {
      roleSpan.remove();
    }
    
    if (userRole && userRole !== 'admin') {
      const roleElement = document.createElement('span');
      roleElement.className = 'chat-user-role-header';
      roleElement.textContent = getUserRoleText(userRole);
      chatHeader.appendChild(roleElement);
    }
    
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
        if (!isUpdate || (data.messages && data.messages.length > 0)) {
          displayChatMessages(data.messages || [], isUpdate);
        }
      } else {
        if (!isUpdate) {
          chatMessages.innerHTML = `<div class="no-messages">Помилка: ${data.message || 'Невідома помилка'}</div>`;
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
    // Зберігаємо поточну позицію прокрутки
    const scrollPos = chatMessages.scrollTop;
    const wasAtBottom = isUserAtBottom;
    
    if (!messages || messages.length === 0) {
      if (!isUpdate) {
        chatMessages.innerHTML = '<div class="no-messages">Немає повідомлень. Почніть розмову!</div>';
      }
      return;
    }
    
    if (!isUpdate) {
      // Очищаємо повністю при першому завантаженні
      chatMessages.innerHTML = '';
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
    
    // Перевіряємо чи є повідомлення для додавання
    let newMessagesAdded = false;
    
    messages.forEach(message => {
      // Перевірка наявності обов'язкових полів
      if (!message || !message.id) return;
      
      // Оновлюємо ID останнього повідомлення
      if (message.id > lastMessageId) {
        lastMessageId = message.id;
      }
      
      // Перевіряємо, чи вже є таке повідомлення в чаті
      if (document.querySelector(`.chat-message[data-id="${message.id}"]`)) {
        return;
      }
      
      newMessagesAdded = true;
      
      // Перевіряємо, чи є в повідомленні дата
      if (!message.sent_at) {
        console.error("Повідомлення без дати:", message);
        message.sent_at = new Date().toISOString(); // Використовуємо поточну дату
      }
      
      // Форматуємо дату для роздільника
      let messageDate;
      try {
        messageDate = formatDate(message.sent_at);
      } catch (e) {
        console.error("Помилка при форматуванні дати:", e);
        messageDate = "Нещодавно";
      }
      
      // Перевіряємо, чи потрібно додати роздільник дати
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        
        const dateSeparator = document.createElement('div');
        dateSeparator.classList.add('chat-date-separator');
        dateSeparator.setAttribute('data-date', currentDate);
        dateSeparator.textContent = currentDate;
        
        chatMessages.appendChild(dateSeparator);
      }
      
      // Створюємо елемент повідомлення
      const messageElement = document.createElement('div');
      messageElement.classList.add('chat-message');
      messageElement.dataset.id = message.id;
      
      // Визначаємо напрямок повідомлення (вхідне/вихідне)
      const isIncoming = parseInt(message.sender_id) !== parseInt(currentUserId);
      messageElement.classList.add(isIncoming ? 'incoming' : 'outgoing');
      
      // Перевірка тексту повідомлення
      const messageText = message.message || "Пусте повідомлення";
      
      // Форматуємо час повідомлення
      let formattedTime;
      try {
        const messageTime = new Date(message.sent_at);
        if (isNaN(messageTime.getTime())) {
          throw new Error("Invalid Date");
        }
        formattedTime = messageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      } catch (e) {
        console.error("Помилка при форматуванні часу:", e);
        formattedTime = "Невідомий час";
      }
      
      // Наповнюємо повідомлення
      messageElement.innerHTML = `
        <div class="message-text">${messageText}</div>
        <div class="message-time">${formattedTime}</div>
      `;
      
      chatMessages.appendChild(messageElement);
    });
    
    // Якщо це перше завантаження, прокручуємо до останнього повідомлення
    if (!isUpdate) {
      scrollToBottom(true);
    } 
    // Якщо додані нові повідомлення і користувач був внизу до оновлення, або це наше власне повідомлення
    else if (newMessagesAdded && wasAtBottom) {
      scrollToBottom(true);
    }
    // Інакше відновлюємо позицію прокрутки
    else if (isUpdate && !wasAtBottom) {
      chatMessages.scrollTop = scrollPos;
    }
  }
  
  // Функція форматування дати
  function formatDate(dateStr) {
    try {
      // Перевірка валідності вхідної дати
      if (!dateStr) throw new Error("Empty date string");
      
      // Перетворити рядок дати у об'єкт Date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      // Отримати день, місяць та рік
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      
      // Перевірити, чи це сьогодні
      if (day === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
        return 'Сьогодні';
      }
      
      // Перевірити, чи це вчора
      if (day === yesterday.getDate() && month === yesterday.getMonth() && year === yesterday.getFullYear()) {
        return 'Вчора';
      }
      
      // Якщо це не сьогодні і не вчора, повертаємо дату у форматі ДД.ММ.РРРР
      const formattedDay = day.toString().padStart(2, '0');
      const formattedMonth = (month + 1).toString().padStart(2, '0');
      
      // Якщо це поточний рік, не показуємо рік
      if (year === now.getFullYear()) {
        return `${formattedDay}.${formattedMonth}`;
      }
      
      return `${formattedDay}.${formattedMonth}.${year}`;
    } catch (error) {
      console.error("Помилка форматування дати:", error, "для рядка:", dateStr);
      return "Невідома дата";
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

  // Відправлення повідомлення
  function sendMessage() {
    const messageText = chatInput.value.trim();
    if (!messageText || !currentChatId) return;

    const formData = new FormData();
    formData.append('user_id', currentUserId);
    formData.append('receiver_id', currentChatId);
    formData.append('message', messageText);
    
    // Очищаємо поле вводу
    chatInput.value = '';
    
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
      console.log("Результат відправки повідомлення:", data);
      
      if (data.success) {
        // Оновлюємо повідомлення
        loadChatMessages(currentChatId, true);
        // Прокручуємо вниз
        scrollToBottom(true);
      }
    })
    .catch(error => {
      console.error("Помилка при відправці повідомлення:", error);
    });
  }

  // Завантажуємо список користувачів при завантаженні сторінки
  loadChatUsers();
}); 