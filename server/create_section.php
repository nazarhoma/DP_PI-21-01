<?php
// Налаштування заголовків CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Перевіряємо, чи запит має метод OPTIONS (preflight запит)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Підключення до бази даних
include 'connect.php';

// Перевірка методу запиту
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволено. Використовуйте POST.'
    ]);
    exit;
}

// Перевірка наявності обов'язкових полів
if (!isset($_POST['course_id']) || !isset($_POST['title']) || trim($_POST['title']) === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Необхідно вказати ID курсу та назву секції'
    ]);
    exit;
}

try {
    $courseId = (int)$_POST['course_id'];
    $title = trim($_POST['title']);
    $description = isset($_POST['description']) ? trim($_POST['description']) : null;
    
    // Перевірка існування курсу
    $checkCourseSql = "SELECT id FROM courses WHERE id = ?";
    $checkCourseStmt = $conn->prepare($checkCourseSql);
    $checkCourseStmt->bind_param('i', $courseId);
    $checkCourseStmt->execute();
    $courseResult = $checkCourseStmt->get_result();
    
    if ($courseResult->num_rows === 0) {
        throw new Exception('Курс не знайдено');
    }
    
    // Отримання максимального порядкового номера для секцій цього курсу
    $maxOrderSql = "SELECT MAX(order_num) as max_order FROM course_sections WHERE course_id = ?";
    $maxOrderStmt = $conn->prepare($maxOrderSql);
    $maxOrderStmt->bind_param('i', $courseId);
    $maxOrderStmt->execute();
    $maxOrderResult = $maxOrderStmt->get_result();
    $maxOrder = $maxOrderResult->fetch_assoc()['max_order'];
    
    // Встановлення нового порядкового номера
    $orderNum = $maxOrder !== null ? $maxOrder + 1 : 0;
    
    // Додавання нової секції
    $insertSql = "INSERT INTO course_sections (course_id, title, description, order_num) VALUES (?, ?, ?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bind_param('issi', $courseId, $title, $description, $orderNum);
    
    if (!$insertStmt->execute()) {
        throw new Exception('Помилка при створенні секції: ' . $insertStmt->error);
    }
    
    $sectionId = $insertStmt->insert_id;
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'section_id' => $sectionId,
        'message' => 'Секцію успішно створено'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Закриваємо з'єднання
$conn->close();
?> 