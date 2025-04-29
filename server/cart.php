<?php
// Дозволяємо доступ тільки з нашого домену
header("Access-Control-Allow-Origin: https://byway.store");
// Дозволяємо передачу credentials (cookies, authorization headers)
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
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

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Отримання вмісту кошика
        $stmt = $conn->prepare("
            SELECT c.id as cart_id, co.* 
            FROM cart c 
            JOIN courses co ON c.course_id = co.id 
            WHERE c.user_id = ?
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $cart_items = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($cart_items);
        break;

    case 'POST':
        // Додавання курсу в кошик
        $data = json_decode(file_get_contents('php://input'), true);
        $course_id = $data['course_id'];

        // Перевірка чи курс вже не в кошику
        $check = $conn->prepare("SELECT id FROM cart WHERE user_id = ? AND course_id = ?");
        $check->bind_param("ii", $user_id, $course_id);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            echo json_encode(['message' => 'Course already in cart']);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO cart (user_id, course_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $user_id, $course_id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Added to cart']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add to cart']);
        }
        break;

    case 'DELETE':
        // Видалення з кошика
        $cart_id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $cart_id, $user_id);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Removed from cart']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to remove from cart']);
        }
        break;
} 