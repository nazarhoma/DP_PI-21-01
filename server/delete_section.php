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

// Перевірка наявності обов'язкового параметра section_id
if (!isset($_POST['section_id']) || !is_numeric($_POST['section_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Не вказаний або некоректний ID секції'
    ]);
    exit;
}

$sectionId = (int)$_POST['section_id'];

try {
    // Початок транзакції
    $conn->begin_transaction();
    
    // Перевірка існування секції
    $checkSectionSql = "SELECT id FROM course_sections WHERE id = ?";
    $checkSectionStmt = $conn->prepare($checkSectionSql);
    $checkSectionStmt->bind_param('i', $sectionId);
    $checkSectionStmt->execute();
    $sectionResult = $checkSectionStmt->get_result();
    
    if ($sectionResult->num_rows === 0) {
        throw new Exception('Секцію не знайдено');
    }
    
    // Видалення всіх ресурсів секції (зовнішні ключі з ON DELETE CASCADE впораються з цим автоматично, 
    // але для впевненості і можливого майбутнього обробника файлів ми можемо тут додати власний код)
    
    // Видалення секції
    $deleteSectionSql = "DELETE FROM course_sections WHERE id = ?";
    $deleteSectionStmt = $conn->prepare($deleteSectionSql);
    $deleteSectionStmt->bind_param('i', $sectionId);
    
    if (!$deleteSectionStmt->execute()) {
        throw new Exception('Помилка при видаленні секції: ' . $deleteSectionStmt->error);
    }
    
    // Завершення транзакції
    $conn->commit();
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'message' => 'Секцію успішно видалено'
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