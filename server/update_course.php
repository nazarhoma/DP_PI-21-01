<?php
// Налаштування заголовків CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Перевіряємо, чи запит має метод OPTIONS (preflight запит)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Підключення до бази даних
require_once 'connect.php';

// Перевірка методу запиту
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволено. Використовуйте POST.'
    ]);
    exit;
}

// Перевірка наявності course_id
if (!isset($_POST['course_id']) || empty($_POST['course_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID курсу не вказано'
    ]);
    exit;
}

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

// Обов'язкові поля для оновлення курсу
$requiredFields = ['course_id', 'title', 'short_description', 'price', 'duration_hours'];

// Валідація обов'язкових полів
$validation = validateRequiredFields($requiredFields);
if (!$validation['valid']) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => "Поле '{$validation['field']}' є обов'язковим"
    ]);
    exit;
}

try {
    // Початок транзакції
    $conn->begin_transaction();
    
    // Отримання даних з форми
    $courseId = (int)$_POST['course_id'];
    $title = trim($_POST['title']);
    $shortDescription = trim($_POST['short_description']);
    $longDescription = isset($_POST['long_description']) ? trim($_POST['long_description']) : '';
    $categoryId = isset($_POST['category_id']) && !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
    $languageId = isset($_POST['language_id']) && !empty($_POST['language_id']) ? (int)$_POST['language_id'] : null;
    $levelId = isset($_POST['level_id']) && !empty($_POST['level_id']) ? (int)$_POST['level_id'] : null;
    $price = (float)$_POST['price'];
    $durationHours = (int)$_POST['duration_hours'];
    
    // Перевірка існування курсу
    $checkSql = "SELECT mentor_id FROM courses WHERE id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param('i', $courseId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Курс не знайдено');
    }
    
    $courseData = $result->fetch_assoc();
    
    // Перевірка, чи є користувач ментором цього курсу
    if (isset($_POST['mentor_id']) && $courseData['mentor_id'] != (int)$_POST['mentor_id']) {
        throw new Exception('У вас немає прав на редагування цього курсу');
    }
    
    // Обробка завантаження нового зображення
    $imageUrl = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../project/img/courses/';
        
        // Створюємо директорію, якщо не існує
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Генеруємо унікальне ім'я файлу
        $fileName = uniqid() . '_' . basename($_FILES['image']['name']);
        $targetPath = $uploadDir . $fileName;
        
        // Перевіряємо, чи це дійсно зображення
        $check = getimagesize($_FILES['image']['tmp_name']);
        if ($check === false) {
            throw new Exception('Файл не є зображенням');
        }
        
        // Обмеження на розмір файлу (5 МБ)
        if ($_FILES['image']['size'] > 5000000) {
            throw new Exception('Розмір файлу перевищує 5 МБ');
        }
        
        // Обмеження на формат файлу
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        $fileExtension = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            throw new Exception('Дозволені лише файли формату JPG, JPEG, PNG і GIF');
        }
        
        // Переміщуємо файл
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $imageUrl = '/img/courses/' . $fileName;
        } else {
            throw new Exception('Помилка при завантаженні зображення');
        }
    }
    
    // Оновлення даних курсу
    if ($imageUrl) {
        // Якщо є нове зображення
        $updateSql = "UPDATE courses 
                      SET title = ?, short_description = ?, long_description = ?, 
                          category_id = ?, language_id = ?, level_id = ?, 
                          price = ?, duration_hours = ?, image_url = ?, 
                          updated_at = NOW() 
                      WHERE id = ?";
        
        $updateStmt = $conn->prepare($updateSql);
        
        // Перевірка на null значення для категорії, мови та рівня
        if ($categoryId === null) $categoryId = NULL;
        if ($languageId === null) $languageId = NULL;
        if ($levelId === null) $levelId = NULL;
        
        $updateStmt->bind_param("sssiiiissi", 
            $title, $shortDescription, $longDescription, 
            $categoryId, $languageId, $levelId, 
            $price, $durationHours, $imageUrl, 
            $courseId
        );
    } else {
        // Якщо нове зображення не завантажено
        $updateSql = "UPDATE courses 
                      SET title = ?, short_description = ?, long_description = ?, 
                          category_id = ?, language_id = ?, level_id = ?, 
                          price = ?, duration_hours = ?, 
                          updated_at = NOW() 
                      WHERE id = ?";
        
        $updateStmt = $conn->prepare($updateSql);
        
        // Перевірка на null значення для категорії, мови та рівня
        if ($categoryId === null) $categoryId = NULL;
        if ($languageId === null) $languageId = NULL;
        if ($levelId === null) $levelId = NULL;
        
        $updateStmt->bind_param("sssiiidii", 
            $title, $shortDescription, $longDescription, 
            $categoryId, $languageId, $levelId, 
            $price, $durationHours, 
            $courseId
        );
    }
    
    // Виконання запиту
    if (!$updateStmt->execute()) {
        throw new Exception('Помилка при оновленні курсу: ' . $updateStmt->error);
    }
    
    // Завершення транзакції
    $conn->commit();
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'message' => 'Курс успішно оновлено'
    ]);
    
} catch (Exception $e) {
    // Відкат транзакції у разі помилки
    $conn->rollback();
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Закриваємо з'єднання
$conn->close();
?> 