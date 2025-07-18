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

// Перевірка наявності section_id
if (!isset($_POST['section_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Необхідно вказати ID секції'
    ]);
    exit;
}

try {
    $sectionId = (int)$_POST['section_id'];
    
    // Перевірка існування секції
    $checkSectionSql = "SELECT id, title, description FROM course_sections WHERE id = ?";
    $checkSectionStmt = $conn->prepare($checkSectionSql);
    $checkSectionStmt->bind_param('i', $sectionId);
    $checkSectionStmt->execute();
    $sectionResult = $checkSectionStmt->get_result();
    
    if ($sectionResult->num_rows === 0) {
        throw new Exception('Секцію не знайдено');
    }
    
    $currentSection = $sectionResult->fetch_assoc();
    
    // Отримуємо нові значення або використовуємо поточні
    $title = isset($_POST['title']) && trim($_POST['title']) !== '' ? 
        trim($_POST['title']) : $currentSection['title'];
    $description = isset($_POST['description']) ? 
        trim($_POST['description']) : $currentSection['description'];
    
    // Оновлення секції
    $updateSql = "UPDATE course_sections SET title = ?, description = ?, updated_at = NOW() WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param('ssi', $title, $description, $sectionId);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Помилка при оновленні секції: ' . $updateStmt->error);
    }
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'message' => 'Секцію успішно оновлено'
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