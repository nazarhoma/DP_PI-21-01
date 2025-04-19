<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

include 'connect.php';

$response = array();

// Перевіряємо наявність таблиці курсів
$result = $conn->query("SHOW TABLES LIKE 'courses'");
if ($result->num_rows === 0) {
    // Створюємо таблицю курсів
    $create_courses_table = "
    CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        mentor_id INT,
        price DECIMAL(10,2),
        duration VARCHAR(100),
        level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
        language VARCHAR(50),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
    )";
    
    if ($conn->query($create_courses_table)) {
        $response['courses_table'] = "Таблицю 'courses' успішно створено";
    } else {
        $response['courses_table'] = "Помилка створення таблиці 'courses': " . $conn->error;
        $response['success'] = false;
        echo json_encode($response);
        $conn->close();
        exit;
    }
    $response['courses_table_created'] = true;
} else {
    $response['courses_table'] = "Таблиця 'courses' вже існує";
    $response['courses_table_created'] = false;
}

// Додамо таблицю для зв'язку користувачів з курсами (реєстрації на курси)
$result = $conn->query("SHOW TABLES LIKE 'course_enrollments'");
if ($result->num_rows === 0) {
    // Створюємо таблицю для реєстрацій на курси
    $create_enrollments_table = "
    CREATE TABLE IF NOT EXISTS course_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
        progress INT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )";
    
    if ($conn->query($create_enrollments_table)) {
        $response['enrollments_table'] = "Таблицю 'course_enrollments' успішно створено";
    } else {
        $response['enrollments_table'] = "Помилка створення таблиці 'course_enrollments': " . $conn->error;
    }
    $response['enrollments_table_created'] = true;
} else {
    $response['enrollments_table'] = "Таблиця 'course_enrollments' вже існує";
    $response['enrollments_table_created'] = false;
}

// Додамо таблицю для відгуків до курсів
$result = $conn->query("SHOW TABLES LIKE 'course_reviews'");
if ($result->num_rows === 0) {
    // Створюємо таблицю для відгуків
    $create_reviews_table = "
    CREATE TABLE IF NOT EXISTS course_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )";
    
    if ($conn->query($create_reviews_table)) {
        $response['reviews_table'] = "Таблицю 'course_reviews' успішно створено";
    } else {
        $response['reviews_table'] = "Помилка створення таблиці 'course_reviews': " . $conn->error;
    }
    $response['reviews_table_created'] = true;
} else {
    $response['reviews_table'] = "Таблиця 'course_reviews' вже існує";
    $response['reviews_table_created'] = false;
}

// Перевіряємо, чи потрібно додати дані
$add_sample_data = true;

// Перевіряємо, чи існують уже курси в таблиці
$check_courses = $conn->query("SELECT COUNT(*) as count FROM courses");
$courses_count = $check_courses->fetch_assoc()['count'];

if ($courses_count >= 10) {
    $add_sample_data = false;
    $response['sample_courses'] = "Курси вже існують в базі даних (виявлено $courses_count курсів)";
}

