document.addEventListener('DOMContentLoaded', () => {
    // Завантаження категорій, мов та рівнів складності
    loadCategories();
    loadLanguages();
    loadDifficultyLevels();

    // Обробка додавання нових секцій
    const addSectionBtn = document.getElementById('addSectionBtn');
    if (addSectionBtn) {
        addSectionBtn.addEventListener('click', addNewSection);
    }

    // Обробка відправки форми
    const createCourseForm = document.getElementById('createCourseForm');
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', submitCourseForm);
    }

    // Кнопка скасування
    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Ви впевнені, що хочете скасувати створення курсу? Усі введені дані буде втрачено.')) {
                window.location.href = 'index.html';
            }
        });
    }

    // Ініціалізація видалення секцій
    initRemoveSectionButtons();
});

/**
 * Завантаження категорій для вибору
 */
async function loadCategories() {
    try {
        const response = await fetch('/server/get_categories.php');
        if (!response.ok) {
            throw new Error('Не вдалося завантажити категорії');
        }

        const data = await response.json();
        const categorySelect = document.getElementById('courseCategory');

        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Категорії недоступні';
            option.disabled = true;
            categorySelect.appendChild(option);
        }
    } catch (error) {
        console.error('Помилка при завантаженні категорій:', error);
        showError('Не вдалося завантажити категорії. Спробуйте оновити сторінку.');
    }
}

/**
 * Завантаження мов для вибору
 */
