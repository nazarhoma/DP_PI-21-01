<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

$response = array();

try {
    // Отримуємо топ-5 відгуків з бази даних з рейтингом 4 або 5
    $sql = "SELECT 
                cr.id,
                cr.course_id,
                cr.user_id,
                cr.rating,
                cr.review_text as text,
                u.first_name,
                u.last_name,
                u.avatar,
                c.title as course_title
            FROM 
                course_reviews cr
            JOIN 
                users u ON cr.user_id = u.id
            JOIN 
                courses c ON cr.course_id = c.id
            WHERE 
                cr.rating >= 4
            ORDER BY 
                cr.rating DESC, cr.created_at DESC
            LIMIT 5";
    
    $result = $conn->query($sql);
    
    if ($result === false) {
        throw new Exception("Помилка в SQL запиті: " . $conn->error);
    }
    
    $reviews = array();
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            // Формуємо повне ім'я
            $name = trim($row['first_name'] . ' ' . $row['last_name']);
            if (empty($name)) {
                $name = "Анонімний користувач";
            }
            
            // Перевіряємо аватар
            $avatar = !empty($row['avatar']) ? $row['avatar'] : 'img/customer.jpg';
            
            // Додаємо відгук до масиву
            $reviews[] = array(
                "id" => $row['id'],
                "name" => $name,
                "avatar" => $avatar,
                "text" => $row['text'],
                "rating" => $row['rating'],
                "course_id" => $row['course_id'],
                "course_title" => $row['course_title']
            );
        }
        
        $response['success'] = true;
        $response['reviews'] = $reviews;
    } else {
        $response['success'] = true;
        $response['reviews'] = [];
        $response['message'] = "Відгуків не знайдено";
    }
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
$conn->close(); 