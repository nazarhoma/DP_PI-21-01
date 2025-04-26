document.addEventListener('DOMContentLoaded', () => {
    // Отримуємо ID курсу з URL параметрів
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        // Якщо ID курсу не вказано, перенаправляємо на сторінку категорій
        window.location.href = 'category.html';
        return;
    }

    // Завантажуємо дані курсу
    loadCourseDetails(courseId);
    loadCourseReviews(courseId);
    loadRelatedCourses(courseId);
});

// Функція для завантаження деталей курсу
async function loadCourseDetails(courseId) {
    try {
        // Запит на сервер для отримання даних курсу
        const response = await fetch(`/server/get_course.php?id=${courseId}`);
        
        if (!response.ok) {
            throw new Error('Помилка при завантаженні даних курсу');
        }
        
        const courseData = await response.json();
        
        if (courseData.error) {
            throw new Error(courseData.error);
        }
        
        // Відображаємо дані курсу на сторінці
        displayCourseDetails(courseData);
        
        // Завантажуємо дані про викладача
        if (courseData.mentor_id) {
            loadMentorDetails(courseData.mentor_id);
        }

        // Завантажуємо навчальний план курсу
        loadCourseSyllabus(courseId);
    } catch (error) {
        console.error('Помилка:', error);
        displayErrorMessage('Не вдалося завантажити дані курсу. Спробуйте пізніше.');
    }
}

// Функція для завантаження навчального плану курсу
async function loadCourseSyllabus(courseId) {
    try {
        // Запит на сервер для отримання навчального плану
        const response = await fetch(`/server/get_course_syllabus.php?course_id=${courseId}`);
        
        if (!response.ok) {
            throw new Error('Помилка при завантаженні навчального плану');
        }
        
        const syllabusData = await response.json();
        
        if (syllabusData.error) {
            throw new Error(syllabusData.error);
        }
        
        // Відображаємо навчальний план
        displayCourseSyllabus(syllabusData);
    } catch (error) {
        console.error('Помилка:', error);
        const syllabusSection = document.querySelector('.syllabus-sections');
        if (syllabusSection) {
            syllabusSection.innerHTML = '<p class="error-message">Не вдалося завантажити навчальний план. Спробуйте пізніше.</p>';
        }
    }
}

// Функція для відображення навчального плану
function displayCourseSyllabus(syllabusData) {
    const sectionsContainer = document.querySelector('.syllabus-sections');
    if (!sectionsContainer) return;
    
    // Очищаємо контейнер секцій
    sectionsContainer.innerHTML = '';
    
    // Якщо немає розділів, показуємо повідомлення
    if (!syllabusData.sections || syllabusData.sections.length === 0) {
        sectionsContainer.innerHTML = '<p class="no-content">Навчальний план ще не додано</p>';
        return;
    }
    
    // Оновлюємо загальну інформацію про навчальний план
    document.getElementById('sections-count').textContent = syllabusData.sections.length;
    document.getElementById('lessons-count').textContent = syllabusData.total_lessons || 0;
    document.getElementById('total-duration').textContent = syllabusData.total_duration || '0 год';
    
    // Додаємо кожен розділ
    syllabusData.sections.forEach((section, index) => {
        const sectionElement = createSectionElement(section, index);
        sectionsContainer.appendChild(sectionElement);
    });
    
    // Додаємо обробники подій для розгортання розділів
    attachSectionToggleHandlers();
}

