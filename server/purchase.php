<?php
// Дозволяємо доступ тільки з нашого домену
header("Access-Control-Allow-Origin: https://byway.store");
// Дозволяємо передачу credentials (cookies, authorization headers)
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Обробка OPTIONS запиту
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
require_once 'connect.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $course_id = $data['course_id'];
    
    // Отримуємо ціну курсу
    $stmt = $conn->prepare("SELECT price FROM courses WHERE id = ?");
    $stmt->bind_param("i", $course_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $course = $result->fetch_assoc();
    
    if (!$course) {
        http_response_code(404);
        echo json_encode(['error' => 'Course not found']);
        exit();
    }

    // Створюємо замовлення
    $stmt = $conn->prepare("INSERT INTO orders (user_id, course_id, price) VALUES (?, ?, ?)");
    $stmt->bind_param("iid", $user_id, $course_id, $course['price']);
    
    if ($stmt->execute()) {
        // Якщо курс був у кошику - видаляємо його
        $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ? AND course_id = ?");
        $stmt->bind_param("ii", $user_id, $course_id);
        $stmt->execute();
        
        echo json_encode(['message' => 'Purchase successful']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to process purchase']);
    }
} 