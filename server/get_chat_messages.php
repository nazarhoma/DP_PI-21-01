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

// Додаємо логування помилок
$debug_info = [];

try {
    // Отримуємо ID користувача з сесії
    session_start();
    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    // Якщо нема в сесії, беремо з POST
    if (!$user_id && isset($_POST['user_id'])) {
        $user_id = $_POST['user_id'];
    } elseif (!$user_id) {
        // Якщо немає ні в сесії, ні в POST
        throw new Exception("Не вдалося отримати ID користувача");
    }
    
    $debug_info['user_id'] = $user_id;
    
    // Отримуємо ID співрозмовника
    $chat_user_id = isset($_POST['chat_user_id']) ? intval($_POST['chat_user_id']) : 0;
    $debug_info['chat_user_id'] = $chat_user_id;
    
    // Отримуємо ID останнього повідомлення для оновлення
    $last_message_id = isset($_POST['last_message_id']) ? intval($_POST['last_message_id']) : 0;
    $debug_info['last_message_id'] = $last_message_id;
    
    // Перевіряємо чи вказаний ID співрозмовника
    if (!$chat_user_id) {
        throw new Exception("Не вказано співрозмовника");
    }

    // Перевіряємо чи такий користувач існує
    $sql_check = "SELECT id FROM users WHERE id = ?";
    $stmt_check = $conn->prepare($sql_check);
    
    if (!$stmt_check) {
        throw new Exception("Помилка підготовки запиту перевірки: " . $conn->error);
    }
    
    $stmt_check->bind_param('i', $chat_user_id);
    $stmt_check->execute();
    $res_check = $stmt_check->get_result();
    
    if ($res_check->num_rows === 0) {
        throw new Exception("Користувач не знайдений");
    }
    
    // Складаємо запит для отримання повідомлень
    $sql = "SELECT m.id, m.sender_id, m.receiver_id, m.text as message, m.created_at as sent_at 
            FROM messages m
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)";
    
    if ($last_message_id > 0) {
        $sql .= " AND m.id > ?";
    }
    
    $sql .= " ORDER BY m.id ASC";
    
    if ($last_message_id === 0) {
        $sql .= " LIMIT 50";
    }
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту: " . $conn->error);
    }
    
    if ($last_message_id > 0) {
        $stmt->bind_param('iiiii', $user_id, $chat_user_id, $chat_user_id, $user_id, $last_message_id);
    } else {
        $stmt->bind_param('iiii', $user_id, $chat_user_id, $chat_user_id, $user_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = [
            'id' => $row['id'],
            'sender_id' => $row['sender_id'],
            'receiver_id' => $row['receiver_id'],
            'message' => $row['message'],
            'sent_at' => $row['sent_at']
        ];
    }
    
    // Додаємо інформацію про кількість повідомлень
    $debug_info['messages_count'] = count($messages);
    $debug_info['last_message_id'] = $last_message_id;
    
    // Повертаємо результат
    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'timestamp' => time()
    ]);
    
} catch (Exception $e) {
    // Повертаємо помилку з детальною інформацією
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