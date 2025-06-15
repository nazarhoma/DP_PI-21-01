// Глобальні змінні
let currentFilters = {
    rating: null,
    duration: [],
    price: {
        min: null,
        max: null
    },
    difficulty: [],
    categories: []
};

// Функція для обробки помилок
function handleError(error, message) {
    console.error(message, error);
    // Додаємо відображення помилки на сторінці
    const coursesList = document.querySelector('.courses-list');
    if (coursesList) {
        coursesList.innerHTML = `
            <div class="error-message">
                <p>Виникла помилка: ${message}</p>
                <p>Деталі: ${error.message}</p>
            </div>
        `;
    }
}

// Функція для отримання числового значення
function getNumericValue(element, selector, defaultValue = 0) {
    const el = element.querySelector(selector);
    if (!el) return defaultValue;
    const value = el.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(value) || defaultValue;
}

// Функція для отримання тривалості
function getDuration(element) {
    const courseInfo = element.querySelector('.course-info')?.textContent || '';
    const match = courseInfo.match(/^[^\d]*(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Функція для створення картки курсу
function createCourseCard(course) {
    console.log('Creating card for course:', course);
    
    const card = document.createElement('article');
    card.className = 'course-card jcsb';
    card.setAttribute('data-course-id', course.id);
    
    card.addEventListener('click', function() {
        window.location.href = `course.html?id=${course.id}`;
    });

    // Форматуємо дані для відображення
    const rating = parseFloat(course.rating || 0);
    const reviewCount = parseInt(course.reviews_count || 0);
    const price = parseFloat(course.price || 0);
    const mentorName = course.mentor_name || `Ментор ${course.mentor_id}`;

    // Визначаємо URL зображення з різних можливих джерел
    let imageUrl = 'img/default-image-course.png'; // Дефолтне зображення
    if (course.image_url) {
        imageUrl = course.image_url;
    } else if (course.image) {
        imageUrl = course.image;
    }

    card.innerHTML = `
        <img class="course-image" src="${imageUrl}" alt="${course.title || ''}" onerror="this.src='img/default-image-course.png'">
        <div class="course-details">
            <h3 class="course-title">${course.title || ''}</h3>
            <p class="course-author">Автор: ${mentorName}</p>
            <div class="course-rating">
                <div class="stars">${generateStars(rating)}</div>
                <span class="ratings-info">${rating.toFixed(1)}</span>
                <span class="reviews-count">(${reviewCount} відгуків)</span>
            </div>
            <div class="course-info">
                ${course.duration_hours ? course.duration_hours + ' год.' : ''} 
                ${course.level_id ? '• ' + translateLevel(course.level_id) : ''}
            </div>
            <p class="course-price">${formatPrice(price)}</p>
        </div>
    `;

    card.style.cursor = 'pointer';
    return card;
}

// Функція для отримання імені ментора
function getMentorName(mentorId) {
    // Тут можна додати кешування імен менторів якщо потрібно
    return 'Ментор ' + mentorId;
}

// Функція для форматування тривалості
function formatDuration(hours) {
    if (!hours) return '';
    return `${hours} год.`;
}

// Функція для форматування ціни
function formatPrice(price) {
    if (!price || price === 0) return 'Безкоштовно';
    return `${price.toFixed(2)} ₴`;
}

// Функція для генерації зірок рейтингу
function generateStars(rating) {
    let starsHTML = '';
    const roundedRating = Math.round(rating);
    for (let i = 0; i < 5; i++) {
        if (i < roundedRating) {
            starsHTML += '<img class="star" src="img/star.png" alt="★">';
        } else {
            starsHTML += '<img class="star" src="img/gstar.png" alt="☆">';
        }
    }
    return starsHTML;
}

// Функція для перекладу рівня складності
function translateLevel(levelId) {
    const levels = {
        '1': 'Початковий',
        '2': 'Середній',
        '3': 'Просунутий'
    };
    return levels[levelId] || 'Невідомий рівень';
}

// Функція для оновлення пагінації
function updatePagination(totalPages, currentPage) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    // Додаємо кнопку "Попередня"
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<img src="img/bleft-chevron.png" alt="Попередня">';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            loadPage(currentPage - 1);
        }
    });
    pagination.appendChild(prevButton);
    
    // Додаємо кнопки з номерами сторінок
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            if (i !== currentPage) {
                loadPage(i);
            }
        });
        pagination.appendChild(button);
    }
    
    // Додаємо кнопку "Наступна"
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<img src="img/bright-chevron.png" alt="Наступна">';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadPage(currentPage + 1);
        }
    });
    pagination.appendChild(nextButton);
}

