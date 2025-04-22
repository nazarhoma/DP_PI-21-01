<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

$response = array();

// Перевіряємо, чи передано ID користувача
if (!isset($_GET['id']) || empty($_GET['id'])) {
    $response['error'] = 'ID користувача не вказано';
    echo json_encode($response);
    exit;
}

$userId = intval($_GET['id']);

try {
    // Запит для отримання інформації про користувача
    $sql = "SELECT 
                id, 
                username, 
                email, 
                role, 
                first_name, 
                last_name, 
                avatar, 
                gender, 
                education, 
                native_language,
                (SELECT COUNT(*) FROM courses WHERE mentor_id = users.id) as courses_count,
                (SELECT AVG(r.rating) FROM course_reviews r 
                    JOIN courses c ON r.course_id = c.id 
                    WHERE c.mentor_id = users.id) as average_rating
            FROM 
                users 
            WHERE 
                id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $userData = $result->fetch_assoc();
        
        // Перевіряємо наявність аватару
        $avatar = !empty($userData['avatar']) ? $userData['avatar'] : 'img/default-avatar.png';
        
        // Формуємо відповідь
        $response = array(
            'id' => $userData['id'],
            'username' => $userData['username'],
            'email' => $userData['email'],
            'role' => $userData['role'],
            'first_name' => $userData['first_name'],
            'last_name' => $userData['last_name'],
            'avatar' => $avatar,
            'gender' => $userData['gender'],
            'education' => $userData['education'],
            'native_language' => $userData['native_language'],
            'courses_count' => intval($userData['courses_count']),
            'average_rating' => $userData['average_rating'] ? floatval($userData['average_rating']) : 0
        );
    } else {
        $response['error'] = 'Користувача не знайдено';
    }
} catch (Exception $e) {
    $response['error'] = 'Помилка: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 