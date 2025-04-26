const allCoursesUrl = '/server/get_all_courses.php';
const topCoursesUrl = '/server/get_top_courses.php';
const topInstructorsUrl = '/server/get_top_instructors.php';
const topReviewsUrl = '/server/get_top_reviews.php';
const coursesPerPage = 12;
let currentPage = 1;
let totalCourses = 0;
let coursesData = [];
// Змінюємо базовий URL
const baseUrl = '';

// Функція для створення картки курсу
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

    return card;
}

function renderCourses(page = 1) {
    const start = (page - 1) * coursesPerPage;
    const end = start + coursesPerPage;
    const coursesList = document.querySelector('.courses-list');
    
    // Перевіряємо, що є список курсів
    if (!coursesList) return;
    
    coursesList.innerHTML = '';

    const pageCourses = coursesData.slice(start, end);
    pageCourses.forEach(course => {
        const card = createCourseCard(course);
        coursesList.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalCourses / coursesPerPage);
    
    pagination.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<img src="img/bleft-chevron.png" alt="Попередня">';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderCourses(currentPage);
        }
    });
    pagination.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        if (i === currentPage) button.classList.add('disabled');
        button.addEventListener('click', () => {
            if (i !== currentPage) {
                currentPage = i;
                renderCourses(i);
            }
        });
        pagination.appendChild(button);
    }

    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<img src="img/bright-chevron.png" alt="Наступна">';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderCourses(currentPage);
        }
    });
    pagination.appendChild(nextButton);
}

async function loadAllCourses() {
    try {
        const response = await fetch(allCoursesUrl);
        const data = await response.json();
        
        if (data.success) {
            coursesData = data.courses;
            totalCourses = coursesData.length;
            renderCourses();
        } else {
            console.error('Помилка отримання курсів:', data.message);
        }
    } catch (error) {
        console.error('Помилка завантаження курсів:', error);
    }
}

async function loadTopCourses() {
    try {
        const response = await fetch(topCoursesUrl);
        const data = await response.json();
        
        if (data.success) {
            const topCoursesList = document.querySelector('.top-courses .courses-list');
            if (topCoursesList) {
                topCoursesList.innerHTML = '';
                data.courses.forEach(course => {
                    const card = createCourseCard(course);
                    topCoursesList.appendChild(card);
                });
            }
        } else {
            console.error('Помилка отримання найкращих курсів:', data.message);
        }
    } catch (error) {
        console.error('Помилка завантаження найкращих курсів:', error);
    }
}

function createInstructorCard(instructor) {
    const card = document.createElement('article');
    card.className = 'instructor-card';

    // Отримуємо повний URL для аватарки інструктора
    const avatarUrl = getFullAvatarUrl(instructor.image);
    
    // Перевіряємо, чи є студенти (може бути undefined, null, 0)
    const hasStudents = instructor.students !== undefined && instructor.students !== null && instructor.students > 0;
    
    // Якщо студентів немає - зірка сіра, інакше - золота
    const starImg = !hasStudents ? 'img/gstar.png' : 'img/star.png';
    const starAlt = !hasStudents ? 'Сіра зірка' : 'Зірка';
    
    // Записуємо у змінну для відображення кількість студентів (може бути undefined)
    const studentsCount = instructor.students || 0;

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

    return card;
}

async function loadInstructors() {
    try {
        const response = await fetch(topInstructorsUrl);
        const data = await response.json();
        const instructorsList = document.querySelector('.instructors-list');
        
        if (instructorsList && data.success) {
            instructorsList.innerHTML = '';
            data.instructors.forEach(instructor => {
                const card = createInstructorCard(instructor);
                instructorsList.appendChild(card);
            });
        } else {
            console.error('Помилка отримання інструкторів:', data.message);
        }
    } catch (error) {
        console.error('Помилка завантаження інструкторів:', error);
    }
}

// Функція для отримання повного URL аватару
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

function createReviewCard(review) {
    const card = document.createElement('article');
    card.className = 'comment-card';

    // Створюємо HTML для зірок рейтингу
    let starsHTML = '';
    
    // Перевіряємо, чи є відгуки (врахування різних можливих назв поля)
    const hasReviews = (review.reviews !== undefined && review.reviews !== null && review.reviews > 0) || 
                       (review.reviews_count !== undefined && review.reviews_count !== null && review.reviews_count > 0);
    
    if (!hasReviews) {
        // Якщо відгуків немає, всі зірки сірі
        for (let i = 0; i < 5; i++) {
            starsHTML += '<img class="star" src="img/gstar.png" alt="Сіра зірка">';
        }
    } else {
        // Відгуки є, відображаємо золоті зірки відповідно до рейтингу
        const rating = Math.round(review.rating || 0); // Округлення рейтингу, за замовчуванням 0
        
        // Додаємо золоті зірки для рейтингу
        for (let i = 0; i < rating; i++) {
            starsHTML += '<img class="star" src="img/star.png" alt="Зірка">';
        }
        
        // Додаємо сірі зірки до загальної кількості 5
        for (let i = rating; i < 5; i++) {
            starsHTML += '<img class="star" src="img/gstar.png" alt="Сіра зірка">';
        }
    }

    // Отримуємо повний URL для аватарки
    const avatarUrl = getFullAvatarUrl(review.avatar);

    card.innerHTML = `
        <img class="quotes" src="img/quotes.png" alt="Цитата">
        <p class="comment-text">"${review.text}"</p>
        <div class="comment-info">
            <img class="customer-img" src="${avatarUrl}" alt="Фото клієнта">
            <div class="customer-info">
                <h2 class="customer-name">${review.name}</h2>
                <div class="stars review-stars">${starsHTML}</div>
            </div>
        </div>
    `;

    return card;
}

async function loadTopReviews() {
    try {
        const response = await fetch(topReviewsUrl);
        const data = await response.json();
        
        if (data.success) {
            const reviewsList = document.querySelector('.comments-list');
            if (reviewsList) {
                reviewsList.innerHTML = '';
                // Обмежуємо кількість відгуків до 5
                const reviews = data.reviews.slice(0, 5);
                reviews.forEach(review => {
                    const card = createReviewCard(review);
                    reviewsList.appendChild(card);
                });
            }
        } else {
            console.error('Помилка отримання відгуків:', data.message);
        }
    } catch (error) {
        console.error('Помилка завантаження відгуків:', error);
    }
}

function initializeCoursesPage() {
    const isCoursesPage = document.querySelector('.courses-pagination');
    
    if (isCoursesPage) {
        loadAllCourses();
    }

    const topCoursesSection = document.querySelector('.top-courses');
    
    if (topCoursesSection) {
        loadTopCourses();
    }

    const instructorsSection = document.querySelector('.top-instructors');
    
    if (instructorsSection) {
        loadInstructors();
    }

    const reviewsSection = document.querySelector('.top-comments');
    
    if (reviewsSection) {
        loadTopReviews();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCoursesPage();
});