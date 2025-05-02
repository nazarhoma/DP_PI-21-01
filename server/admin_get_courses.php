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
    // Запит до бази даних для отримання всіх курсів
    $sql = "SELECT c.id, c.title, c.price, c.image_url,
                (SELECT COUNT(*) FROM course_sections WHERE course_id = c.id) as chapters_count,
                (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as orders_count,
                (SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id) as reviews_count
            FROM courses c
            ORDER BY c.created_at DESC";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $courses = array();
        
        while ($row = $result->fetch_assoc()) {
            $courses[] = array(
                'id' => $row['id'],
                'title' => $row['title'],
                'price' => $row['price'],
                'image_url' => $row['image_url'],
                'chapters_count' => $row['chapters_count'],
                'orders_count' => $row['orders_count'],
                'reviews_count' => $row['reviews_count']
            );
        }
        
        echo json_encode(array(
            'success' => true,
            'courses' => $courses
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