// Якщо додаємо тестові дані
if ($add_sample_data) {
    // Спочатку видаляємо дані з таблиць в правильному порядку
    // через зовнішні ключі - спочатку дочірні таблиці
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");
    
    // Очищаємо таблицю відгуків
    if ($conn->query("DELETE FROM course_reviews")) {
        $response['clear_reviews'] = "Таблицю відгуків очищено";
    } else {
        $response['clear_reviews_error'] = $conn->error;
    }
    
    // Очищаємо таблицю реєстрацій
    if ($conn->query("DELETE FROM course_enrollments")) {
        $response['clear_enrollments'] = "Таблицю реєстрацій очищено";
    } else {
        $response['clear_enrollments_error'] = $conn->error;
    }
    
    // Очищаємо таблицю курсів
    if ($conn->query("DELETE FROM courses")) {
        $response['clear_courses'] = "Таблицю курсів очищено";
    } else {
        $response['clear_courses_error'] = $conn->error;
    }
    
    $conn->query("SET FOREIGN_KEY_CHECKS = 1");
    
    // Скидаємо AUTO_INCREMENT
    $conn->query("ALTER TABLE courses AUTO_INCREMENT = 1");
    $conn->query("ALTER TABLE course_enrollments AUTO_INCREMENT = 1");
    $conn->query("ALTER TABLE course_reviews AUTO_INCREMENT = 1");
    
    // Шлях до дефолтного зображення
    $default_image = "img/default-image-course.png";
    
    // Використовуємо індивідуальні запити для кожного курсу з екрануванням апострофів
    $mentor_id = $conn->query("SELECT id FROM users WHERE role = 'mentor' LIMIT 1")->fetch_assoc()['id'];
    $mentor_id2 = $conn->query("SELECT id FROM users WHERE role = 'mentor' ORDER BY id LIMIT 1 OFFSET 1")->fetch_assoc()['id'] ?? $mentor_id;
    
    // Курс 1: Основи української мови
    $title = $conn->real_escape_string('Основи української мови');
    $description = $conn->real_escape_string('Вивчення основ української мови для початківців');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id, 199.99, '4 тижні', 'beginner', 'Українська', 'Мови', '$default_image')");
    
    // Курс 2: Python для початківців
    $title = $conn->real_escape_string('Python для початківців');
    $description = $conn->real_escape_string('Базовий курс програмування на Python. Ідеально підходить для тих, хто тільки починає свій шлях у програмуванні.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id, 299.99, '6 тижнів', 'beginner', 'Українська', 'Програмування', '$default_image')");
    
    // Курс 3: Веб-розробка: HTML, CSS, JavaScript
    $title = $conn->real_escape_string('Веб-розробка: HTML, CSS, JavaScript');
    $description = $conn->real_escape_string('Комплексний курс з розробки веб-сайтів від основ до просунутих технік.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id, 349.99, '8 тижнів', 'intermediate', 'Українська', 'Веб-розробка', '$default_image')");
    
    // Курс 4: Бази даних SQL
    $title = $conn->real_escape_string('Бази даних SQL');
    $description = $conn->real_escape_string('Вивчення основ роботи з реляційними базами даних та мовою SQL.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id, 249.99, '5 тижнів', 'intermediate', 'Українська', 'Бази даних', '$default_image')");
    
    // Курс 5: Основи англійської мови
    $title = $conn->real_escape_string('Основи англійської мови');
    $description = $conn->real_escape_string('Курс для початківців з вивчення англійської мови. Граматика, лексика, розмовна практика.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id2, 179.99, '12 тижнів', 'beginner', 'Українська', 'Мови', '$default_image')");
    
    // Курс 6: Java програмування
    $title = $conn->real_escape_string('Java програмування');
    $description = $conn->real_escape_string('Курс з основ програмування на Java. Об\'єктно-орієнтоване програмування, робота з класами та методами.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id2, 329.99, '10 тижнів', 'intermediate', 'Українська', 'Програмування', '$default_image')");
    
    // Курс 7: Маркетинг у соціальних мережах
    $title = $conn->real_escape_string('Маркетинг у соціальних мережах');
    $description = $conn->real_escape_string('Стратегії та практичні підходи до просування бізнесу в соціальних мережах.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id2, 199.99, '4 тижні', 'beginner', 'Українська', 'Маркетинг', '$default_image')");
    
    // Курс 8: Дизайн UX/UI
    $title = $conn->real_escape_string('Дизайн UX/UI');
    $description = $conn->real_escape_string('Принципи створення зручних та привабливих інтерфейсів для цифрових продуктів.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id, 299.99, '6 тижнів', 'intermediate', 'Українська', 'Дизайн', '$default_image')");
    
    // Курс 9: Машинне навчання для початківців
    $title = $conn->real_escape_string('Машинне навчання для початківців');
    $description = $conn->real_escape_string('Вступ до світу машинного навчання. Базові алгоритми та практичні проекти.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id2, 399.99, '8 тижнів', 'advanced', 'Українська', 'Штучний інтелект', '$default_image')");
    
    // Курс 10: Фотографія для початківців
    $title = $conn->real_escape_string('Фотографія для початківців');
    $description = $conn->real_escape_string('Основи фотографії. Композиція, світло, робота з камерою та обробка фотографій.');
    $conn->query("INSERT INTO courses (title, description, mentor_id, price, duration, level, language, category, image) 
                VALUES ('$title', '$description', $mentor_id, 149.99, '4 тижні', 'beginner', 'Українська', 'Мистецтво', '$default_image')");
    
    $response['sample_courses'] = "Додано приклади курсів для демонстрації";
    
    // Тепер додаємо відгуки, використовуючи екранування для текстів
    // Спочатку отримаємо ідентифікатори студентів
    $student1_id = $conn->query("SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1 OFFSET 0")->fetch_assoc()['id'] ?? $mentor_id;
    $student2_id = $conn->query("SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1 OFFSET 1")->fetch_assoc()['id'] ?? $student1_id;
    $student3_id = $conn->query("SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1 OFFSET 2")->fetch_assoc()['id'] ?? $student1_id;
    
    // Відгуки для курсу 1 (Основи української мови) - 2 відгуки
    $review_text = $conn->real_escape_string('Чудовий курс! Дуже корисний та інформативний матеріал. Викладач пояснює зрозуміло і доступно.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student1_id, 1, 5, '$review_text')");
    
    $review_text = $conn->real_escape_string('Добрий курс для початківців. Подача матеріалу чітка, є багато практичних завдань.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student2_id, 1, 4, '$review_text')");
    
    // Відгуки для курсу 2 (Python для початківців) - 3 відгуки
    $review_text = $conn->real_escape_string('Дуже хороший курс для тих, хто тільки починає вивчати Python. Викладач має великий досвід і вміє зрозуміло пояснювати.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student1_id, 2, 5, '$review_text')");
    
    $review_text = $conn->real_escape_string('Найкращий курс з Python! Я вже спробував декілька курсів, але цей - найкращий.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student2_id, 2, 5, '$review_text')");
    
    $review_text = $conn->real_escape_string('Курс гарний, але мені трохи не вистачало практичних завдань.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student3_id, 2, 4, '$review_text')");
    
    // Відгуки для курсу 3 (Веб-розробка) - 1 відгук
    $review_text = $conn->real_escape_string('Курс досить базовий, хотілося більше просунутих тем з JavaScript.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student1_id, 3, 3, '$review_text')");
    
    // Курс 4 (Бази даних SQL) - немає відгуків
    
    // Відгуки для курсу 5 (Основи англійської мови) - 2 відгуки
    $review_text = $conn->real_escape_string('Ідеальний курс для початківців! Викладач професійно підходить до пояснення матеріалу.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student2_id, 5, 5, '$review_text')");
    
    $review_text = $conn->real_escape_string('Дуже хороший курс, допоміг мені подолати мовний бар\'єр.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student3_id, 5, 4, '$review_text')");
    
    // Курс 6 (Java програмування) - немає відгуків
    
    // Відгуки для курсу 7 (Маркетинг у соціальних мережах) - 1 відгук
    $review_text = $conn->real_escape_string('Курс занадто поверхневий, не вистачає конкретних стратегій та детальних прикладів.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student1_id, 7, 2, '$review_text')");
    
    // Відгуки для курсу 8 (Дизайн UX/UI) - 2 відгуки
    $review_text = $conn->real_escape_string('Прекрасний курс з дизайну! Викладач – професіонал своєї справи.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student2_id, 8, 5, '$review_text')");
    
    $review_text = $conn->real_escape_string('Дуже корисний курс! Багато практичних завдань та зворотного зв\'язку від викладача.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student3_id, 8, 5, '$review_text')");
    
    // Курс 9 (Машинне навчання) - немає відгуків
    
    // Відгуки для курсу 10 (Фотографія для початківців) - 1 відгук
    $review_text = $conn->real_escape_string('Хороший курс для новачків у фотографії. Багато корисних порад та технік.');
    $conn->query("INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES ($student1_id, 10, 4, '$review_text')");
    
    $response['sample_reviews'] = "Додано приклади відгуків для демонстрації";
} else {
    $response['data_status'] = "Тестові дані не додано, вони вже існують";
}

$response['success'] = true;
$response['message'] = "Структуру бази даних оновлено";

echo json_encode($response);

$conn->close();
?> 