async function loadLanguages() {
    try {
        const response = await fetch('/server/get_languages.php');
        if (!response.ok) {
            throw new Error('Не вдалося завантажити мови');
        }

        const data = await response.json();
        const languageSelect = document.getElementById('courseLanguage');

        if (data.languages && data.languages.length > 0) {
            data.languages.forEach(language => {
                const option = document.createElement('option');
                option.value = language.id;
                option.textContent = language.name;
                languageSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Мови недоступні';
            option.disabled = true;
            languageSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Помилка при завантаженні мов:', error);
        showError('Не вдалося завантажити мови. Спробуйте оновити сторінку.');
    }
}

/**
 * Завантаження рівнів складності для вибору
 */
async function loadDifficultyLevels() {
    try {
        const response = await fetch('/server/get_difficulty_levels.php');
        if (!response.ok) {
            throw new Error('Не вдалося завантажити рівні складності');
        }

        const data = await response.json();
        const levelSelect = document.getElementById('courseDifficulty');

        if (data.levels && data.levels.length > 0) {
            data.levels.forEach(level => {
                const option = document.createElement('option');
                option.value = level.id;
                option.textContent = level.name;
                levelSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Рівні складності недоступні';
            option.disabled = true;
            levelSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Помилка при завантаженні рівнів складності:', error);
        showError('Не вдалося завантажити рівні складності. Спробуйте оновити сторінку.');
    }
}

/**
 * Додавання нової секції курсу
 */
function addNewSection() {
    const sectionsContainer = document.getElementById('courseSections');
    const sections = sectionsContainer.querySelectorAll('.course-section');
    const newIndex = sections.length;
    
    // Показуємо кнопки видалення для всіх секцій, коли їх більше однієї
    if (newIndex >= 1) {
        const removeButtons = sectionsContainer.querySelectorAll('.remove-section-btn');
        removeButtons.forEach(btn => {
            btn.style.display = 'block';
        });
    }
    
    const sectionHTML = `
        <div class="course-section" data-section-index="${newIndex}">
            <div class="section-header">
                <h3>Секція ${newIndex + 1}</h3>
                <button type="button" class="remove-section-btn">Видалити</button>
            </div>
            
            <div class="form-field">
                <label for="sectionTitle_${newIndex}">Назва секції*</label>
                <input type="text" id="sectionTitle_${newIndex}" name="sections[${newIndex}][title]" placeholder="Назва секції" required>
            </div>
            
            <div class="form-field">
                <label for="sectionDescription_${newIndex}">Опис секції</label>
                <textarea id="sectionDescription_${newIndex}" name="sections[${newIndex}][description]" placeholder="Опис секції" rows="3"></textarea>
            </div>
        </div>
    `;
    
    sectionsContainer.insertAdjacentHTML('beforeend', sectionHTML);
    
    // Додаємо обробник події для нової кнопки видалення
    const newSection = sectionsContainer.lastElementChild;
    const removeBtn = newSection.querySelector('.remove-section-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            removeSection(newSection);
        });
    }
    
    // Прокручуємо до нової секції
    newSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Видалення секції курсу
 */
function removeSection(section) {
    if (confirm('Ви впевнені, що хочете видалити цю секцію?')) {
        section.remove();
        
        // Перенумеровуємо секції після видалення
        updateSectionNumbers();
        
        // Якщо залишилася тільки одна секція, приховуємо кнопку видалення
        const sectionsContainer = document.getElementById('courseSections');
        const sections = sectionsContainer.querySelectorAll('.course-section');
        if (sections.length === 1) {
            sections[0].querySelector('.remove-section-btn').style.display = 'none';
        }
    }
}

/**
 * Оновлення нумерації секцій
 */
function updateSectionNumbers() {
    const sectionsContainer = document.getElementById('courseSections');
    const sections = sectionsContainer.querySelectorAll('.course-section');
    
    sections.forEach((section, index) => {
        // Оновлюємо заголовок
        const header = section.querySelector('h3');
        if (header) {
            header.textContent = `Секція ${index + 1}`;
        }
        
        // Оновлюємо атрибути даних та імена полів
        section.setAttribute('data-section-index', index);
        
        const titleInput = section.querySelector('input[id^="sectionTitle_"]');
        const descriptionTextarea = section.querySelector('textarea[id^="sectionDescription_"]');
        
        if (titleInput) {
            titleInput.id = `sectionTitle_${index}`;
            titleInput.name = `sections[${index}][title]`;
        }
        
        if (descriptionTextarea) {
            descriptionTextarea.id = `sectionDescription_${index}`;
            descriptionTextarea.name = `sections[${index}][description]`;
        }
    });
}

/**
 * Ініціалізація обробників для кнопок видалення секцій
 */
function initRemoveSectionButtons() {
    const removeButtons = document.querySelectorAll('.remove-section-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.closest('.course-section');
            if (section) {
                removeSection(section);
            }
        });
    });
}

/**
 * Відправка форми створення курсу
 */
async function submitCourseForm(event) {
    event.preventDefault();
    
    try {
        // Перевірка вибраного зображення
        const imageInput = document.getElementById('courseImageURL');
        if (imageInput && imageInput.files.length > 0) {
            const file = imageInput.files[0];
            const fileType = file.type;
            const fileSize = file.size;
            
            // Перевірка типу файлу
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(fileType)) {
                showError('Непідтримуваний формат зображення. Використовуйте JPEG, PNG, GIF або WebP');
                return;
            }
            
            // Перевірка розміру файлу (максимум 5 МБ)
            const maxSize = 5 * 1024 * 1024; // 5 MB
            if (fileSize > maxSize) {
                showError('Розмір зображення не повинен перевищувати 5 MB');
                return;
            }
        }
        
        // Створюємо FormData з форми
        const formData = new FormData(this);
        
        // Додаємо інформацію про ментора
        formData.append('mentor_id', getUserId());
        
        // Показуємо спіннер завантаження
        showLoading();
        
        // Відправляємо дані на сервер
        const response = await fetch('/server/create_course.php', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Помилка при відправці форми');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Перенаправляємо на сторінку курсу або показуємо повідомлення про успіх
            alert('Курс успішно створено!');
            window.location.href = `course.html?id=${result.course_id}`;
        } else {
            // Показуємо повідомлення про помилку
            showError(result.message || 'Не вдалося створити курс. Спробуйте ще раз.');
        }
    } catch (error) {
        console.error('Помилка при відправці форми:', error);
        showError("Помилка при створенні курсу. Перевірте з'єднання з інтернетом та спробуйте ще раз.");
    } finally {
        // Приховуємо спіннер завантаження
        hideLoading();
    }
}

/**
 * Отримання ID поточного користувача
 * В реальному проекті має бути імплементовано через систему авторизації
 */
function getUserId() {
    // Отримуємо дані користувача з localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    // Повертаємо ID користувача, або показуємо помилку якщо користувач не авторизований
    if (userData && userData.id) {
        return userData.id;
    } else {
        showError('Для створення курсу необхідно увійти в систему як ментор');
        throw new Error('Користувач не авторизований');
    }
}

/**
 * Показати індикатор завантаження
 */
function showLoading() {
    // Тут можна реалізувати спіннер завантаження
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Створення курсу...';
    }
}

/**
 * Приховати індикатор завантаження
 */
function hideLoading() {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Створити курс';
    }
}

/**
 * Показати повідомлення про помилку
 */
function showError(message) {
    // Перевіряємо, чи вже є блок з помилкою
    let errorDiv = document.querySelector('.form-error');
    
    if (!errorDiv) {
        // Якщо блока немає, створюємо новий
        errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        
        // Додаємо блок перед кнопками
        const formActions = document.querySelector('.form-actions');
        if (formActions) {
            formActions.parentNode.insertBefore(errorDiv, formActions);
        }
    }
    
    // Встановлюємо текст помилки
    errorDiv.textContent = message;
    
    // Прокручуємо до повідомлення про помилку
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
} 