document.addEventListener('DOMContentLoaded', () => {
    // Отримуємо пошукові елементи
    const searchForm = document.querySelector('.form-search');
    const searchInput = document.querySelector('.search-bar-input');
    
    // Приховуємо пошукову форму при натисканні Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const searchBar = document.querySelector('.search-bar');
            const searchBtn = document.querySelector('.search-btn');
            
            if (searchBar && searchBtn) {
                searchBar.style.display = 'none';
                searchBtn.style.display = 'block';
            }
        }
    });
    
    // Додаємо обробник пошуку
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const query = searchInput.value.trim();
            
            if (query) {
                // Перенаправляємо на сторінку пошуку з параметром
                window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
            }
        });
    }
    
    // Завантажуємо результати пошуку, якщо ми на сторінці результатів
    if (window.location.pathname.includes('search-results.html')) {
        loadSearchResults();
    }
});

/**
 * Завантажує та відображає результати пошуку
 */
async function loadSearchResults() {
    try {
        // Отримуємо пошуковий запит з URL
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('query');
        
        if (!query) {
            displayNoResults('Пошуковий запит не вказано');
            return;
        }
        
        // Відображаємо пошуковий запит
        updateSearchQuery(query);
        
        // Показуємо індикатор завантаження
        showLoadingIndicator();
        
        // Обробляємо пошуковий запит - видаляємо зайві пробіли
        const cleanQuery = query.trim().replace(/\s+/g, ' ');
        
        console.log('Виконую пошук:', cleanQuery);
        
        // Робимо запит на сервер
        const response = await fetch(`/server/search.php?query=${encodeURIComponent(cleanQuery)}`);
        
        if (!response.ok) {
            console.error('HTTP помилка при пошуку:', response.status, response.statusText);
            throw new Error(`Помилка при виконанні пошукового запиту: ${response.status} ${response.statusText}`);
        }
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('Помилка при розборі JSON:', jsonError);
            const responseText = await response.text();
            console.error('Відповідь сервера:', responseText);
            throw new Error('Помилка в форматі відповіді сервера');
        }
        
        if (!data.success) {
            console.error('Помилка у відповіді сервера:', data.message);
            throw new Error(data.message || 'Помилка при виконанні пошуку');
        }
        
        // Приховуємо індикатор завантаження
        hideLoadingIndicator();
        
        // Відображаємо результати пошуку
        displaySearchResults(data);
    } catch (error) {
        console.error('Помилка пошуку:', error);
        hideLoadingIndicator();
        displayNoResults(`Помилка при виконанні пошуку: ${error.message}. Спробуйте пізніше.`);
    }
}

/**
 * Відображає результати пошуку на сторінці
 */
function displaySearchResults(data) {
    const coursesContainer = document.querySelector('.search-courses');
    const instructorsContainer = document.querySelector('.search-instructors');
    const coursesCount = document.querySelector('.courses-count');
    const instructorsCount = document.querySelector('.instructors-count');
    const searchFooter = document.querySelector('.search-footer');
    
    // Очищаємо контейнери
    if (coursesContainer) coursesContainer.innerHTML = '';
    if (instructorsContainer) instructorsContainer.innerHTML = '';
    
    // Встановлюємо лічильники результатів
    if (coursesCount) coursesCount.textContent = data.total_courses;
    if (instructorsCount) instructorsCount.textContent = data.total_instructors;
    
    // Показуємо/приховуємо розділи залежно від наявності результатів
    const coursesSection = document.querySelector('.search-courses-section');
    const instructorsSection = document.querySelector('.search-instructors-section');
    const noResultsMessage = document.querySelector('.no-results-message');
    
    if (data.total_courses === 0 && data.total_instructors === 0) {
        // Немає результатів
        if (coursesSection) coursesSection.style.display = 'none';
        if (instructorsSection) instructorsSection.style.display = 'none';
        if (searchFooter) searchFooter.style.display = 'none';
        
        if (noResultsMessage) {
            noResultsMessage.style.display = 'block';
            noResultsMessage.textContent = `За запитом "${data.query}" нічого не знайдено`;
        }
        return;
    }
    
    // Приховуємо повідомлення про відсутність результатів
    if (noResultsMessage) noResultsMessage.style.display = 'none';
    if (searchFooter) searchFooter.style.display = 'block';
    
    // Показуємо/приховуємо розділи залежно від наявності результатів
    if (coursesSection) coursesSection.style.display = data.total_courses > 0 ? 'block' : 'none';
    if (instructorsSection) instructorsSection.style.display = data.total_instructors > 0 ? 'block' : 'none';
    
    // Відображаємо курси
    if (coursesContainer && data.courses.length > 0) {
        data.courses.forEach((course, index) => {
            const courseCard = createCourseCard(course);
            // Додаємо різну затримку для анімації
            setTimeout(() => {
                coursesContainer.appendChild(courseCard);
            }, index * 50);
        });
    }
    
    // Відображаємо інструкторів
    if (instructorsContainer && data.instructors.length > 0) {
        data.instructors.forEach((instructor, index) => {
            const instructorCard = createInstructorCard(instructor);
            // Додаємо різну затримку для анімації
            setTimeout(() => {
                instructorsContainer.appendChild(instructorCard);
            }, index * 50);
        });
    }
}

/**
 * Створює HTML-елемент картки курсу
 */
