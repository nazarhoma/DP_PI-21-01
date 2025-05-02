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
    // Отримуємо всі відгуки з інформацією про користувачів та курси
    $sql = "SELECT cr.id, cr.rating, cr.review_text as text, cr.created_at as date,
                   c.title as course_title, 
                   u.username as user_name, CONCAT(u.first_name, ' ', u.last_name) as full_name,
                   u.avatar as user_avatar
            FROM course_reviews cr
            JOIN courses c ON cr.course_id = c.id
            JOIN users u ON cr.user_id = u.id
            ORDER BY cr.created_at DESC";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $reviews = array();
        
        while ($row = $result->fetch_assoc()) {
            // Використовуємо повне ім'я користувача, якщо воно є
            $userName = !empty(trim($row['full_name'])) ? $row['full_name'] : $row['user_name'];
            
            $reviews[] = array(
                'id' => $row['id'],
                'rating' => $row['rating'],
                'text' => $row['text'],
                'date' => date('d.m.Y H:i', strtotime($row['date'])),
                'course_title' => $row['course_title'],
                'user_name' => $userName,
                'user_avatar' => $row['user_avatar']
            );
        }
        
        echo json_encode(array(
            'success' => true,
            'reviews' => $reviews
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