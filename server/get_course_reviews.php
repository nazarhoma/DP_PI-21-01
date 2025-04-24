<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

$response = array();

// Перевіряємо, чи передано ID курсу
if (!isset($_GET['course_id']) || empty($_GET['course_id'])) {
    $response['error'] = 'ID курсу не вказано';
    echo json_encode($response);
    exit;
}

$courseId = intval($_GET['course_id']);

try {
    // Запит для отримання відгуків про курс
    $sql = "SELECT 
                r.id,
                r.rating,
                r.review_text,
                r.created_at,
                r.updated_at,
                u.id as user_id,
                u.username,
                u.first_name,
                u.last_name,
                u.avatar
            FROM 
                course_reviews r
            LEFT JOIN 
                users u ON r.user_id = u.id
            WHERE 
                r.course_id = ?
            ORDER BY 
                r.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $courseId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reviews = array();
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Форматуємо дані користувача
            $username = !empty($row['username']) ? $row['username'] : 'Користувач';
            $fullName = trim($row['first_name'] . ' ' . $row['last_name']);
            if (!empty($fullName)) {
                $username = $fullName;
            }
            
            // Перевіряємо наявність аватару
            $avatar = !empty($row['avatar']) ? $row['avatar'] : 'img/avatars/default-avatar.png';
            
            $reviews[] = array(
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'username' => $username,
                'avatar' => $avatar,
                'rating' => intval($row['rating']),
                'review_text' => $row['review_text'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            );
        }
        
        $response = $reviews;
    } else {
        $response = array(); // Порожній масив, якщо відгуків немає
    }
} catch (Exception $e) {
    $response['error'] = 'Помилка: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 