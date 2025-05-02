<?php
// Налаштування заголовків для CORS
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
    // Перевіряємо наявність user_id
    if (!isset($_POST['user_id']) || empty($_POST['user_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID користувача не вказано'
        ]);
        exit;
    }
    
    $userId = (int)$_POST['user_id'];
    
    // Отримуємо дані користувача з правильними назвами полів
    $query = "SELECT id, username, email, role, first_name, last_name, avatar 
              FROM users 
              WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Користувача не знайдено'
        ]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    // Формуємо правильну відповідь
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'name' => !empty($user['first_name']) ? $user['first_name'] . ' ' . $user['last_name'] : $user['username'],
            'email' => $user['email'],
            'avatar_url' => $user['avatar'],
            'role' => $user['role']
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Помилка при отриманні даних користувача: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 