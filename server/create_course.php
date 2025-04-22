<?php
// Налаштування заголовків для CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Перевіряємо, чи запит має метод OPTIONS (preflight запит)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Відповідаємо 200 OK для preflight запиту
    http_response_code(200);
    exit;
}

// Виведення помилок під час розробки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Перевіряємо метод запиту
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Метод не дозволено. Використовуйте POST.'
    ]));
}

// Підключення до бази даних
include 'connect.php';

// Функція для перевірки наявності обов'язкових полів
function validateRequiredFields($fields) {
    foreach ($fields as $field) {
        if (!isset($_POST[$field]) || trim($_POST[$field]) === '') {
            return [
                'valid' => false,
                'field' => $field
            ];
        }
    }
    return ['valid' => true];
}

// Обов'язкові поля для створення курсу
$requiredFields = ['title', 'short_description', 'long_description', 'category_id', 'language_id', 'level_id', 'price', 'duration_hours', 'mentor_id'];

// Валідація обов'язкових полів
$validation = validateRequiredFields($requiredFields);
if (!$validation['valid']) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => "Поле '{$validation['field']}' є обов'язковим"
    ]));
}

// Отримання даних з форми
$title = trim($_POST['title']);
$shortDescription = trim($_POST['short_description']);
$longDescription = trim($_POST['long_description']);
$categoryId = intval($_POST['category_id']);
$languageId = intval($_POST['language_id']);
$levelId = intval($_POST['level_id']);
$price = floatval($_POST['price']);
$durationHours = intval($_POST['duration_hours']);
$mentorId = intval($_POST['mentor_id']);

// Перевіримо наявність директорії для зображень курсів і зображення за замовчуванням
$defaultImageDir = dirname(dirname(__FILE__)) . '/project/img/courses/';
$defaultImagePath = $defaultImageDir . 'default-course.jpg';

// Створюємо директорію, якщо не існує
if (!file_exists($defaultImageDir)) {
    mkdir($defaultImageDir, 0777, true);
    error_log("Created course images directory: $defaultImageDir");
}

// Перевірка довжини назви курсу
if (strlen($title) > 255) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Назва курсу не повинна перевищувати 255 символів'
    ]));
}

// Перевірка довжини короткого опису
if (strlen($shortDescription) > 500) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Короткий опис не повинен перевищувати 500 символів'
    ]));
}

// Перевірка ціни (не може бути від'ємною)
if ($price < 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Ціна не може бути від\'ємною'
    ]));
}

// Перевірка тривалості (повинна бути додатною)
if ($durationHours <= 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Тривалість курсу повинна бути більше 0 годин'
    ]));
}

// Перевірка коректності ID ментора
$mentorCheckSql = "SELECT id FROM users WHERE id = ? AND role IN ('mentor', 'admin')";
$mentorCheckStmt = $conn->prepare($mentorCheckSql);
$mentorCheckStmt->bind_param("i", $mentorId);
$mentorCheckStmt->execute();
$mentorResult = $mentorCheckStmt->get_result();

if ($mentorResult->num_rows == 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Недійсний ID ментора або користувач не має права створювати курси'
    ]));
}

// Обробка зображення (якщо є)
$imageUrl = '';
if (isset($_FILES['image_url']) && $_FILES['image_url']['error'] == 0) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxFileSize = 5 * 1024 * 1024; // 5 MB
    
    // Логування інформації про файл
    error_log("Processing image upload: " . print_r($_FILES['image_url'], true));
    
    // Перевірка типу файлу
    if (!in_array($_FILES['image_url']['type'], $allowedTypes)) {
        http_response_code(400);
        error_log("Unsupported file type: " . $_FILES['image_url']['type']);
        die(json_encode([
            'success' => false,
            'message' => 'Непідтримуваний формат зображення. Використовуйте JPEG, PNG, GIF або WebP'
        ]));
    }
    
    // Перевірка розміру файлу
    if ($_FILES['image_url']['size'] > $maxFileSize) {
        http_response_code(400);
        error_log("File too large: " . $_FILES['image_url']['size'] . " bytes");
        die(json_encode([
            'success' => false,
            'message' => 'Розмір зображення не повинен перевищувати 5 MB'
        ]));
    }
    
    // Створення унікального імені файлу
    $fileName = 'course_' . time() . '_' . bin2hex(random_bytes(8)) . '.jpg';
    
    // Визначення шляху для збереження файлу
    // Використовуємо кілька варіантів для XAMPP
    $documentRoot = $_SERVER['DOCUMENT_ROOT'];
    
    // Якщо ми в директорії /project (відносно кореня сайту)
    if (strpos($_SERVER['PHP_SELF'], '/server/') !== false) {
        // Якщо скрипт в папці server, то картинки в ../project/img/courses/
        $projectPath = dirname(dirname(__FILE__)) . '/project/';
        $uploadDir = $projectPath . 'img/courses/';
    } else {
        // Стандартне розташування
        $uploadDir = $documentRoot . '/img/courses/';
    }
    
    // Логування інформації про шлях
    error_log("Upload directory: " . $uploadDir);
    error_log("DOCUMENT_ROOT: " . $documentRoot);
    error_log("PHP_SELF: " . $_SERVER['PHP_SELF']);
    error_log("__FILE__: " . __FILE__);
    
    // Створення директорії, якщо не існує
    if (!file_exists($uploadDir)) {
        $mkdirResult = mkdir($uploadDir, 0777, true);
        error_log("Directory creation result: " . ($mkdirResult ? "success" : "failure"));
    } else {
        error_log("Directory already exists");
    }
    
    $uploadPath = $uploadDir . $fileName;
    error_log("Full upload path: " . $uploadPath);
    
    // Збереження файлу
    if (move_uploaded_file($_FILES['image_url']['tmp_name'], $uploadPath)) {
        // URL для доступу до зображення у браузері
        $imageUrl = 'img/courses/' . $fileName;
        error_log("File uploaded successfully. Image URL: " . $imageUrl);
    } else {
        http_response_code(500);
        error_log("Error uploading file to: " . $uploadPath);
        error_log("Upload error details: " . print_r(error_get_last(), true));
        die(json_encode([
            'success' => false,
            'message' => 'Помилка при завантаженні зображення. Перевірте права доступу до папки.'
        ]));
    }
}