// Функція для завантаження сторінки
async function loadPage(page) {
    try {
        // Створюємо об'єкт параметрів з поточними фільтрами
        const queryParams = new URLSearchParams();
        
        console.log('Current filters before API call:', currentFilters);
        
        if (currentFilters.rating) {
            queryParams.append('rating', currentFilters.rating);
        }
        
        if (currentFilters.duration && currentFilters.duration.length > 0) {
            queryParams.append('duration', currentFilters.duration[0]);
        }
        
        if (currentFilters.price.min !== null) {
            queryParams.append('price_min', currentFilters.price.min.toString());
        }
        
        if (currentFilters.price.max !== null) {
            queryParams.append('price_max', currentFilters.price.max.toString());
        }
        
        if (currentFilters.difficulty && currentFilters.difficulty.length > 0) {
            queryParams.append('difficulty', currentFilters.difficulty.join(','));
        }
        
        if (currentFilters.categories && currentFilters.categories.length > 0) {
            queryParams.append('categories', currentFilters.categories.join(','));
        }
        
        // Додаємо номер сторінки
        queryParams.append('page', page.toString());
        
        const url = `../server/courses.php?${queryParams.toString()}`;
        console.log('API Request URL:', url);

        const response = await fetch(url);
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw API Response:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        const coursesList = document.querySelector('.courses-list');
        if (!coursesList) {
            throw new Error('Could not find courses list element');
        }
        
        coursesList.innerHTML = '';
        
        if (!data.courses || data.courses.length === 0) {
            coursesList.innerHTML = '<p class="no-results">За вашим запитом курсів не знайдено</p>';
            return;
        }
        
        data.courses.forEach((course, index) => {
            console.log(`Processing course ${index + 1}:`, course);
            const card = createCourseCard(course);
            coursesList.appendChild(card);
        });

        // Оновлюємо пагінацію
        updatePagination(data.total_pages, page);
        
        // Прокручуємо до початку списку курсів
        coursesList.scrollIntoView({ behavior: 'smooth' });
        
        // Якщо є активне сортування, застосовуємо його
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect && sortSelect.value) {
            sortCourses(sortSelect.value);
        }
    } catch (error) {
        console.error('Full error details:', error);
        handleError(error, 'Помилка завантаження сторінки:');
    }
}

// Функція для застосування фільтрів тепер просто викликає loadPage з першою сторінкою
async function applyFilters() {
    console.log('Applying filters...', currentFilters);
    await loadPage(1);
}

// Функція для сортування курсів
function sortCourses(sortBy) {
    const coursesList = document.querySelector('.courses-list');
    if (!coursesList || !coursesList.children.length) return;
    
    const courses = Array.from(coursesList.children);
    
    courses.sort((a, b) => {
        switch (sortBy) {
            case 'duration':
                const durationA = getDuration(a);
                const durationB = getDuration(b);
                return durationB - durationA;
            case 'price_asc':
                return getNumericValue(a, '.course-price') - getNumericValue(b, '.course-price');
            case 'price_desc':
                return getNumericValue(b, '.course-price') - getNumericValue(a, '.course-price');
            case 'rating':
                return getNumericValue(b, '.course-rating') - getNumericValue(a, '.course-rating');
            default:
                return 0;
        }
    });

    coursesList.innerHTML = '';
    courses.forEach(course => coursesList.appendChild(course));
}

