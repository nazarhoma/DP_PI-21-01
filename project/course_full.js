document.addEventListener('DOMContentLoaded', function() {
  // Отримуємо ID курсу з URL
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  
  // Перевіряємо чи користувач авторизований
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (!userData.id) {
    window.location.href = 'login.html';
    return;
  }
  
  // Визначаємо базовий URL залежно від середовища
  const isProduction = window.location.hostname !== 'localhost';
  const baseUrl = isProduction ? '' : 'http://localhost:8080';
  
  // Додаємо параметр версії для уникнення кешування
  const cacheParam = `v=${Date.now()}`;
  
  // Отримуємо елементи для відображення курсу
  const courseTitle = document.querySelector('.course-full-title');
  const mentorName = document.querySelector('.mentor-name');
  const courseContent = document.querySelector('.course-sections-full');
  const chatBtn = document.querySelector('.open-chat-btn');
  const progressIndicator = document.getElementById('courseProgressIndicator');
  const progressPercentage = document.getElementById('progressPercentage');
  const dropCourseBtn = document.querySelector('.drop-course-btn');
  
  // Створюємо кнопку для продовження курсу
  const courseActionsContainer = document.querySelector('.course-actions');
  const resumeCourseBtn = document.createElement('button');
  resumeCourseBtn.className = 'resume-course-btn';
  resumeCourseBtn.textContent = 'Продовжити курс';
  resumeCourseBtn.style.backgroundColor = '#4caf50';
  resumeCourseBtn.style.color = 'white';
  resumeCourseBtn.style.border = '1px solid #4caf50';
  resumeCourseBtn.style.padding = '8px 16px';
  resumeCourseBtn.style.borderRadius = '4px';
  resumeCourseBtn.style.cursor = 'pointer';
  resumeCourseBtn.style.display = 'none';
  courseActionsContainer.appendChild(resumeCourseBtn);
  
  // Отримуємо елементи модального вікна
  const dropCourseModal = document.getElementById('dropCourseModal');
  const closeDropCourseModal = document.getElementById('closeDropCourseModal');
  const cancelDropCourse = document.getElementById('cancelDropCourse');
  const confirmDropCourse = document.getElementById('confirmDropCourse');
  
  let courseData = null;
  let sectionsData = [];
  let progressData = {
    completed: 0,
    total: 0
  };
  
  // Настроюємо модальне вікно для покидання курсу
  dropCourseBtn.addEventListener('click', function() {
    dropCourseModal.style.display = 'block';
  });
  
  closeDropCourseModal.addEventListener('click', function() {
    dropCourseModal.style.display = 'none';
  });
  
  cancelDropCourse.addEventListener('click', function() {
    dropCourseModal.style.display = 'none';
  });
  
  confirmDropCourse.addEventListener('click', function() {
    dropCourse();
  });
  
  // Додаємо обробник для кнопки продовження курсу
  resumeCourseBtn.addEventListener('click', function() {
    resumeCourse();
  });
  
  // Закриваємо модальні вікна при кліку поза ними
  window.addEventListener('click', function(event) {
    if (event.target === dropCourseModal) {
      dropCourseModal.style.display = 'none';
    }
  });
  
  // Завантажуємо інформацію про курс
  loadCourseData();
  
  function loadCourseData() {
    // Перевіряємо чи валідний courseId
    if (!courseId || isNaN(parseInt(courseId))) {
      displayError('Некоректний ID курсу. Перейдіть до списку курсів і виберіть курс знову.');
      return;
    }

    fetch(`${baseUrl}/server/get_course.php?id=${courseId}&user_id=${userData.id}&${cacheParam}`, {
      method: 'GET'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Не вдалося завантажити курс');
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        displayError(data.error || 'Не вдалося завантажити дані курсу');
      } else {
        courseData = data;
        displayCourseData(courseData);
        
        // Завантажуємо структуру курсу (секції та матеріали)
        loadCourseSyllabus();
      }
    })
    .catch(error => {
      console.error('Помилка завантаження курсу:', error);
      displayError('Помилка завантаження курсу. Спробуйте перезавантажити сторінку.');
    });
  }
  
  function loadCourseSyllabus() {
    fetch(`${baseUrl}/server/get_course_syllabus.php?course_id=${courseId}&${cacheParam}`, {
      method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        displayError(data.error || 'Не вдалося завантажити структуру курсу');
      } else {
        sectionsData = data.sections || [];
        
        // Завантажуємо прогрес користувача перед відображенням секцій
        loadUserProgress();
      }
    })
    .catch(error => {
      console.error('Помилка завантаження структури курсу:', error);
      displayError('Помилка завантаження структури курсу. Спробуйте перезавантажити сторінку.');
    });
  }
  
  function loadUserProgress() {
    const formData = new FormData();
    formData.append('course_id', courseId);
    formData.append('user_id', userData.id);
    
    fetch(`${baseUrl}/server/get_user_progress.php?${cacheParam}`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.completed_resources) {
        // Позначаємо завершені ресурси в структурі курсу
        updateCompletedResources(data.completed_resources);
      }
      
      // Відображаємо секції з урахуванням прогресу
      displayCourseSections(sectionsData);
      
      // Оновлюємо відображення прогресу
      updateProgressUI(data.progress || 0);
    })
    .catch(error => {
      console.error('Помилка отримання прогресу:', error);
      // Відображаємо секції без прогресу
      displayCourseSections(sectionsData);
      updateProgressUI(0);
    });
  }
  
  function updateCompletedResources(completedResourceIds) {
    // Позначаємо ресурси як завершені на основі даних з сервера
    sectionsData.forEach(section => {
      if (section.resources && section.resources.length > 0) {
        section.resources.forEach(resource => {
          resource.completed = completedResourceIds.includes(resource.id);
        });
        
        // Перевіряємо, чи всі ресурси в секції завершені
        section.all_completed = section.resources.every(resource => resource.completed);
      } else {
        section.all_completed = false;
      }
    });
  }
  
  function updateProgressUI(progress) {
    // Встановлюємо прогрес на індикаторі
    progressIndicator.style.width = `${progress}%`;
    progressPercentage.textContent = `${progress}%`;
    
    // Також можемо змінити класи або інші атрибути на основі прогресу
    if (progress === 100) {
      progressIndicator.classList.add('completed');
    }
  }
  
  function displayCourseData(course) {
    // Встановлюємо заголовок і назву ментора
    courseTitle.textContent = course.title;
    mentorName.textContent = course.author || '';
    
    // Налаштовуємо кнопку чату
    if (course.mentor_id) {
      chatBtn.style.display = 'flex';
      chatBtn.addEventListener('click', () => {
        window.location.href = `chats.html?mentor_id=${course.mentor_id}`;
      });
    }
    
    // Керуємо відображенням кнопок відповідно до статусу курсу
    if (course.status === 'completed') {
      // Для завершених курсів приховуємо обидві кнопки
      dropCourseBtn.style.display = 'none';
      if (resumeCourseBtn) resumeCourseBtn.style.display = 'none';
    } else if (course.status === 'dropped') {
      // Для курсів, які покинули, показуємо кнопку відновлення
      dropCourseBtn.style.display = 'none';
      if (resumeCourseBtn) resumeCourseBtn.style.display = 'block';
    } else {
      // Для активних курсів (status === 'active') показуємо кнопку покинути
      dropCourseBtn.style.display = 'block';
      if (resumeCourseBtn) resumeCourseBtn.style.display = 'none';
    }
  }
  
  function displayCourseSections(sections) {
    if (!sections || sections.length === 0) {
      courseContent.innerHTML = '<p>Для цього курсу ще не додано матеріали.</p>';
      return;
    }
    
    courseContent.innerHTML = '';
    progressData.total = 0;
    progressData.completed = 0;
    
    sections.forEach((section, index) => {
      const sectionElement = document.createElement('div');
      sectionElement.className = 'course-section-full';
      sectionElement.setAttribute('data-section-id', section.id);
      
      // Початковий стан - розгорнуто тільки першу секцію
      const isExpanded = index === 0;
      
      // Створюємо чекбокс для секції
      const sectionCheckboxId = `section-checkbox-${section.id}`;
      const sectionCheckbox = section.all_completed ? 'checked' : '';
      
      // Створюємо ресурси секції
      let resourcesHTML = '';
      if (section.resources && section.resources.length > 0) {
        progressData.total += section.resources.length;
        
        section.resources.forEach(resource => {
          if (resource.completed) {
            progressData.completed++;
          }
          
          const resourceCheckboxId = `resource-checkbox-${resource.id}`;
          const resourceCheckbox = resource.completed ? 'checked' : '';
          
          resourcesHTML += `
            <div class="resource-full" data-resource-id="${resource.id}">
              <div class="resource-header">
                <div class="resource-checkbox-container">
                  <input type="checkbox" id="${resourceCheckboxId}" class="resource-checkbox" 
                         data-resource-id="${resource.id}" ${resourceCheckbox}>
                  <label for="${resourceCheckboxId}"></label>
                </div>
                <h3 class="resource-title">${resource.title}</h3>
              </div>
              <div class="resource-content">
                ${renderResource(resource)}
              </div>
            </div>
          `;
        });
      } else {
        resourcesHTML = '<p>У цьому розділі ще немає матеріалів.</p>';
      }
      
      // Створюємо HTML структуру секції
      sectionElement.innerHTML = `
        <div class="section-header" data-toggle="section">
          <div class="section-checkbox-container">
            <input type="checkbox" id="${sectionCheckboxId}" class="section-checkbox" 
                   data-section-id="${section.id}" ${sectionCheckbox} disabled>
            <label for="${sectionCheckboxId}"></label>
          </div>
          <h2>${section.title}</h2>
          <span class="section-toggle">${isExpanded ? '▼' : '▶'}</span>
        </div>
        <div class="section-description">${section.description || ''}</div>
        <div class="section-resources-full" style="display:${isExpanded ? 'block' : 'none'}">
          ${resourcesHTML}
        </div>
      `;
      
      courseContent.appendChild(sectionElement);
      
      // Додаємо обробник для згортання/розгортання секції
      const toggleHeader = sectionElement.querySelector('.section-header');
      toggleHeader.addEventListener('click', function(e) {
        // Ігноруємо клік на чекбоксі
        if (e.target.type === 'checkbox') return;
        
        const resourcesBlock = this.parentElement.querySelector('.section-resources-full');
        const toggleIcon = this.querySelector('.section-toggle');
        
        if (resourcesBlock.style.display === 'none' || resourcesBlock.style.display === '') {
          resourcesBlock.style.display = 'block';
          toggleIcon.textContent = '▼';
        } else {
          resourcesBlock.style.display = 'none';
          toggleIcon.textContent = '▶';
        }
      });
    });
    
    // Додаємо обробники для чекбоксів ресурсів
    setupResourceCheckboxHandlers();
    
    // Оновлюємо прогрес
    const progress = Math.round((progressData.completed / progressData.total) * 100) || 0;
    updateProgressUI(progress);
  }
  
  function setupResourceCheckboxHandlers() {
    document.querySelectorAll('.resource-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const resourceId = this.getAttribute('data-resource-id');
        const isChecked = this.checked;
        
        if (isChecked) {
          markResourceAsCompleted(resourceId, this);
        } else {
          markResourceAsIncomplete(resourceId, this);
        }
      });
    });
  }
  
  function markResourceAsCompleted(resourceId, checkbox) {
    const formData = new FormData();
    formData.append('resource_id', resourceId);
    formData.append('user_id', userData.id);
    formData.append('course_id', courseId);
    
    fetch(`${baseUrl}/server/mark_resource_completed.php?${cacheParam}`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Позначаємо ресурс як виконаний в UI
        const resourceElement = checkbox.closest('.resource-full');
        resourceElement.classList.add('completed');
        
        // Оновлюємо прогрес
        progressData.completed++;
        const progress = Math.round((progressData.completed / progressData.total) * 100);
        updateProgressUI(progress);
        
        // Перевіряємо, чи всі ресурси в цій секції завершені
        checkSectionCompletion(resourceElement);
      } else {
        // Повертаємо чекбокс у невідмічений стан у випадку помилки
        checkbox.checked = false;
        alert('Не вдалося відмітити ресурс як виконаний. ' + data.message);
      }
    })
    .catch(error => {
      checkbox.checked = false;
      console.error('Помилка відмітки ресурсу:', error);
      alert('Не вдалося відмітити ресурс. Спробуйте ще раз.');
    });
  }
  
  function markResourceAsIncomplete(resourceId, checkbox) {
    const formData = new FormData();
    formData.append('resource_id', resourceId);
    formData.append('user_id', userData.id);
    formData.append('course_id', courseId);
    
    fetch(`${baseUrl}/server/unmark_resource_completed.php?${cacheParam}`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Позначаємо ресурс як невиконаний в UI
        const resourceElement = checkbox.closest('.resource-full');
        resourceElement.classList.remove('completed');
        
        // Оновлюємо прогрес
        progressData.completed--;
        const progress = Math.round((progressData.completed / progressData.total) * 100);
        updateProgressUI(progress);
        
        // Знімаємо відмітку з секції
        const sectionElement = resourceElement.closest('.course-section-full');
        const sectionCheckbox = sectionElement.querySelector('.section-checkbox');
        sectionCheckbox.checked = false;
      } else {
        // Повертаємо чекбокс у відмічений стан у випадку помилки
        checkbox.checked = true;
        alert('Не вдалося зняти відмітку виконання. ' + data.message);
      }
    })
    .catch(error => {
      checkbox.checked = true;
      console.error('Помилка зняття відмітки ресурсу:', error);
      alert('Не вдалося зняти відмітку виконання. Спробуйте ще раз.');
    });
  }
  
  function checkSectionCompletion(resourceElement) {
    const sectionElement = resourceElement.closest('.course-section-full');
    const allResources = sectionElement.querySelectorAll('.resource-checkbox');
    const allCompleted = Array.from(allResources).every(checkbox => checkbox.checked);
    
    // Якщо всі ресурси в секції виконані, відмічаємо чекбокс секції
    const sectionCheckbox = sectionElement.querySelector('.section-checkbox');
    sectionCheckbox.checked = allCompleted;
  }
  
  function dropCourse() {
    const formData = new FormData();
    formData.append('user_id', userData.id);
    formData.append('course_id', courseId);
    formData.append('status', 'dropped');
    
    fetch(`${baseUrl}/server/drop_course.php?${cacheParam}`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Закриваємо модальне вікно
        dropCourseModal.style.display = 'none';
        
        // Повідомляємо користувача про успішну дію
        alert('Ви успішно покинули курс.');
        
        // Перенаправляємо на сторінку профілю
        window.location.href = 'profile.html';
      } else {
        alert('Не вдалося покинути курс: ' + (data.message || 'Сталася помилка'));
      }
    })
    .catch(error => {
      console.error('Помилка покидання курсу:', error);
      alert('Не вдалося покинути курс. Спробуйте ще раз пізніше.');
    });
  }
  
  function resumeCourse() {
    const formData = new FormData();
    formData.append('user_id', userData.id);
    formData.append('course_id', courseId);
    formData.append('status', 'active');
    
    fetch(`${baseUrl}/server/drop_course.php?${cacheParam}`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Повідомляємо користувача про успішну дію
        alert('Ви успішно відновили навчання на курсі.');
        
        // Перезавантажуємо сторінку для оновлення інтерфейсу
        window.location.reload();
      } else {
        alert('Не вдалося відновити курс: ' + (data.message || 'Сталася помилка'));
      }
    })
    .catch(error => {
      console.error('Помилка відновлення курсу:', error);
      alert('Не вдалося відновити курс. Спробуйте ще раз пізніше.');
    });
  }
  
  function displayError(message) {
    courseTitle.textContent = 'Помилка завантаження курсу';
    courseContent.innerHTML = `<div class="error-message">${message}</div>`;
  }
});

