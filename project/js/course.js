document.addEventListener('DOMContentLoaded', function() {
  initTabs();
  loadCourseSyllabus();
  loadCourseResources();
});

// Ініціалізація вкладок на сторінці курсу
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Видаляємо активний клас з усіх кнопок та панелей
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      // Додаємо активний клас до натиснутої кнопки та відповідної панелі
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Активуємо першу вкладку за замовчуванням
  if (tabButtons.length > 0) {
    tabButtons[0].click();
  }
}

// Завантаження навчального плану курсу
function loadCourseSyllabus() {
  const syllabusContainer = document.getElementById('syllabus-content');
  if (!syllabusContainer) return;

  const courseId = new URLSearchParams(window.location.search).get('id');
  if (!courseId) return;

  fetch(`api/get_course_syllabus.php?course_id=${courseId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        renderSyllabus(syllabusContainer, data.syllabus);
        updateSyllabusStats(data.syllabus);
      } else {
        syllabusContainer.innerHTML = `<div class="error-message">${data.message || 'Не вдалося завантажити навчальний план'}</div>`;
      }
    })
    .catch(error => {
      console.error('Помилка при завантаженні навчального плану:', error);
      syllabusContainer.innerHTML = '<div class="error-message">Виникла помилка при завантаженні даних. Спробуйте пізніше.</div>';
    });
}

// Відображення статистики навчального плану
function updateSyllabusStats(syllabus) {
  const sectionsCount = syllabus.length;
  let lessonsCount = 0;
  let totalDuration = 0;

  syllabus.forEach(section => {
    lessonsCount += section.lessons.length;
    section.lessons.forEach(lesson => {
      totalDuration += lesson.duration || 0;
    });
  });

  // Форматуємо тривалість
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;
  const formattedDuration = `${hours}г ${minutes}хв`;

  document.querySelector('.sections-count .stat-value').textContent = sectionsCount;
  document.querySelector('.lessons-count .stat-value').textContent = lessonsCount;
  document.querySelector('.total-duration .stat-value').textContent = formattedDuration;
}

// Відображення навчального плану
function renderSyllabus(container, syllabus) {
  if (!syllabus || syllabus.length === 0) {
    container.innerHTML = '<p class="no-content">Навчальний план ще не додано</p>';
    return;
  }

  let html = '<div class="syllabus-sections">';

  syllabus.forEach((section, index) => {
    // Розрахунок загальної тривалості розділу
    let sectionDuration = 0;
    section.lessons.forEach(lesson => {
      sectionDuration += lesson.duration || 0;
    });

    // Форматування тривалості розділу
    const hours = Math.floor(sectionDuration / 60);
    const minutes = sectionDuration % 60;
    const formattedDuration = `${hours > 0 ? hours + 'г ' : ''}${minutes}хв`;

    html += `
      <div class="syllabus-section" data-section-id="${section.id}">
        <div class="section-header">
          <div class="section-header-left">
            <div class="section-number">${index + 1}</div>
            <div class="section-title">${section.title}</div>
          </div>
          <div class="section-header-right">
            <div class="section-lessons-count">
              <i class="fas fa-book"></i>
              <span>${section.lessons.length} уроків</span>
            </div>
            <div class="section-duration">
              <i class="fas fa-clock"></i>
              <span>${formattedDuration}</span>
            </div>
            <div class="section-toggle">
              <i class="fas fa-chevron-down"></i>
            </div>
          </div>
        </div>
        <div class="section-content">
          <ul class="lesson-list">
            ${renderLessonsList(section.lessons)}
          </ul>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;

  // Додаємо обробники подій для розгортання/згортання розділів
  attachSectionToggleHandlers();
}

// Відображення списку уроків
function renderLessonsList(lessons) {
  if (!lessons || lessons.length === 0) {
    return '<li class="no-lessons">У цьому розділі ще немає уроків</li>';
  }

  let html = '';
  lessons.forEach((lesson, index) => {
    const lessonIcon = lesson.type === 'video' 
      ? '<i class="fas fa-play-circle"></i>' 
      : '<i class="fas fa-file-alt"></i>';

    const duration = lesson.duration 
      ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` 
      : '00:00';

    html += `
      <li class="lesson-item" data-lesson-id="${lesson.id}">
        <div class="lesson-icon">${lessonIcon}</div>
        <div class="lesson-title">${lesson.title}</div>
        ${lesson.preview ? '<div class="lesson-preview">Перегляд</div>' : ''}
        <div class="lesson-duration">${duration}</div>
      </li>
    `;
  });

  return html;
}

// Прикріплення обробників подій для розділів
function attachSectionToggleHandlers() {
  const sectionHeaders = document.querySelectorAll('.section-header');
  
  sectionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.syllabus-section');
      section.classList.toggle('expanded');
    });
  });

  // Додаємо обробники для кнопок перегляду уроків
  const previewButtons = document.querySelectorAll('.lesson-preview');
  previewButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const lessonId = button.closest('.lesson-item').getAttribute('data-lesson-id');
      openLessonPreview(lessonId);
    });
  });
}

// Відкриття прев'ю уроку
function openLessonPreview(lessonId) {
  // Тут буде логіка відкриття модального вікна з прев'ю уроку
  console.log(`Відкриття прев'ю уроку з ID: ${lessonId}`);
  // Можна реалізувати модальне вікно або перехід на сторінку уроку
}

// Завантаження ресурсів курсу
function loadCourseResources() {
  const resourcesContainer = document.getElementById('course-resources-list');
  if (!resourcesContainer) return;

  const courseId = new URLSearchParams(window.location.search).get('id');
  if (!courseId) return;

  fetch(`api/get_course_resources.php?course_id=${courseId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.resources) {
        renderResources(resourcesContainer, data.resources);
      } else {
        resourcesContainer.innerHTML = '<p class="no-resources">Для цього курсу ще немає доступних ресурсів</p>';
      }
    })
    .catch(error => {
      console.error('Помилка при завантаженні ресурсів курсу:', error);
      resourcesContainer.innerHTML = '<p class="error-message">Виникла помилка при завантаженні ресурсів</p>';
    });
}

// Відображення ресурсів курсу
function renderResources(container, resources) {
  if (!resources || resources.length === 0) {
    container.innerHTML = '<p class="no-resources">Для цього курсу ще немає доступних ресурсів</p>';
    return;
  }

  let html = '';
  resources.forEach(resource => {
    // Визначаємо іконку відповідно до типу ресурсу
    let icon = '';
    switch (resource.type) {
      case 'pdf':
        icon = '<i class="fas fa-file-pdf resource-icon"></i>';
        break;
      case 'doc':
      case 'docx':
        icon = '<i class="fas fa-file-word resource-icon"></i>';
        break;
      case 'xls':
      case 'xlsx':
        icon = '<i class="fas fa-file-excel resource-icon"></i>';
        break;
      case 'zip':
      case 'rar':
        icon = '<i class="fas fa-file-archive resource-icon"></i>';
        break;
      default:
        icon = '<i class="fas fa-file resource-icon"></i>';
    }

    html += `
      <div class="resource-item">
        ${icon}
        <div class="resource-title">${resource.title}</div>
        <div class="resource-download" data-resource-id="${resource.id}" data-resource-url="${resource.url}">
          Завантажити
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Додаємо обробники подій для кнопок завантаження
  const downloadButtons = container.querySelectorAll('.resource-download');
  downloadButtons.forEach(button => {
    button.addEventListener('click', function() {
      const resourceUrl = this.getAttribute('data-resource-url');
      if (resourceUrl) {
        window.open(resourceUrl, '_blank');
      }
    });
  });
} 