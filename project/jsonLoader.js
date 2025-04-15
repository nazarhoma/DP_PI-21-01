const jsonUrl = 'courses.json';
const instructorsJsonUrl = 'instructors.json';
const coursesPerPage = 12;
let currentPage = 1;
let totalCourses = 0;
let coursesData = [];

// Функція для створення картки курсу
function createCourseCard(course) {
    const card = document.createElement('article');
    card.className = 'course-card jcsb';

    card.innerHTML = `
        <img class="course-image" src="${course.image}" alt="${course.title}">
        <div class="course-details">
          <h3 class="course-title">${course.title}</h3>
          <p class="course-author">Автор: ${course.author}</p>
          <div class="course-rating">
            <div class="stars">${'\n'.repeat(course.rating).split('\n').map(() => `<img class="star" src="img/star.png" alt="Зірка">`).join('')}</div>
            <span class="rating-info">(${course.reviews} відгуків)</span>
          </div>
          <p class="course-info">${course.info}</p>
          <p class="course-price">$${course.price}</p>
        </div>
      `;

    return card;
}

function renderCourses(page = 1) {
    const start = (page - 1) * coursesPerPage;
    const end = start + coursesPerPage;
    const coursesList = document.querySelector('.courses-list');
    coursesList.innerHTML = '';

    const pageCourses = coursesData.slice(start, end);
    pageCourses.forEach(course => {
        const card = createCourseCard(course);
        coursesList.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(totalCourses / coursesPerPage);
    const pagination = document.querySelector('.pagination');
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

async function loadCourses() {
    try {
        const response = await fetch(jsonUrl);
        coursesData = await response.json();
        totalCourses = coursesData.length;
        renderCourses();
    } catch (error) {
        console.error('Помилка завантаження курсів:', error);
    }
}

function createInstructorCard(instructor) {
    const card = document.createElement('article');
    card.className = 'instructor-card';

    card.innerHTML = `
        <div class="instructor">
          <img class="instructor-img" src="${instructor.image}" alt="Фото інструктора">
          <div class="instructor-info">
            <div class="instructor-title">
              <h3 class="instructor-name">${instructor.name}</h3>
              <p class="instructor-role">${instructor.role}</p>
            </div>
            <hr class="instructor-line">
            <div class="instructors-rating">
              <div class="instructor-rating">
                <img class="star" src="img/star.png" alt="Зірка">
                <span class="ratings-info">${instructor.rating}</span>
              </div>
              <span class="instructor-students">${instructor.students} студентів</span>
            </div>
          </div>
        </div>
      `;

    return card;
}

async function loadInstructors() {
    try {
        const response = await fetch(instructorsJsonUrl);
        const instructorsData = await response.json();
        const instructorsList = document.querySelector('.instructors-list');

        instructorsData.forEach(instructor => {
            const card = createInstructorCard(instructor);
            instructorsList.appendChild(card);
        });
    } catch (error) {
        console.error('Помилка завантаження інструкторів:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    loadInstructors();
});