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
    // Перевіряємо наявність параметра user_id
    if (!isset($_POST['user_id']) || empty($_POST['user_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID користувача не вказано'
        ]);
        exit;
    }
    
    $userId = (int)$_POST['user_id'];
    
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
    
    // Позначаємо повідомлення від користувача як прочитані
    $updateQuery = "UPDATE messages SET is_read = 1 
                   WHERE sender_id = ? AND receiver_id = ? AND is_read = 0";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param("ii", $userId, $adminId);
    $updateStmt->execute();
    
    // Отримуємо повідомлення між адміністратором і користувачем
    $query = "SELECT m.id, m.sender_id, m.receiver_id, m.text, m.created_at,
                    CASE WHEN m.sender_id = ? THEN 1 ELSE 0 END as is_admin
              FROM messages m
              WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                 OR (m.sender_id = ? AND m.receiver_id = ?)
              ORDER BY m.created_at ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("iiiii", $adminId, $userId, $adminId, $adminId, $userId);
    $stmt->execute();
    
    $messages = [];
    
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $messages[] = [
            'id' => $row['id'],
            'text' => $row['text'],
            'time' => date('H:i', strtotime($row['created_at'])),
            'date' => date('d.m.Y', strtotime($row['created_at'])),
            'is_admin' => (bool)$row['is_admin']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'messages' => $messages
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Помилка при отриманні повідомлень: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 