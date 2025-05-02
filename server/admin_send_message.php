<?php
date_default_timezone_set('Europe/Kyiv');

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
    // Перевіряємо наявність необхідних параметрів
    if (!isset($_POST['user_id']) || empty($_POST['user_id']) ||
        !isset($_POST['message']) || empty($_POST['message'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Необхідні поля не заповнені'
        ]);
        exit;
    }
    
    $userId = (int)$_POST['user_id'];
    $message = trim($_POST['message']);
    
    // Отримуємо ID адміністратора
    $adminQuery = "SELECT id FROM users WHERE role = 'admin' LIMIT 1";
    $adminResult = $conn->query($adminQuery);
    
    if ($adminResult->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Адміністратора не знайдено'
        ]);
        exit;
    }
    
    $adminId = $adminResult->fetch_assoc()['id'];
    
    // Вставляємо нове повідомлення
    $query = "INSERT INTO messages (sender_id, receiver_id, text, created_at, is_read) 
              VALUES (?, ?, ?, ?, 0)";
    $created_at = date('Y-m-d H:i:s');
    $stmt = $conn->prepare($query);
    $stmt->bind_param("iiss", $adminId, $userId, $message, $created_at);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Повідомлення успішно надіслано',
            'message_id' => $stmt->insert_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Помилка при надсиланні повідомлення'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Помилка при надсиланні повідомлення: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 