// Функція для створення елемента розділу
function createSectionElement(section, index) {
    const sectionElement = document.createElement('div');
    sectionElement.className = 'syllabus-section';
    sectionElement.setAttribute('data-section-id', section.id);
    
    const lessonsHTML = section.lessons.map(lesson => createLessonHTML(lesson)).join('');
    
    sectionElement.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <span class="section-number">${index + 1}.</span>
                ${section.title}
            </div>
            <div class="section-info">
                <span class="section-lessons-count">${section.lessons_count || section.lessons.length} уроків</span>
                <span class="section-duration">${section.duration || '0 хв'}</span>
                <img src="img/arrow-down.png" alt="Розгорнути" class="section-toggle">
            </div>
        </div>
        <div class="section-content">
            <div class="section-description">${section.description || ''}</div>
            <ul class="lessons-list">
                ${lessonsHTML}
            </ul>
        </div>
    `;
    
    return sectionElement;
}

// Функція для створення HTML уроку
function createLessonHTML(lesson) {
    const lessonIcon = getLessonIcon(lesson.content_type);
    
    return `
        <li class="lesson-item">
            <div class="lesson-info">
                <img src="${lessonIcon}" alt="Тип уроку" class="lesson-icon">
                <span class="lesson-title">${lesson.title}</span>
            </div>
            <div class="lesson-duration">${lesson.duration || ''}</div>
        </li>
    `;
}

// Функція для отримання іконки уроку залежно від типу
function getLessonIcon(contentType) {
    switch (contentType) {
        case 'video':
            return 'img/video-icon.png';
        case 'text':
            return 'img/text-icon.png';
        case 'quiz':
            return 'img/quiz-icon.png';
        default:
            return 'img/lesson-icon.png';
    }
}

// Функція для додавання обробників подій для розділів
function attachSectionToggleHandlers() {
    const sectionHeaders = document.querySelectorAll('.section-header');
    
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.parentElement;
            section.classList.toggle('expanded');
            
            const toggleIcon = header.querySelector('.section-toggle');
            if (toggleIcon) {
                toggleIcon.style.transform = section.classList.contains('expanded') 
                    ? 'rotate(180deg)' 
                    : 'rotate(0deg)';
            }
        });
    });
}

// Функція для відображення даних курсу
function displayCourseDetails(courseData) {
    // Заголовок сторінки
    document.title = `${courseData.title} | Byway`;
    
    // Категорія курсу
    const categoryLink = document.querySelector('.course-category-link');
    if (categoryLink) {
        categoryLink.textContent = courseData.category || 'Без категорії';
        categoryLink.href = `category.html?category=${encodeURIComponent(courseData.category)}`;
    }
    
    // Назва курсу
    const courseTitle = document.querySelector('.course-detail-title');
    if (courseTitle) {
        courseTitle.textContent = courseData.title;
    }
    
    // Опис курсу
    const courseDescription = document.querySelector('.course-detail-description');
    if (courseDescription) {
        courseDescription.textContent = courseData.description || 'Опис відсутній';
    }
    
    const courseAboutText = document.querySelector('.course-about-text');
    if (courseAboutText) {
        courseAboutText.textContent = courseData.description || 'Опис відсутній';
    }
    
    // Зображення курсу
    const courseImage = document.querySelector('.course-img');
    if (courseImage) {
        courseImage.src = formatImageUrl(courseData.image) || 'img/default-image-course.png';
        courseImage.alt = courseData.title;
    }
    
    // Ціна курсу
    const coursePrice = document.querySelector('.course-price');
    if (coursePrice) {
        coursePrice.textContent = `₴${courseData.price}`;
    }
    
    // Кількість студентів
    const studentsCount = document.querySelector('.students-count');
    if (studentsCount) {
        studentsCount.textContent = `${courseData.students_count || 0} студентів`;
    }
    
    // Рейтинг курсу
    const ratingElement = document.querySelector('.ratings-info');
    if (ratingElement) {
        const rating = parseFloat(courseData.average_rating) || 0;
        ratingElement.textContent = rating.toFixed(1);
    }
    
    // Зірочки рейтингу
    const starsContainer = document.querySelector('.course-rating .stars');
    if (starsContainer) {
        const rating = parseFloat(courseData.average_rating) || 0;
        starsContainer.innerHTML = generateStars(rating);
    }
    
    // Кількість відгуків
    const reviewsCount = document.querySelector('.reviews-count');
    if (reviewsCount) {
        reviewsCount.textContent = `(${courseData.reviews_count || 0} відгуків)`;
    }
    
    // Дані про курс
    updateCourseDetail('Рівень складності', translateLevel(courseData.level));
    updateCourseDetail('Тривалість', courseData.duration);
    updateCourseDetail('Мова', courseData.language);
    updateCourseDetail('Категорія', courseData.category);
}

// Функція для перекладу рівня складності
function translateLevel(level) {
    switch (level) {
        case 'beginner':
            return 'Початковий';
        case 'intermediate':
            return 'Середній';
        case 'advanced':
            return 'Просунутий';
        default:
            return 'Не вказано';
    }
}

// Функція для оновлення деталей курсу
function updateCourseDetail(label, value) {
    // Знаходимо всі елементи з деталями курсу
    const detailItems = document.querySelectorAll('.course-detail-item');
    
    // Проходимо по всіх елементах і оновлюємо потрібний
    for (const item of detailItems) {
        const detailLabel = item.querySelector('.detail-label');
        if (detailLabel && detailLabel.textContent.includes(label)) {
            const detailValue = item.querySelector('.detail-value');
            if (detailValue) {
                detailValue.textContent = value || 'Не вказано';
            }
            return;
        }
    }
}

// Функція для завантаження даних про викладача
async function loadMentorDetails(mentorId) {
    try {
        // Запит на сервер для отримання даних викладача
        const response = await fetch(`/server/get_user.php?id=${mentorId}`);
        
        if (!response.ok) {
            throw new Error('Помилка при завантаженні даних викладача');
        }
        
        const mentorData = await response.json();
        
        if (mentorData.error) {
            throw new Error(mentorData.error);
        }
        
        // Відображаємо дані викладача
        displayMentorDetails(mentorData);
    } catch (error) {
        console.error('Помилка:', error);
    }
}

// Функція для відображення даних викладача
function displayMentorDetails(mentorData) {
    const mentorNameElement = document.querySelector('.instructor-name');
    const mentorRoleElement = document.querySelector('.instructor-role');
    const mentorAvatarElement = document.querySelector('.instructor-avatar');
    
    if (mentorNameElement) {
        mentorNameElement.textContent = formatMentorName(mentorData);
    }
    
    if (mentorRoleElement) {
        mentorRoleElement.textContent = mentorData.role || 'Викладач';
    }
    
    if (mentorAvatarElement) {
        const avatarUrl = mentorData.avatar ? formatImageUrl(mentorData.avatar) : 'img/avatars/default-avatar.png';
        mentorAvatarElement.src = avatarUrl;
        mentorAvatarElement.alt = `Фото ${formatMentorName(mentorData)}`;
    }
}

// Функція для форматування імені викладача
function formatMentorName(mentorData) {
    if (mentorData.first_name && mentorData.last_name) {
        return `${mentorData.first_name} ${mentorData.last_name}`;
    } else if (mentorData.first_name) {
        return mentorData.first_name;
    } else if (mentorData.last_name) {
        return mentorData.last_name;
    } else {
        return mentorData.username || 'Невідомий викладач';
    }
}

// Функція для форматування URL зображення
function formatImageUrl(imageUrl) {
    if (!imageUrl || imageUrl === '') {
        return 'img/avatars/default-avatar.png';
    }
    
    // Якщо URL вже повний, залишаємо як є
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    // Якщо URL починається з /, видаляємо його
    if (imageUrl.startsWith('/')) {
        imageUrl = imageUrl.substring(1);
    }
    
    // Повертаємо шлях як є, без додавання http://localhost/
    return imageUrl;
}

// Функція для завантаження відгуків про курс
async function loadCourseReviews(courseId) {
    try {
        // Запит на сервер для отримання відгуків
        const response = await fetch(`/server/get_course_reviews.php?course_id=${courseId}`);
        
        if (!response.ok) {
            throw new Error('Помилка при завантаженні відгуків');
        }
        
        const reviewsData = await response.json();
        
        if (reviewsData.error) {
            throw new Error(reviewsData.error);
        }
        
        // Відображаємо відгуки
        displayCourseReviews(reviewsData);
    } catch (error) {
        console.error('Помилка:', error);
    }
}

// Функція для відображення відгуків
function displayCourseReviews(reviewsData) {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) return;
    
    // Очищаємо список відгуків
    reviewsList.innerHTML = '';
    
    if (!reviewsData.length) {
        reviewsList.innerHTML = '<p class="no-reviews">Поки що немає відгуків для цього курсу.</p>';
        return;
    }
    
    // Обчислюємо середній рейтинг та розподіл зірок
    const reviewStats = calculateReviewStats(reviewsData);
    
    // Оновлюємо статистику відгуків
    updateReviewStats(reviewStats);
    
    // Додаємо кожний відгук
    reviewsData.forEach(review => {
        const reviewItem = createReviewItem(review);
        reviewsList.appendChild(reviewItem);
    });
}

// Функція для обчислення статистики відгуків
function calculateReviewStats(reviewsData) {
    const stats = {
        average: 0,
        total: reviewsData.length,
        distribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        }
    };
    
    let sum = 0;
    
    reviewsData.forEach(review => {
        sum += review.rating;
        stats.distribution[review.rating]++;
    });
    
    stats.average = sum / stats.total;
    
    return stats;
}

// Функція для оновлення статистики відгуків
function updateReviewStats(stats) {
    // Оновлюємо середній рейтинг
    const averageScore = document.querySelector('.review-average-score');
    if (averageScore) {
        averageScore.textContent = stats.average.toFixed(1);
    }
    
    // Оновлюємо кількість відгуків
    const reviewTotal = document.querySelector('.review-total');
    if (reviewTotal) {
        reviewTotal.textContent = `На основі ${stats.total} відгуків`;
    }
    
    const reviewsCount = document.querySelector('.reviews-count');
    if (reviewsCount) {
        reviewsCount.textContent = `(${stats.total} відгуків)`;
    }
    
    // Оновлюємо зірки рейтингу
    const reviewStars = document.querySelector('.reviews-average .stars');
    if (reviewStars) {
        reviewStars.innerHTML = generateStars(stats.average);
    }
    
    // Оновлюємо розподіл за зірками
    for (let i = 5; i >= 1; i--) {
        const percent = (stats.distribution[i] / stats.total * 100) || 0;
        const progressBar = document.querySelector(`.review-bar:nth-child(${6-i}) .progress`);
        const percentText = document.querySelector(`.review-bar:nth-child(${6-i}) .review-percent`);
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (percentText) {
            percentText.textContent = `${Math.round(percent)}%`;
        }
    }
}

// Функція для створення елемента відгуку
function createReviewItem(review) {
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';
    
    const date = new Date(review.created_at);
    const formattedDate = `${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}`;
    
    // Форматуємо посилання на аватарку
    const avatarUrl = review.avatar ? formatImageUrl(review.avatar) : 'img/avatars/default-avatar.png';
    
    reviewItem.innerHTML = `
        <div class="review-header">
            <img src="${avatarUrl}" alt="Аватар користувача" class="review-avatar">
            <div class="review-user-info">
                <div class="review-user-name">${review.username || 'Анонімний користувач'}</div>
                <div class="review-date">${formattedDate}</div>
            </div>
            <div class="review-rating">
                <div class="stars">
                    ${generateStars(review.rating)}
                </div>
            </div>
        </div>
        <div class="review-content">
            <p>${review.review_text || 'Без коментаря'}</p>
        </div>
    `;
    
    return reviewItem;
}

// Функція для генерації зірок рейтингу
function generateStars(rating) {
    // Переконуємося, що rating є числом
    const ratingValue = parseFloat(rating) || 0;
    let stars = '';
    
    // Округлюємо до найближчої 0.5
    const roundedRating = Math.round(ratingValue * 2) / 2;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(roundedRating)) {
            // Повна зірка
            stars += '<img class="star" src="img/star.png" alt="Зірка">';
        } else if (i - 0.5 === roundedRating) {
            // Половина зірки (можна додати іконку половини зірки, якщо вона є)
            stars += '<img class="star" src="img/star.png" alt="Зірка">';
        } else {
            // Порожня зірка
            stars += '<img class="star" src="img/gstar.png" alt="Порожня зірка">';
        }
    }
    
    return stars;
}

// Функція для отримання назви місяця українською
function getMonthName(month) {
    const months = [
        'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
        'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
    ];
    return months[month];
}

// Функція для завантаження схожих курсів
async function loadRelatedCourses(courseId) {
    try {
        // Запит на сервер для отримання схожих курсів
        const response = await fetch(`/server/get_related_courses.php?id=${courseId}`);
        
        if (!response.ok) {
            throw new Error('Помилка при завантаженні схожих курсів');
        }
        
        const relatedCourses = await response.json();
        
        if (relatedCourses.error) {
            throw new Error(relatedCourses.error);
        }
        
        // Відображаємо схожі курси
        displayRelatedCourses(relatedCourses);
    } catch (error) {
        console.error('Помилка:', error);
    }
}

// Функція для відображення схожих курсів
function displayRelatedCourses(courses) {
    const coursesList = document.querySelector('.courses-list');
    if (!coursesList) return;
    
    // Очищаємо список курсів
    coursesList.innerHTML = '';
    
    if (!courses.length) {
        coursesList.innerHTML = '<p class="no-courses">Схожих курсів не знайдено.</p>';
        return;
    }
    
    // Обмежуємо кількість курсів до 4
    const displayCourses = courses.slice(0, 4);
    
    // Додаємо кожний курс
    displayCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesList.appendChild(courseCard);
    });
}

// Функція для створення картки курсу
function createCourseCard(course) {
    const courseCard = document.createElement('article');
    courseCard.className = 'course-card';
    
    // Форматуємо посилання на зображення курсу
    const courseImage = course.image ? formatImageUrl(course.image) : 'img/default-image-course.png';
    
    // Форматуємо рейтинг
    const rating = parseFloat(course.average_rating) || 0;
    
    courseCard.innerHTML = `
        <a href="course.html?id=${course.id}" class="course-link">
            <img class="course-image" src="${courseImage}" alt="${course.title}">
            <div class="course-details">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-author">${course.mentor_name || 'Невідомий викладач'}</p>
                <div class="course-rating">
                    <div class="stars">
                        ${generateStars(rating)}
                    </div>
                    <span class="ratings-info">${rating.toFixed(1)}</span>
                </div>
                <div class="course-info">
                    <p class="course-price">₴${course.price}</p>
                </div>
            </div>
        </a>
    `;
    
    return courseCard;
}

// Функція для відображення повідомлення про помилку
function displayErrorMessage(message) {
    const courseDetail = document.querySelector('.course-detail');
    if (courseDetail) {
        courseDetail.innerHTML = `
            <div class="error-message">
                <h2>Помилка</h2>
                <p>${message}</p>
                <a href="category.html" class="back-button">Повернутися до категорій</a>
            </div>
        `;
    }
} 