function createCourseCard(course) {
    const card = document.createElement('article');
    card.className = 'course-card jcsb';
    card.setAttribute('data-course-id', course.id);
    
    // Додаємо обробник кліку для переходу на сторінку курсу
    card.addEventListener('click', function() {
        window.location.href = `course.html?id=${course.id}`;
    });

    // Створюємо HTML для зірок рейтингу
    let starsHTML = '';
    
    // Перевіряємо, чи є відгуки (може бути undefined, null, 0)
    const hasReviews = course.reviews !== undefined && course.reviews !== null && course.reviews > 0;
    
    if (!hasReviews) {
        // Якщо відгуків немає (0 або undefined), відображаємо 5 сірих зірок
        for (let i = 0; i < 5; i++) {
            starsHTML += '<img class="star" src="img/gstar.png" alt="Сіра зірка">';
        }
    } else {
        // Відгуки є, відображаємо золоті зірки відповідно до рейтингу
        const rating = Math.round(course.rating || 0); // Округлення рейтингу, за замовчуванням 0
        
        // Додаємо золоті зірки для рейтингу
        for (let i = 0; i < rating; i++) {
            starsHTML += '<img class="star" src="img/star.png" alt="Зірка">';
        }
        
        // Додаємо сірі зірки до загальної кількості 5
        for (let i = rating; i < 5; i++) {
            starsHTML += '<img class="star" src="img/gstar.png" alt="Сіра зірка">';
        }
    }

    // Форматуємо ціну
    let priceText;
    if (course.price === 0) {
        priceText = 'Безкоштовно';
    } else {
        // Форматуємо ціну в гривнях
        const priceUAH = course.price * 1;
        priceText = `${priceUAH.toFixed(2)} ₴`;
    }
    
    // Записуємо у змінну для відображення кількість відгуків (може бути undefined)
    const reviewsCount = course.reviews || 0;
    
    // Створюємо HTML структуру картки
    card.innerHTML = `
        <img class="course-image" src="${course.image}" alt="${course.title}">
        <div class="course-details">
          <h3 class="course-title">${course.title}</h3>
          <p class="course-author">Автор: ${course.author}</p>
          <div class="course-rating">
            <div class="stars">${starsHTML}</div>
            <span class="rating-info">(${reviewsCount} відгуків)</span>
          </div>
          <p class="course-info">${course.info}</p>
          <p class="course-price">${priceText}</p>
        </div>
      `;

    // Додаємо стиль курсору, щоб показати, що на карточку можна натиснути
    card.style.cursor = 'pointer';

    // Додаємо анімацію появи
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    // Анімація появи з затримкою
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);

    return card;
}

/**
 * Функція для отримання повного URL аватару
 */
function getFullAvatarUrl(avatar) {
    if (!avatar || avatar === '') {
        // Якщо аватар не вказано, повертаємо дефолтний
        return 'img/avatars/default-avatar.png';
    }
    
    // Якщо аватар вже містить повний URL, повертаємо його
    if (avatar.startsWith('http')) {
        return avatar;
    }
    
    // Видаляємо початковий слеш, якщо він є
    if (avatar.startsWith('/')) {
        avatar = avatar.substring(1);
    }
    
    // Повертаємо шлях до аватару як є
    return avatar;
}

/**
 * Створює HTML-елемент картки інструктора
 */
function createInstructorCard(instructor) {
    const card = document.createElement('article');
    card.className = 'instructor-card';

    // Отримуємо повний URL для аватарки інструктора
    const avatarUrl = getFullAvatarUrl(instructor.image);
    
    // Завжди використовуємо жовту зірку
    const starImg = 'img/star.png';
    const starAlt = 'Зірка';
    
    // Використовуємо реальні значення
    const studentsCount = instructor.students !== undefined ? instructor.students : 0;

    card.innerHTML = `
        <div class="instructor">
          <img class="instructor-img" src="${avatarUrl}" alt="Фото інструктора">
          <div class="instructor-info">
            <div class="instructor-title">
              <h3 class="instructor-name">${instructor.name}</h3>
              <p class="instructor-role">${instructor.role}</p>
            </div>
            <hr class="instructor-line">
            <div class="instructors-rating">
              <div class="instructor-rating">
                <img class="star" src="${starImg}" alt="${starAlt}">
                <span class="ratings-info">${instructor.rating}</span>
              </div>
              <span class="instructor-students">${studentsCount} студентів</span>
            </div>
          </div>
        </div>
      `;

    // Додаємо анімацію появи
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    // Анімація появи з затримкою
    setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);

    return card;
}

/**
 * Оновлює відображення пошукового запиту на сторінці
 */
function updateSearchQuery(query) {
    const searchQueryElement = document.querySelector('.search-query');
    const searchInputField = document.querySelector('.search-bar-input');
    
    if (searchQueryElement) {
        searchQueryElement.textContent = `"${query}"`;
    }
    
    if (searchInputField) {
        searchInputField.value = query;
    }
}

/**
 * Відображає повідомлення про відсутність результатів
 */
function displayNoResults(message) {
    const noResultsMessage = document.querySelector('.no-results-message');
    const coursesSection = document.querySelector('.search-courses-section');
    const instructorsSection = document.querySelector('.search-instructors-section');
    
    if (noResultsMessage) {
        noResultsMessage.style.display = 'block';
        noResultsMessage.textContent = message;
    }
    
    if (coursesSection) coursesSection.style.display = 'none';
    if (instructorsSection) instructorsSection.style.display = 'none';
    
    // Приховуємо індикатор завантаження
    hideLoadingIndicator();
}

/**
 * Показує індикатор завантаження
 */
function showLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
}

/**
 * Приховує індикатор завантаження
 */
function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * Форматує ціну для відображення
 */
function formatPrice(price) {
    if (price === 0) {
        return 'Безкоштовно';
    }
    return `${price.toFixed(2)} грн`;
} 