// Функція для завантаження категорій
async function loadCategories() {
    try {
        const response = await fetch('../server/categories.php');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        const categories = JSON.parse(data);
        
        const categoryOptions = document.getElementById('category-options');
        if (!categoryOptions) return;

        categoryOptions.innerHTML = categories.map(category => `
            <div class="category-option">
                <input type="checkbox" id="category-${category.id}" value="${category.id}">
                <label for="category-${category.id}">${category.name}</label>
            </div>
        `).join('');
        
        // Додаємо обробники подій для чекбоксів категорій
        categoryOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    currentFilters.categories.push(checkbox.value);
                } else {
                    currentFilters.categories = currentFilters.categories.filter(id => id !== checkbox.value);
                }
            });
        });
    } catch (error) {
        handleError(error, 'Помилка завантаження категорій:');
    }
}

// Функція для завантаження рівнів складності
async function loadDifficultyLevels() {
    try {
        const response = await fetch('../server/difficulty-levels.php');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        const levels = JSON.parse(data);
        
        const difficultyOptions = document.getElementById('difficulty-options');
        if (!difficultyOptions) return;

        difficultyOptions.innerHTML = levels.map(level => `
            <div class="difficulty-option">
                <input type="checkbox" id="difficulty-${level.id}" value="${level.id}">
                <label for="difficulty-${level.id}">${level.name}</label>
            </div>
        `).join('');
        
        // Додаємо обробники подій для чекбоксів складності
        difficultyOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    currentFilters.difficulty.push(checkbox.value);
                } else {
                    currentFilters.difficulty = currentFilters.difficulty.filter(id => id !== checkbox.value);
                }
            });
        });
    } catch (error) {
        handleError(error, 'Помилка завантаження рівнів складності:');
    }
}

// Функція для ініціалізації фільтрів
function initializeFilters() {
    const filterListWrapper = document.querySelector('.filter-list-wrapper');
    const filterButton = document.querySelector('.filter-button');
    const applyFiltersBtn = document.querySelector('.apply-filters-btn');
    const sortSelect = document.querySelector('.sort-select');
    const filterCardButtons = document.querySelectorAll('.filter-card-button');

    // Ініціалізація кнопок фільтрів
    filterCardButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterCard = button.closest('.filter-card');
            const filterInfo = filterCard.querySelector('.filter-info');
            const img = button.querySelector('img');
            
            filterInfo.classList.toggle('hidden');
            if (img) {
                img.style.transform = filterInfo.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    });

    // Ініціалізація кнопки фільтру для мобільних
    if (filterButton && filterListWrapper) {
        filterButton.addEventListener('click', () => {
            filterListWrapper.classList.toggle('hidden');
        });
    }

    // Ініціалізація сортування
    if (sortSelect) {
        sortSelect.addEventListener('change', (event) => {
            sortCourses(event.target.value);
        });
    }

    // Обробники подій для зірок рейтингу
    document.querySelectorAll('.stars').forEach(starsContainer => {
        starsContainer.addEventListener('click', () => {
            document.querySelectorAll('.stars').forEach(s => s.classList.remove('selected'));
            starsContainer.classList.add('selected');
            currentFilters.rating = starsContainer.dataset.rating;
        });
    });

    // Обробники подій для чекбоксів тривалості
    document.querySelectorAll('input[type="checkbox"][id^="duration"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const value = checkbox.value;
            if (checkbox.checked) {
                currentFilters.duration = [value];
                
                // Знімаємо виділення з інших чекбоксів
                document.querySelectorAll('input[type="checkbox"][id^="duration"]').forEach(cb => {
                    if (cb !== checkbox) {
                        cb.checked = false;
                    }
                });
            } else {
                currentFilters.duration = [];
            }
        });
    });

    // Обробники подій для полів ціни
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');

    if (priceMin) {
        priceMin.addEventListener('input', () => {
            currentFilters.price.min = priceMin.value ? Number(priceMin.value) : null;
        });
    }

    if (priceMax) {
        priceMax.addEventListener('input', () => {
            currentFilters.price.max = priceMax.value ? Number(priceMax.value) : null;
        });
    }

    // Обробник кліку по кнопці застосування фільтрів
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
            if (window.innerWidth <= 734) {
                filterListWrapper.classList.add('hidden');
            }
        });
    }
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadDifficultyLevels();
    initializeFilters();
    applyFilters(); // Завантажуємо початковий список курсів
});