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
    if (chatUpdateInterval) {
      clearInterval(chatUpdateInterval);
    }

    currentChatId = userId;
    lastMessageId = 0;
    
    chatUserName.textContent = userName || 'Чат';
    chatUserAvatar.src = userAvatar || 'img/avatars/default-avatar.png';
    chatUserAvatar.style.display = 'block';
    chatInputBlock.style.display = 'flex';
    
    // Додаємо роль користувача в заголовок чату
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
    
    // Завантажуємо початкові повідомлення
    loadChatMessages(userId);
    
    // Встановлюємо інтервал оновлення
    chatUpdateInterval = setInterval(function() {
      if (!document.hidden && currentChatId) {
        loadChatMessages(currentChatId, true);
      }
    }, 1000); // Зменшуємо інтервал до 1 секунди для тестування
  }

  // Відображення повідомлень
  function displayChatMessages(messages, isUpdate = false) {
    if (!messages || messages.length === 0) {
      if (!isUpdate) {
        chatMessages.innerHTML = '<div class="no-messages">Немає повідомлень. Почніть розмову!</div>';
      }
      return;
    }

    if (!isUpdate) {
      chatMessages.innerHTML = '';
    }

    let hasNewMessages = false;

    messages.forEach(message => {
      if (!message || !message.id) return;

      // Перевіряємо чи повідомлення вже відображено
      if (document.querySelector(`.chat-message[data-id="${message.id}"]`)) {
        return;
      }

      hasNewMessages = true;

      // Оновлюємо lastMessageId
      if (parseInt(message.id) > lastMessageId) {
        lastMessageId = parseInt(message.id);
      }

      const messageElement = document.createElement('div');
      messageElement.classList.add('chat-message');
      messageElement.dataset.id = message.id;

      const isIncoming = parseInt(message.sender_id) !== parseInt(currentUserId);
      messageElement.classList.add(isIncoming ? 'incoming' : 'outgoing');

      let formattedTime;
      try {
        const messageTime = new Date(message.sent_at);
        formattedTime = messageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      } catch (e) {
        formattedTime = 'Невідомий час';
      }

      messageElement.innerHTML = `
        <div class="message-text">${message.message || ''}</div>
        <div class="message-time">${formattedTime}</div>
      `;

      chatMessages.appendChild(messageElement);
    });

    if (hasNewMessages) {
      scrollToBottom(true);
    }
  }

  // Функція для завантаження повідомлень
  function loadChatMessages(userId, isUpdate = false) {
    if (!userId) return;

    $.ajax({
      url: `${baseUrl}/server/get_chat_messages.php`,
      type: 'POST',
      data: {
        user_id: currentUserId,
        chat_user_id: userId,
        last_message_id: isUpdate ? lastMessageId : 0,
        timestamp: new Date().getTime()
      },
      dataType: 'json',
      cache: false,
      success: function(data) {
        if (data.success && data.messages) {
          displayChatMessages(data.messages, isUpdate);
        } else {
          if (!isUpdate) {
            chatMessages.innerHTML = `<div class="no-messages">Помилка: ${data.message || 'Невідома помилка'}</div>`;
          }
        }
      },
      error: function(xhr, status, error) {
        console.error("Помилка при завантаженні повідомлень:", error);
        if (!isUpdate) {
          chatMessages.innerHTML = '<div class="no-messages">Не вдалося завантажити повідомлення</div>';
        }
      }
    });
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

    $.ajax({
      url: `${baseUrl}/server/send_chat_message.php`,
      type: 'POST',
      data: {
        user_id: currentUserId,
        receiver_id: currentChatId,
        message: messageText,
        timestamp: new Date().getTime()
      },
      dataType: 'json',
      cache: false,
      success: function(data) {
        if (data.success) {
          chatInput.value = '';
          // Відразу завантажуємо нові повідомлення
          loadChatMessages(currentChatId, true);
        }
      },
      error: function(xhr, status, error) {
        console.error("Помилка при відправці повідомлення:", error);
      }
    });
  }

  // Завантажуємо список користувачів при завантаженні сторінки
  loadChatUsers();
}); 