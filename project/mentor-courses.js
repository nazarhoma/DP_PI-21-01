document.addEventListener('DOMContentLoaded', function() {
    // Константи
    const API_ROOT = '../server';
    
    // Елементи DOM
    const coursesList = document.getElementById('courses-list');
    const emptyCourses = document.getElementById('empty-courses-message');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const coursesSidebar = document.getElementById('courses-sidebar');
    const courseEditorPlaceholder = document.getElementById('course-editor-placeholder');
    const courseEditorContent = document.getElementById('course-editor-content');
    const editCourseForm = document.getElementById('edit-course-form');
    const addSectionBtn = document.getElementById('add-section-btn');
    const courseSectionsContainer = document.getElementById('course-sections-container');
    
    // Модальні вікна
    const resourceModal = document.getElementById('resourceModal');
    const resourceForm = document.getElementById('resourceForm');
    const closeResourceModal = document.getElementById('closeResourceModal');
    const resourceType = document.getElementById('resource-type');
    const resourceTextField = document.getElementById('resource-text-field');
    const resourceUrlField = document.getElementById('resource-url-field');
    const resourceFileField = document.getElementById('resource-file-field');
    
    // Перевірка авторизації та ролі користувача
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) {
        window.location.href = 'login.html';
        return;
    }
    
    // Перевірка ролі користувача
    if (userData.role !== 'mentor' && userData.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Ініціалізація сторінки
    initPage();
    
    /**
     * Ініціалізує сторінку та завантажує необхідні дані
     */
    function initPage() {
        // Завантаження списку курсів ментора
        loadMentorCourses();
        
        // Завантаження категорій, мов та рівнів складності
        loadCategories();
        loadLanguages();
        loadDifficultyLevels();
        
        // Ініціалізація обробників подій
        initEventListeners();
    }
    
    /**
     * Ініціалізує обробники подій
     */
    function initEventListeners() {
        // Згортання/розгортання сайдбару
        toggleSidebarBtn.addEventListener('click', function() {
            coursesSidebar.classList.toggle('collapsed');
            
            // Змінюємо напрямок іконки
            const svg = toggleSidebarBtn.querySelector('svg');
            if (coursesSidebar.classList.contains('collapsed')) {
                svg.innerHTML = '<path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            } else {
                svg.innerHTML = '<path d="M15 19L8 12L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            }
        });
        
        // Відображення/приховування сайдбару в залежності від розміру екрану
        const mediaQuery = window.matchMedia('(max-width: 900px)');
        function handleScreenSizeChange(e) {
            if (!e.matches) {
                // Екран широкий - розгорнути сайдбар
                coursesSidebar.classList.remove('collapsed');
                toggleSidebarBtn.style.display = 'none'; // Приховуємо кнопку згортання
            } else {
                // Екран вузький - показуємо кнопку згортання
                toggleSidebarBtn.style.display = '';
            }
        }
        // Перевіряємо розмір екрану при завантаженні
        handleScreenSizeChange(mediaQuery);
        // Додаємо обробник для зміни розміру екрану
        mediaQuery.addEventListener('change', handleScreenSizeChange);
        
        // Доступність пошуку в залежності від розміру екрану
        const searchMediaQuery = window.matchMedia('(min-width: 768px)');
        const searchBtn = document.querySelector('.search-btn');
        const searchBar = document.querySelector('.search-bar');
        
        function handleSearchVisibility(e) {
            if (e.matches) {
                // На широких екранах завжди показуємо пошук
                searchBar.style.display = 'flex';
                searchBtn.style.display = 'none';
            } else {
                // На мобільних приховуємо пошук і показуємо кнопку
                searchBar.style.display = 'none';
                searchBtn.style.display = 'block';
            }
        }
        
        // Перевіряємо розмір екрану при завантаженні
        handleSearchVisibility(searchMediaQuery);
        // Додаємо обробник для зміни розміру екрану
        searchMediaQuery.addEventListener('change', handleSearchVisibility);
        
        // Кнопка пошуку на мобільних
        searchBtn.addEventListener('click', function() {
            if (searchBar.style.display === 'none' || searchBar.style.display === '') {
                searchBar.style.display = 'flex';
            } else {
                searchBar.style.display = 'none';
            }
        });
        
        // Відправка форми редагування курсу
        editCourseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateCourse();
        });
        
        // Додавання нової секції
        addSectionBtn.addEventListener('click', function() {
            addSection();
        });
        
        // Перегляд зображення перед завантаженням
        const courseImageInput = document.getElementById('edit-course-image');
        courseImageInput.addEventListener('change', function() {
            previewImage(this);
        });
        
        // Зміна типу ресурсу в модальному вікні
        resourceType.addEventListener('change', function() {
            toggleResourceFields();
        });
        
        // Закриття модального вікна ресурсу
        closeResourceModal.addEventListener('click', function() {
            resourceModal.classList.remove('show');
        });
        
        // Відправка форми ресурсу
        resourceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveResource();
        });
        
        // Модальне вікно вибору типу ресурсу
        const resourceTypeModal = document.getElementById('resourceTypeModal');
        const closeResourceTypeModal = document.getElementById('closeResourceTypeModal');
        const addTextResourceBtn = document.getElementById('add-text-resource-btn');
        const addFileResourceBtn = document.getElementById('add-file-resource-btn');
        
        // Закриття модального вікна вибору типу ресурсу
        closeResourceTypeModal.addEventListener('click', function() {
            resourceTypeModal.classList.remove('show');
        });
        
        // Вибір типу ресурсу
        addTextResourceBtn.addEventListener('click', function() {
            resourceTypeModal.classList.remove('show');
            const sectionId = resourceTypeModal.dataset.sectionId;
            openResourceModal(sectionId, null, 'text');
        });
        
        addFileResourceBtn.addEventListener('click', function() {
            resourceTypeModal.classList.remove('show');
            const sectionId = resourceTypeModal.dataset.sectionId;
            openResourceModal(sectionId, null, 'file');
        });
    }
    
    /**
     * Завантажує список курсів ментора
     */
    async function loadMentorCourses() {
        try {
            const response = await fetch(`${API_ROOT}/get_mentor_courses.php?mentor_id=${userData.id}`);
            const data = await response.json();
            
            if (data.success && data.courses.length > 0) {
                renderCoursesList(data.courses);
                emptyCourses.style.display = 'none';
            } else {
                coursesList.innerHTML = '';
                emptyCourses.style.display = 'block';
            }
        } catch (error) {
            console.error('Помилка при завантаженні курсів:', error);
            coursesList.innerHTML = '<p class="error-message">Помилка при завантаженні курсів. Спробуйте оновити сторінку.</p>';
        }
    }
    
    /**
     * Відображає список курсів ментора
     * @param {Array} courses - Масив курсів
     */
    function renderCoursesList(courses) {
        coursesList.innerHTML = '';
        
        courses.forEach(course => {
            const courseItem = document.createElement('div');
            courseItem.className = 'course-item';
            courseItem.dataset.id = course.id;
            
            // Шлях до зображення курсу
            const imageUrl = course.image_url || 'img/courses/default-course.jpg';
            
            courseItem.innerHTML = `
                <div class="course-item-title">${course.title}</div>
                <div class="course-item-info">
                    <span>${new Date(course.created_at).toLocaleDateString()}</span>
                </div>
            `;
            
            courseItem.addEventListener('click', function() {
                // Зняти активний клас з усіх курсів
                document.querySelectorAll('.course-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Додати активний клас поточному курсу
                courseItem.classList.add('active');
                
                // Завантажити деталі курсу для редагування
                loadCourseDetails(course.id);
            });
            
            coursesList.appendChild(courseItem);
        });
    }
    
    /**
     * Завантажує деталі курсу для редагування
     * @param {number} courseId - ID курсу
     */
    async function loadCourseDetails(courseId) {
        try {
            const response = await fetch(`${API_ROOT}/get_course_details.php?id=${courseId}`);
            const data = await response.json();
            
            if (data.success) {
                // Показати редактор курсу і приховати заглушку
                courseEditorPlaceholder.style.display = 'none';
                courseEditorContent.style.display = 'block';
                
                // Заповнити поля форми даними курсу
                fillCourseForm(data.course);
                
                // Завантажити секції курсу
                loadCourseSections(courseId);
            } else {
                showError('Не вдалося завантажити деталі курсу');
            }
        } catch (error) {
            console.error('Помилка при завантаженні деталей курсу:', error);
            showError('Помилка при завантаженні деталей курсу');
        }
    }
    
    /**
     * Заповнює форму редагування курсу даними
     * @param {Object} course - Об'єкт з даними курсу
     */
    function fillCourseForm(course) {
        document.getElementById('course-id').value = course.id;
        document.getElementById('edit-course-title').value = course.title;
        document.getElementById('edit-course-short-description').value = course.short_description || '';
        document.getElementById('edit-course-long-description').value = course.long_description || '';
        document.getElementById('edit-course-price').value = course.price || 0;
        document.getElementById('edit-course-duration').value = course.duration_hours || 0;
        
        // Категорія, мова та рівень складності будуть вибрані після їх завантаження
        const categorySelect = document.getElementById('edit-course-category');
        const languageSelect = document.getElementById('edit-course-language');
        const difficultySelect = document.getElementById('edit-course-difficulty');
        
        if (categorySelect.options.length > 1) {
            categorySelect.value = course.category_id || '';
        }
        
        if (languageSelect.options.length > 1) {
            languageSelect.value = course.language_id || '';
        }
        
        if (difficultySelect.options.length > 1) {
            difficultySelect.value = course.level_id || '';
        }
        
        // Відображення зображення курсу
        const imageDisplay = document.getElementById('course-image-display');
        imageDisplay.src = course.image_url || 'img/courses/default-course.jpg';
    }
    
    /**
     * Завантажує секції курсу
     * @param {number} courseId - ID курсу
     */
    async function loadCourseSections(courseId) {
        try {
            const response = await fetch(`${API_ROOT}/get_course_sections.php?course_id=${courseId}`);
            const data = await response.json();
            
            if (data.success) {
                renderCourseSections(data.sections);
            } else {
                courseSectionsContainer.innerHTML = '<p class="error-message">Не вдалося завантажити секції курсу</p>';
            }
        } catch (error) {
            console.error('Помилка при завантаженні секцій курсу:', error);
            courseSectionsContainer.innerHTML = '<p class="error-message">Помилка при завантаженні секцій курсу</p>';
        }
    }
    
    /**
     * Відображає секції курсу
     * @param {Array} sections - Масив секцій курсу
     */
    function renderCourseSections(sections) {
        courseSectionsContainer.innerHTML = '';
        
        if (sections.length === 0) {
            courseSectionsContainer.innerHTML = '<p class="info-message">У цього курсу ще немає секцій. Додайте першу секцію.</p>';
            return;
        }
        
        sections.forEach(section => {
            const sectionItem = document.createElement('div');
            sectionItem.className = 'section-item';
            sectionItem.dataset.id = section.id;
            
            sectionItem.innerHTML = `
                <div class="section-header">
                    <h3 class="section-title">${section.title}</h3>
                    <div class="section-actions">
                        <button type="button" class="section-action-btn edit-section-title-btn" title="Редагувати назву">
                            <i class="fas fa-edit"></i> Назва
                        </button>
                        <button type="button" class="section-action-btn edit-section-desc-btn" title="Редагувати опис">
                            <i class="fas fa-edit"></i> Опис
                        </button>
                        <button type="button" class="section-action-btn delete-section-btn" title="Видалити секцію">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="section-description">${section.description || ''}</div>
                <div class="resources-container" id="resources-${section.id}">
                    <!-- Ресурси будуть додані через JavaScript -->
                </div>
                <button type="button" class="add-button add-resource-btn" data-section-id="${section.id}">
                    + Додати ресурс
                </button>
            `;
            
            courseSectionsContainer.appendChild(sectionItem);
            
            // Завантажити ресурси секції
            loadSectionResources(section.id);
            
            // Додати обробники подій
            const editTitleBtn = sectionItem.querySelector('.edit-section-title-btn');
            const editDescBtn = sectionItem.querySelector('.edit-section-desc-btn');
            const deleteSectionBtn = sectionItem.querySelector('.delete-section-btn');
            const addResourceBtn = sectionItem.querySelector('.add-resource-btn');
            
            editTitleBtn.addEventListener('click', function() {
                editSectionTitle(section.id, section.title);
            });
            
            editDescBtn.addEventListener('click', function() {
                editSectionDescription(section.id, section.description);
            });
            
            deleteSectionBtn.addEventListener('click', function() {
                if (confirm(`Ви впевнені, що хочете видалити секцію "${section.title}"?`)) {
                    deleteSection(section.id);
                }
            });
            
            addResourceBtn.addEventListener('click', function() {
                // Відкриваємо модальне вікно вибору типу ресурсу
                const resourceTypeModal = document.getElementById('resourceTypeModal');
                resourceTypeModal.dataset.sectionId = section.id; // Зберігаємо ID секції для подальшого використання
                resourceTypeModal.classList.add('show');
            });
        });
    }
    
    /**
     * Завантажує ресурси секції курсу
     * @param {number} sectionId - ID секції
     */
    async function loadSectionResources(sectionId) {
        try {
            const response = await fetch(`${API_ROOT}/get_section_resources.php?section_id=${sectionId}`);
            const data = await response.json();
            
            const resourcesContainer = document.getElementById(`resources-${sectionId}`);
            
            if (data.success) {
                renderSectionResources(resourcesContainer, data.resources);
            } else {
                resourcesContainer.innerHTML = '<p class="error-message">Не вдалося завантажити ресурси секції</p>';
            }
        } catch (error) {
            console.error('Помилка при завантаженні ресурсів секції:', error);
            const resourcesContainer = document.getElementById(`resources-${sectionId}`);
            resourcesContainer.innerHTML = '<p class="error-message">Помилка при завантаженні ресурсів секції</p>';
        }
    }
    
    /**
     * Відображає ресурси секції курсу
     * @param {HTMLElement} container - Контейнер для відображення ресурсів
     * @param {Array} resources - Масив ресурсів секції
     */
    function renderSectionResources(container, resources) {
        container.innerHTML = '';
        
        if (resources.length === 0) {
            container.innerHTML = '<p class="info-message">У цій секції ще немає ресурсів</p>';
            return;
        }
        
        resources.forEach(resource => {
            const resourceItem = document.createElement('div');
            resourceItem.className = 'resource-item';
            resourceItem.dataset.id = resource.id;
            
            // Іконка залежно від типу ресурсу
            let icon = '';
            switch (resource.resource_type) {
                case 'video':
                    icon = '<i class="fas fa-video resource-icon"></i>';
                    break;
                case 'document':
                    icon = '<i class="fas fa-file-alt resource-icon"></i>';
                    break;
                case 'image':
                    icon = '<i class="fas fa-image resource-icon"></i>';
                    break;
                case 'text':
                    icon = '<i class="fas fa-file-text resource-icon"></i>';
                    break;
                default:
                    icon = '<i class="fas fa-file resource-icon"></i>';
            }
            
            resourceItem.innerHTML = `
                <div class="resource-info">
                    ${icon}
                    <span class="resource-title">${resource.title}</span>
                </div>
                <div class="resource-actions">
                    <button type="button" class="section-action-btn edit-resource-btn" title="Редагувати ресурс">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="section-action-btn delete-resource-btn" title="Видалити ресурс">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(resourceItem);
            
            // Додати обробники подій
            const editResourceBtn = resourceItem.querySelector('.edit-resource-btn');
            const deleteResourceBtn = resourceItem.querySelector('.delete-resource-btn');
            
            editResourceBtn.addEventListener('click', function() {
                editResource(resource);
            });
            
            deleteResourceBtn.addEventListener('click', function() {
                if (confirm(`Ви впевнені, що хочете видалити ресурс "${resource.title}"?`)) {
                    deleteResource(resource.id);
                }
            });
        });
    }
    
    /**
     * Додає нову секцію до курсу
     */
    function addSection() {
        const courseId = document.getElementById('course-id').value;
        
        if (!courseId) {
            showError('Спочатку виберіть курс для редагування');
            return;
        }
        
        // Відкрити діалогове вікно для введення назви секції
        const sectionTitle = prompt('Введіть назву нової секції:');
        
        if (sectionTitle === null) {
            return; // Користувач скасував операцію
        }
        
        if (sectionTitle.trim() === '') {
            showError('Назва секції не може бути порожньою');
            return;
        }
        
        // Створити новий об'єкт FormData та додати дані
        const formData = new FormData();
        formData.append('course_id', courseId);
        formData.append('title', sectionTitle);
        
        // Відправити запит на створення секції
        fetch(`${API_ROOT}/create_section.php`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Оновити список секцій
                loadCourseSections(courseId);
                showSuccess('Секцію успішно додано');
            } else {
                showError(data.message || 'Помилка при створенні секції');
            }
        })
        .catch(error => {
            console.error('Помилка при створенні секції:', error);
            showError('Помилка при створенні секції');
        });
    }
    
    /**
     * Редагує назву існуючої секції курсу інлайн
     * @param {number} sectionId - ID секції
     * @param {string} currentTitle - Поточна назва секції
     */
    function editSectionTitle(sectionId, currentTitle) {
        // Знаходимо заголовок секції
        const sectionItem = document.querySelector(`.section-item[data-id="${sectionId}"]`);
        const titleElement = sectionItem.querySelector('.section-title');
        
        // Зберігаємо поточний текст
        const originalTitle = titleElement.textContent;
        
        // Створюємо поле для редагування
        const inputGroup = document.createElement('div');
        inputGroup.className = 'edit-section-input-group';
        inputGroup.innerHTML = `
            <input type="text" class="edit-section-input" value="${originalTitle}">
            <button class="edit-section-save-btn">Зберегти</button>
            <button class="edit-section-cancel-btn">Скасувати</button>
        `;
        
        // Приховуємо поточний заголовок та додаємо поле редагування
        titleElement.style.display = 'none';
        titleElement.parentNode.insertBefore(inputGroup, titleElement.nextSibling);
        
        // Фокусуємо на полі введення і вибираємо весь текст
        const input = inputGroup.querySelector('.edit-section-input');
        input.focus();
        input.select();
        
        // Обробники подій для кнопок
        const saveBtn = inputGroup.querySelector('.edit-section-save-btn');
        const cancelBtn = inputGroup.querySelector('.edit-section-cancel-btn');
        
        saveBtn.addEventListener('click', function() {
            saveTitle();
        });
        
        cancelBtn.addEventListener('click', function() {
            cancelEdit();
        });
        
        // Обробник для Enter та Escape
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                saveTitle();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
        
        // Функція для збереження
        function saveTitle() {
            const newTitle = input.value.trim();
            
            if (newTitle === '') {
                showError('Назва секції не може бути порожньою');
                return;
            }
            
            // Створити новий об'єкт FormData та додати дані
            const formData = new FormData();
            formData.append('section_id', sectionId);
            formData.append('title', newTitle);
            
            // Відправити запит на оновлення секції
            fetch(`${API_ROOT}/update_section.php`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Оновити відображення
                    titleElement.textContent = newTitle;
                    // Видалити поле редагування
                    inputGroup.remove();
                    // Показати оновлений заголовок
                    titleElement.style.display = '';
                    showSuccess('Назву секції успішно оновлено');
                } else {
                    showError(data.message || 'Помилка при оновленні назви секції');
                }
            })
            .catch(error => {
                console.error('Помилка при оновленні назви секції:', error);
                showError('Помилка при оновленні назви секції');
            });
        }
        
        // Функція для скасування
        function cancelEdit() {
            // Видалити поле редагування
            inputGroup.remove();
            // Показати оригінальний заголовок
            titleElement.style.display = '';
        }
    }
    
    /**
     * Редагує опис існуючої секції курсу інлайн
     * @param {number} sectionId - ID секції
     * @param {string} currentDescription - Поточний опис секції
     */
    function editSectionDescription(sectionId, currentDescription) {
        // Знаходимо блок опису секції
        const sectionItem = document.querySelector(`.section-item[data-id="${sectionId}"]`);
        const descElement = sectionItem.querySelector('.section-description');
        
        // Зберігаємо поточний текст
        const originalDesc = descElement.textContent;
        
        // Створюємо поле для редагування
        const inputGroup = document.createElement('div');
        inputGroup.className = 'edit-section-input-group';
        inputGroup.innerHTML = `
            <textarea class="edit-section-textarea" rows="3">${originalDesc}</textarea>
            <button class="edit-section-save-btn">Зберегти</button>
            <button class="edit-section-cancel-btn">Скасувати</button>
        `;
        
        // Приховуємо поточний опис та додаємо поле редагування
        descElement.style.display = 'none';
        descElement.parentNode.insertBefore(inputGroup, descElement.nextSibling);
        
        // Фокусуємо на полі введення
        const textarea = inputGroup.querySelector('.edit-section-textarea');
        textarea.focus();
        
        // Обробники подій для кнопок
        const saveBtn = inputGroup.querySelector('.edit-section-save-btn');
        const cancelBtn = inputGroup.querySelector('.edit-section-cancel-btn');
        
        saveBtn.addEventListener('click', function() {
            saveDescription();
        });
        
        cancelBtn.addEventListener('click', function() {
            cancelEdit();
        });
        
        // Обробник для Escape
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                cancelEdit();
            }
        });
        
        // Функція для збереження
        function saveDescription() {
            const newDescription = textarea.value.trim();
            
            // Створити новий об'єкт FormData та додати дані
            const formData = new FormData();
            formData.append('section_id', sectionId);
            formData.append('description', newDescription);
            
            // Відправити запит на оновлення секції
            fetch(`${API_ROOT}/update_section.php`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Оновити відображення
                    descElement.textContent = newDescription;
                    // Видалити поле редагування
                    inputGroup.remove();
                    // Показати оновлений опис
                    descElement.style.display = '';
                    showSuccess('Опис секції успішно оновлено');
                } else {
                    showError(data.message || 'Помилка при оновленні опису секції');
                }
            })
            .catch(error => {
                console.error('Помилка при оновленні опису секції:', error);
                showError('Помилка при оновленні опису секції');
            });
        }
        
        // Функція для скасування
        function cancelEdit() {
            // Видалити поле редагування
            inputGroup.remove();
            // Показати оригінальний опис
            descElement.style.display = '';
        }
    }
    
    /**
     * Видаляє секцію курсу
     * @param {number} sectionId - ID секції
     */
    function deleteSection(sectionId) {
        // Відправити запит на видалення секції
        fetch(`${API_ROOT}/delete_section.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `section_id=${sectionId}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Оновити список секцій
                const courseId = document.getElementById('course-id').value;
                loadCourseSections(courseId);
                showSuccess('Секцію успішно видалено');
            } else {
                showError(data.message || 'Помилка при видаленні секції');
            }
        })
        .catch(error => {
            console.error('Помилка при видаленні секції:', error);
            showError('Помилка при видаленні секції');
        });
    }
    
    /**
     * Відкриває модальне вікно для додавання ресурсу
     * @param {number} sectionId - ID секції
     * @param {Object} resource - Об'єкт з даними ресурсу (для редагування)
     * @param {string} resourceMode - Режим ресурсу ('text' або 'file')
     */
    function openResourceModal(sectionId, resource = null, resourceMode = 'text') {
        // Встановити заголовок модального вікна
        const modalTitle = document.getElementById('resource-modal-title');
        modalTitle.textContent = resource ? 'Редагувати ресурс' : 'Додати ресурс';
        
        // Очистити форму
        resourceForm.reset();
        
        // Встановити ID секції
        document.getElementById('section-id').value = sectionId;
        
        // Якщо редагуємо існуючий ресурс, заповнити поля форми
        if (resource) {
            document.getElementById('resource-id').value = resource.id;
            document.getElementById('resource-title').value = resource.title || '';
            document.getElementById('resource-type').value = resource.resource_type || 'text';
            document.getElementById('resource-content').value = resource.content || '';
            document.getElementById('resource-url').value = resource.resource_url || '';
            document.getElementById('resource-duration').value = resource.duration_minutes || '';
        } else {
            document.getElementById('resource-id').value = '';
            
            // Встановлюємо тип ресурсу в залежності від вибору користувача
            if (resourceMode === 'text') {
                document.getElementById('resource-type').value = 'text';
            } else if (resourceMode === 'file') {
                // Для файлу вибираємо 'document' за замовчуванням, але можна змінити
                document.getElementById('resource-type').value = 'document';
            }
        }
        
        // Показати відповідне поле в залежності від типу ресурсу
        toggleResourceFields();
        
        // Показати модальне вікно
        resourceModal.classList.add('show');
    }
    
    /**
     * Редагує існуючий ресурс
     * @param {Object} resource - Об'єкт з даними ресурсу
     */
    function editResource(resource) {
        openResourceModal(resource.section_id, resource);
    }
    
    /**
     * Зберігає ресурс (новий або відредагований)
     */
    function saveResource() {
        const resourceId = document.getElementById('resource-id').value;
        const sectionId = document.getElementById('section-id').value;
        const title = document.getElementById('resource-title').value;
        const type = document.getElementById('resource-type').value;
        const content = document.getElementById('resource-content').value;
        const url = document.getElementById('resource-url').value;
        const duration = document.getElementById('resource-duration').value;
        
        // Перевіряємо обов'язкові поля
        if (!title.trim()) {
            showError('Назва ресурсу є обов\'язковою');
            return;
        }
        
        // Перевіряємо, чи заповнено правильне поле залежно від типу ресурсу
        if (type === 'text' && !content.trim()) {
            showError('Вміст є обов\'язковим для текстового ресурсу');
            return;
        }
        
        // Створюємо об'єкт FormData для відправки даних
        const formData = new FormData();
        
        if (resourceId) {
            formData.append('resource_id', resourceId);
        }
        
        formData.append('section_id', sectionId);
        formData.append('title', title);
        formData.append('resource_type', type);
        
        if (type === 'text') {
            formData.append('content', content);
        } else if (type === 'video') {
            if (!url.trim()) {
                showError('URL відео є обов\'язковим');
                return;
            }
            formData.append('resource_url', url);
        } else {
            // Для документів та зображень
            const resourceFile = document.getElementById('resource-file');
            if (resourceFile.files.length > 0) {
                // Перевіряємо тип файлу перед відправкою
                const file = resourceFile.files[0];
                console.log('File info:', {
                    name: file.name,
                    type: file.type,
                    size: file.size
                });

                const allowedTypes = {
                    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                    'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                };

                console.log('Selected resource type:', type);
                console.log('Allowed types for this resource:', allowedTypes[type]);

                if (!allowedTypes[type].includes(file.type)) {
                    showError(`Непідтримуваний тип файлу. Дозволені типи для ${type}: ${allowedTypes[type].join(', ')}`);
                    return;
                }

                formData.append('resource_file', file);
            } else if (url.trim()) {
                formData.append('resource_url', url);
            } else {
                showError('Виберіть файл або введіть URL');
                return;
            }
        }
        
        if (duration) {
            formData.append('duration_minutes', duration);
        }

        // Логуємо всі дані, що відправляються
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
        }
        
        // URL для запиту залежно від того, чи створюємо новий ресурс або редагуємо існуючий
        const url_endpoint = resourceId ? `${API_ROOT}/update_resource.php` : `${API_ROOT}/create_resource.php`;
        console.log('Sending request to:', url_endpoint);
        
        // Відправити запит на створення/оновлення ресурсу
        fetch(url_endpoint, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.log('Error response text:', text);
                    throw new Error(`Помилка сервера: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                // Закрити модальне вікно
                resourceModal.classList.remove('show');
                
                // Оновити список ресурсів секції
                loadSectionResources(sectionId);
                
                showSuccess(resourceId ? 'Ресурс успішно оновлено' : 'Ресурс успішно додано');
            } else {
                showError(data.message || 'Помилка при збереженні ресурсу');
            }
        })
        .catch(error => {
            console.error('Error details:', error);
            showError('Помилка при збереженні ресурсу: ' + error.message);
        });
    }
    
    /**
     * Видаляє ресурс
     * @param {number} resourceId - ID ресурсу
     */
    function deleteResource(resourceId) {
        // Відправити запит на видалення ресурсу
        fetch(`${API_ROOT}/delete_resource.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `resource_id=${resourceId}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Знайти правильний контейнер для оновлення
                const resourceItem = document.querySelector(`.resource-item[data-id="${resourceId}"]`);
                if (resourceItem) {
                    const sectionId = resourceItem.closest('.section-item').dataset.id;
                    loadSectionResources(sectionId);
                }
                
                showSuccess('Ресурс успішно видалено');
            } else {
                showError(data.message || 'Помилка при видаленні ресурсу');
            }
        })
        .catch(error => {
            console.error('Помилка при видаленні ресурсу:', error);
            showError('Помилка при видаленні ресурсу');
        });
    }
    
    /**
     * Перемикає відображення полів залежно від типу ресурсу
     */
    function toggleResourceFields() {
        const typeSelect = document.getElementById('resource-type');
        const selectedType = typeSelect.value;
        const textField = document.getElementById('resource-text-field');
        const urlField = document.getElementById('resource-url-field');
        const fileField = document.getElementById('resource-file-field');
        
        // Спочатку приховуємо всі поля
        textField.style.display = 'none';
        urlField.style.display = 'none';
        fileField.style.display = 'none';
        
        // Показуємо відповідне поле залежно від типу ресурсу
        switch (selectedType) {
            case 'text':
                textField.style.display = 'block';
                break;
            case 'video':
                urlField.style.display = 'block';
                break;
            case 'document':
            case 'image':
                urlField.style.display = 'block';
                fileField.style.display = 'block';
                break;
            default:
                textField.style.display = 'block';
        }
    }
    
    /**
     * Оновлює дані курсу
     */
    function updateCourse() {
        const formData = new FormData(editCourseForm);
        formData.append('mentor_id', userData.id);
        
        // Додати файл зображення, якщо вибрано
        const imageInput = document.getElementById('edit-course-image');
        if (imageInput.files.length > 0) {
            formData.append('image', imageInput.files[0]);
        }
        
        // Отримуємо course_id
        const courseId = document.getElementById('course-id').value;
        if (!courseId) {
            showError('ID курсу не знайдено');
            return;
        }
        formData.append('course_id', courseId);
        
        // Показати індикатор завантаження або блокувати форму
        const submitBtn = editCourseForm.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Збереження...';
        submitBtn.disabled = true;
        
        // Відправити запит на оновлення курсу
        fetch(`${API_ROOT}/update_course.php`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Помилка сервера: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Розблокувати кнопку
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            
            if (data.success) {
                showSuccess('Курс успішно оновлено');
                // Оновити список курсів
                loadMentorCourses();
            } else {
                showError(data.message || 'Помилка при оновленні курсу');
            }
        })
        .catch(error => {
            // Розблокувати кнопку
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            
            console.error('Помилка при оновленні курсу:', error);
            showError('Помилка при оновленні курсу: ' + error.message);
        });
    }
    
    /**
     * Попередній перегляд зображення перед завантаженням
     * @param {HTMLInputElement} input - Елемент input для вибору файлу
     */
    function previewImage(input) {
        const preview = document.getElementById('course-image-display');
        const file = input.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                preview.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    /**
     * Завантажує список категорій
     */
    function loadCategories() {
        fetch(`${API_ROOT}/get_categories.php`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const select = document.getElementById('edit-course-category');
                    select.innerHTML = '<option value="">Виберіть категорію</option>';
                    
                    data.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        select.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Помилка при завантаженні категорій:', error);
            });
    }
    
    /**
     * Завантажує список мов
     */
    function loadLanguages() {
        fetch(`${API_ROOT}/get_languages.php`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const select = document.getElementById('edit-course-language');
                    select.innerHTML = '<option value="">Виберіть мову</option>';
                    
                    data.languages.forEach(language => {
                        const option = document.createElement('option');
                        option.value = language.id;
                        option.textContent = language.name;
                        select.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Помилка при завантаженні мов:', error);
            });
    }
    
    /**
     * Завантажує список рівнів складності
     */
    function loadDifficultyLevels() {
        fetch(`${API_ROOT}/get_difficulty_levels.php`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const select = document.getElementById('edit-course-difficulty');
                    select.innerHTML = '<option value="">Виберіть рівень</option>';
                    
                    data.levels.forEach(level => {
                        const option = document.createElement('option');
                        option.value = level.id;
                        option.textContent = level.name;
                        select.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Помилка при завантаженні рівнів складності:', error);
            });
    }
    
    /**
     * Показує повідомлення про помилку
     * @param {string} message - Текст повідомлення
     */
    function showError(message) {
        alert(message);
    }
    
    /**
     * Показує повідомлення про успішну операцію
     * @param {string} message - Текст повідомлення
     */
    function showSuccess(message) {
        alert(message);
    }
}); 