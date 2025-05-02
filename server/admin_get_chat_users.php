<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'connect.php';

try {
    // Отримуємо всіх користувачів з ролями student та mentor
    $sql = "SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.avatar,
        (
            SELECT MAX(created_at)
            FROM messages
            WHERE sender_id = u.id OR receiver_id = u.id
        ) as last_message_time
        FROM users u
        WHERE u.role IN ('student', 'mentor')
        ORDER BY username ASC";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $users = array();
        
        while ($row = $result->fetch_assoc()) {
            // Форматуємо ім'я користувача
            $name = $row['first_name'] && $row['last_name'] 
                  ? $row['first_name'] . ' ' . $row['last_name'] 
                  : $row['username'];
            
            $users[] = array(
                'id' => $row['id'],
                'name' => $name,
                'status' => ucfirst($row['role']),
                'email' => $row['email'],
                'avatar_url' => $row['avatar'],
                'unread_messages' => 0,
                'last_message_time' => $row['last_message_time']
            );
        }
        
        echo json_encode(array(
            'success' => true,
            'users' => $users
        ));
    } else {
        echo json_encode(array(
            'success' => false,
            'message' => 'Помилка запиту до бази даних: ' . $conn->error
        ));
    }
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Помилка: ' . $e->getMessage()
    ));
}

$conn->close();
?> 