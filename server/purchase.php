<?php
// Дозволяємо доступ тільки з нашого домену
header("Access-Control-Allow-Origin: *");
// Дозволяємо передачу credentials (cookies, authorization headers)
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Обробка OPTIONS запиту
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
require_once 'connect.php';

// Перевірка авторизації
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Отримання даних
$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['course_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Course ID is required']);
    exit();
}

$course_id = $data['course_id'];

try {
    // Перевіряємо чи курс існує і отримуємо його ціну
    $stmt = $conn->prepare("SELECT id, price FROM courses WHERE id = ?");
    $stmt->bind_param("i", $course_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $course = $result->fetch_assoc();

    if (!$course) {
        http_response_code(404);
        echo json_encode(['error' => 'Course not found']);
        exit();
    }

    // Перевіряємо чи користувач вже не купив цей курс
    $stmt = $conn->prepare("SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?");
    $stmt->bind_param("ii", $user_id, $course_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Course already purchased']);
        exit();
    }

    // Починаємо транзакцію
    $conn->begin_transaction();

    try {
        // Створюємо запис про покупку
        $stmt = $conn->prepare("INSERT INTO course_enrollments (user_id, course_id, status, enrolled_at, progress_percentage) VALUES (?, ?, 'active', NOW(), 0)");
        $stmt->bind_param("ii", $user_id, $course_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create enrollment");
        }

        // Створюємо або оновлюємо запис в таблиці orders
        $stmt = $conn->prepare("INSERT INTO orders (user_id, course_id, price, status, order_date) VALUES (?, ?, ?, 'completed', NOW())");
        $stmt->bind_param("iid", $user_id, $course_id, $course['price']);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create order");
        }

        // Видаляємо курс з кошика, якщо він там був
        $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ? AND course_id = ?");
        $stmt->bind_param("ii", $user_id, $course_id);
        $stmt->execute();

        // Підтверджуємо транзакцію
        $conn->commit();
        
        echo json_encode(['message' => 'Purchase successful']);
    } catch (Exception $e) {
        // Відкатуємо транзакцію у випадку помилки
        $conn->rollback();
        throw $e;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to process purchase: ' . $e->getMessage()]);
}

// Закриваємо з'єднання
$conn->close(); 