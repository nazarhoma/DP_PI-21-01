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
        
        // Робимо запит на сервер
        const response = await fetch(`http://localhost/search.php?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error('Помилка при виконанні пошукового запиту');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Помилка при виконанні пошуку');
        }
        
        // Приховуємо індикатор завантаження
        hideLoadingIndicator();
        
        // Відображаємо результати пошуку
        displaySearchResults(data);
    } catch (error) {
        console.error('Помилка пошуку:', error);
        hideLoadingIndicator();
        displayNoResults('Помилка при виконанні пошуку. Спробуйте пізніше.');
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
    const cardElement = document.createElement('article');
    cardElement.className = 'course-card';
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'translateY(20px)';
    
    const ratingStars = generateRatingStars(course.rating);
    
    cardElement.innerHTML = `
        <a href="course.html?id=${course.id}" class="course-card-link">
            <div class="course-image-container">
                <img src="${course.image}" alt="${course.title}" class="course-image">
            </div>
            <div class="course-details">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-author">${course.author}</p>
                <div class="course-rating">
                    <div class="stars">${ratingStars}</div>
                    <span class="rating-count">(${course.reviews})</span>
                </div>
                <p class="course-info">${course.info}</p>
                <span class="course-price">${formatPrice(course.price)}</span>
            </div>
        </a>
    `;
    
    // Анімація появи з затримкою
    setTimeout(() => {
        cardElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        cardElement.style.opacity = '1';
        cardElement.style.transform = 'translateY(0)';
    }, 100);
    
    return cardElement;
}

/**
 * Створює HTML-елемент картки інструктора
 */
function createInstructorCard(instructor) {
    const cardElement = document.createElement('article');
    cardElement.className = 'instructor-card';
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'translateY(20px)';
    
    const ratingStars = generateRatingStars(instructor.rating);
    
    // Використовуємо шлях до зображення як є, без модифікацій
    let imageUrl = instructor.image;
    if (!imageUrl) {
        imageUrl = 'img/default-avatar.png';
    }
    
    // Видаляємо початковий слеш, якщо він є
    if (imageUrl.startsWith('/')) {
        imageUrl = imageUrl.substring(1);
    }
    
    cardElement.innerHTML = `
        <a href="profile.html?id=${instructor.id}" class="instructor-card-link">
            <div class="instructor-card-image-container">
                <img src="${imageUrl}" alt="${instructor.name}" class="instructor-card-image">
            </div>
            <div class="instructor-card-content">
                <h3 class="instructor-card-name">${instructor.name}</h3>
                <p class="instructor-card-role">${instructor.role}</p>
                <div class="instructor-card-rating">
                    <div class="stars">${ratingStars}</div>
                    <span class="rating-text">${instructor.rating.toFixed(1)}</span>
                </div>
                <p class="instructor-card-info">
                    <span class="students-count">${instructor.students} студентів</span>
                    <span class="courses-count">${instructor.courses_count} курсів</span>
                </p>
            </div>
        </a>
    `;
    
    // Анімація появи з затримкою
    setTimeout(() => {
        cardElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        cardElement.style.opacity = '1';
        cardElement.style.transform = 'translateY(0)';
    }, 100);
    
    return cardElement;
}

/**
 * Генерує HTML для зірок рейтингу
 */
function generateRatingStars(rating) {
    let starsHTML = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    // Додаємо заповнені зірки
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<img src="img/star.png" alt="Зірка" class="star">';
    }
    
    
    // Додаємо пусті зірки
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<img src="img/gstar.png" alt="Сіра зірка" class="star">';
    }
    
    return starsHTML;
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