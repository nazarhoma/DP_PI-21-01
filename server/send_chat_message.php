<?php
// Дозволяємо CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');
require_once 'connect.php';

// Перехоплюємо помилки
function captureError($errno, $errstr, $errfile, $errline) {
    echo json_encode([
        'success' => false, 
        'error' => $errstr,
        'file' => $errfile,
        'line' => $errline
    ]);
    exit;
}
set_error_handler('captureError');

// Додаємо логування помилок для діагностики
$debug_info = [];

try {
    // Отримуємо дані користувача
    session_start();
    $sender_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    // Якщо нема в сесії, беремо з POST
    if (!$sender_id && isset($_POST['user_id'])) {
        $sender_id = intval($_POST['user_id']);
    } elseif (!$sender_id) {
        throw new Exception("Не вдалося отримати ID відправника");
    }
    
    $debug_info['sender_id'] = $sender_id;
    
    // Отримуємо ID отримувача
    if (!isset($_POST['recipient_id']) || !$_POST['recipient_id']) {
        throw new Exception("Не вказано отримувача");
    }
    
    $receiver_id = intval($_POST['recipient_id']);
    $debug_info['receiver_id'] = $receiver_id;
    
    // Отримуємо текст повідомлення
    if (!isset($_POST['message']) || !$_POST['message']) {
        throw new Exception("Повідомлення порожнє");
    }
    
    $message = trim($_POST['message']);
    $debug_info['message_length'] = strlen($message);
    
    // Перевіряємо наявність отримувача
    $check_receiver = "SELECT id FROM users WHERE id = ?";
    $check_stmt = $conn->prepare($check_receiver);
    
    if (!$check_stmt) {
        throw new Exception("Помилка підготовки запиту для перевірки отримувача: " . $conn->error);
    }
    
    $check_stmt->bind_param('i', $receiver_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        throw new Exception("Отримувач не знайдений");
    }
    
    // Підготовка SQL-запиту для вставки повідомлення
    $sql = "INSERT INTO messages (sender_id, receiver_id, text, created_at) VALUES (?, ?, ?, NOW())";
    $debug_info['sql'] = $sql;
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту: " . $conn->error);
    }
    
    $stmt->bind_param('iis', $sender_id, $receiver_id, $message);
    $success = $stmt->execute();
    
    if (!$success) {
        throw new Exception("Помилка при відправленні повідомлення: " . $stmt->error);
    }
    
    $message_id = $stmt->insert_id;
    $debug_info['message_id'] = $message_id;
    
    echo json_encode([
        'success' => true,
        'message_id' => $message_id,
        'debug' => $debug_info
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => $debug_info
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
} 