function renderResource(res) {
  try {
    switch (res.type) {
      case 'video':
        if (res.resource_url && res.resource_url.includes('youtube')) {
          // YouTube embed
          const videoId = res.resource_url.split('v=')[1]?.split('&')[0];
          if (!videoId) {
            return `<div class="resource-error">Невірний формат відео URL</div>`;
          }
          return `<div class="resource-video-container">
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" allowfullscreen
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    </iframe>
                    <div class="resource-error" style="display:none;">Не вдалося завантажити відео. Перевірте підключення до мережі.</div>
                  </div>`;
        } else if (res.resource_url) {
          // HTML5 video
          return `<div class="resource-video-container">
                    <video controls width="100%" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                      <source src="${res.resource_url}" onerror="this.parentElement.style.display='none'; this.parentElement.nextElementSibling.style.display='block';">
                      Ваш браузер не підтримує відео тег.
                    </video>
                    <div class="resource-error" style="display:none;">Не вдалося завантажити відео. Перевірте підключення до мережі.</div>
                  </div>`;
        } else {
          return `<div class="resource-error">Відео недоступне</div>`;
        }
      case 'document':
        return `<div class="resource-document">
                  <a href="${res.resource_url}" target="_blank" class="document-link" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                     Відкрити документ
                  </a>
                  <div class="resource-error" style="display:none;">Не вдалося завантажити документ.</div>
                </div>`;
      case 'image':
        return `<div class="resource-image-container">
                  <img src="${res.resource_url}" alt="${res.title}" style="max-width:100%;" 
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                  <div class="resource-error" style="display:none;">Не вдалося завантажити зображення.</div>
                </div>`;
      case 'text':
        return `<div class="resource-text">${res.content || '<div class="resource-error">Текстовий ресурс недоступний</div>'}</div>`;
      case 'quiz':
        return `<div class="resource-quiz">${res.content || '<div class="resource-error">Тест буде доступний пізніше.</div>'}</div>`;
      default:
        return `<div class="resource-error">Невідомий тип ресурсу</div>`;
    }
  } catch (error) {
    console.error('Помилка рендерингу ресурсу:', error);
    return `<div class="resource-error">Не вдалося відобразити ресурс. ${error.message}</div>`;
  }
} 