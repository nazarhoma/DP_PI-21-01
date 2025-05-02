<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'connect.php';

// Перевіряємо, чи метод запиту POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволений'
    ]);
    exit;
}

try {
    // Перевіряємо наявність ID відгуку
    if (!isset($_POST['review_id']) || empty($_POST['review_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID відгуку не вказано'
        ]);
        exit;
    }
    
    $reviewId = (int)$_POST['review_id'];
    
    // Видаляємо відгук
    $sql = "DELETE FROM course_reviews WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $reviewId);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Відгук успішно видалено'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Відгук не знайдено або вже видалено'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Помилка при видаленні відгуку: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 