try {
    // Транзакція для створення курсу та його секцій
    $conn->begin_transaction();
    
    // Логування параметрів запиту
    error_log("Course creation parameters: mentor_id=$mentorId, category_id=$categoryId, title='$title', image_url='$imageUrl'");
    
    // Переконаємось, що $imageUrl не пустий, якщо файл не був завантажений
    if (empty($imageUrl)) {
        $imageUrl = 'img/courses/default-course.jpg'; // Використовуємо стандартне зображення
        error_log("Using default image: $imageUrl");
    }
    
    // Екрануємо значення для безпечного використання в SQL-запиті
    $imageUrlEscaped = $conn->real_escape_string($imageUrl);
    
    // Підготовка SQL запиту для створення курсу з безпосереднім включенням image_url
    $sql = "INSERT INTO courses (mentor_id, category_id, language_id, level_id, title, short_description, long_description, image_url, price, duration_hours, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, '$imageUrlEscaped', ?, ?, NOW(), NOW())";
    
    $stmt = $conn->prepare($sql);
    
    // Перевіримо тип поля image_url в базі даних
    $tableCheckSql = "SHOW COLUMNS FROM courses LIKE 'image_url'";
    $tableResult = $conn->query($tableCheckSql);
    if ($tableResult && $tableResult->num_rows > 0) {
        $column = $tableResult->fetch_assoc();
        error_log("image_url column type: " . print_r($column, true));
    }
    
    // Увага: $imageUrl тепер безпосередньо включено в запит, а не через bind_param
    error_log("SQL query with image_url: " . str_replace('$imageUrlEscaped', $imageUrlEscaped, $sql));
    
    $stmt->bind_param("iiisssdis", 
        $mentorId, 
        $categoryId, 
        $languageId, 
        $levelId, 
        $title, 
        $shortDescription, 
        $longDescription, 
        $price, 
        $durationHours
    );
    
    // Додаткова перевірка, щоб переконатися що значення параметрів правильні
    error_log("Parameter binding done. Ready to execute.");
    
    if (!$stmt->execute()) {
        throw new Exception("Помилка при створенні курсу: " . $stmt->error);
    }
    
    // Отримання ID нового курсу
    $courseId = $conn->insert_id;
    error_log("Course created with ID: $courseId");
    
    // Перевірка записаного значення image_url
    $checkImageSql = "SELECT image_url FROM courses WHERE id = ?";
    $checkStmt = $conn->prepare($checkImageSql);
    $checkStmt->bind_param("i", $courseId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult && $checkResult->num_rows > 0) {
        $row = $checkResult->fetch_assoc();
        error_log("Saved image_url value: " . $row['image_url']);
    }
    
    // Обробка секцій курсу
    if (isset($_POST['sections']) && is_array($_POST['sections'])) {
        foreach ($_POST['sections'] as $index => $section) {
            if (!isset($section['title']) || trim($section['title']) === '') {
                throw new Exception("Назва секції #{$index} є обов'язковою");
            }
            
            $sectionTitle = trim($section['title']);
            $sectionDescription = isset($section['description']) ? trim($section['description']) : null;
            
            // Додавання секції
            $sectionSql = "INSERT INTO course_sections (course_id, title, description, order_num, created_at, updated_at) 
                           VALUES (?, ?, ?, ?, NOW(), NOW())";
            
            $sectionStmt = $conn->prepare($sectionSql);
            $sectionStmt->bind_param("issi", $courseId, $sectionTitle, $sectionDescription, $index);
            
            if (!$sectionStmt->execute()) {
                throw new Exception("Помилка при створенні секції курсу: " . $sectionStmt->error);
            }
        }
    }
    
    // Завершення транзакції
    $conn->commit();
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'course_id' => $courseId,
        'message' => 'Курс успішно створено'
    ]);

} catch (Exception $e) {
    // Відкат транзакції у випадку помилки
    $conn->rollback();
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // Закриваємо з'єднання з базою даних
    $conn->close();
} 