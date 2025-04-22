<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Виведення помилок
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include 'connect.php';

// Встановлюємо менш строгий SQL режим для групування
$conn->query("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

$response = array();

// Перевіряємо, чи передано ID курсу
if (!isset($_GET['id']) || empty($_GET['id'])) {
    $response['error'] = 'ID курсу не вказано';
    echo json_encode($response);
    exit;
}

$courseId = intval($_GET['id']);

try {
    // Спочатку отримуємо категорію курсу
    $category_sql = "SELECT category_id FROM courses WHERE id = ?";
    $stmt = $conn->prepare($category_sql);
    $stmt->bind_param("i", $courseId);
    $stmt->execute();
    $category_result = $stmt->get_result();
    
    if ($category_result->num_rows > 0) {
        $category_row = $category_result->fetch_assoc();
        $category_id = $category_row['category_id'];
        
        // Запит для отримання схожих курсів з тієї ж категорії, крім поточного курсу
        $related_sql = "SELECT 
                            c.id, 
                            c.title, 
                            c.short_description as description, 
                            c.image_url as image, 
                            c.price, 
                            cat.name as category,
                            u.first_name, 
                            u.last_name,
                            CONCAT(u.first_name, ' ', u.last_name) as mentor_name,
                            IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as average_rating,
                            IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count
                        FROM 
                            courses c
                        LEFT JOIN 
                            users u ON c.mentor_id = u.id
                        LEFT JOIN
                            categories cat ON c.category_id = cat.id
                        WHERE 
                            c.category_id = ? AND c.id != ?
                        ORDER BY 
                            average_rating DESC, reviews_count DESC
                        LIMIT 4";
        
        $stmt = $conn->prepare($related_sql);
        $stmt->bind_param("ii", $category_id, $courseId);
        $stmt->execute();
        $related_result = $stmt->get_result();
        
        $related_courses = array();
        
        if ($related_result->num_rows > 0) {
            while ($row = $related_result->fetch_assoc()) {
                // Форматуємо дані викладача
                $mentorName = trim($row['first_name'] . ' ' . $row['last_name']);
                if (empty($mentorName)) {
                    $mentorName = "Невідомий автор";
                }
                
                // Перевіряємо наявність зображення
                $image = !empty($row['image']) ? $row['image'] : 'img/default-image-course.png';
                
                $related_courses[] = array(
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'description' => $row['description'],
                    'image' => $image,
                    'price' => floatval($row['price']),
                    'category' => $row['category'],
                    'mentor_name' => $mentorName,
                    'average_rating' => floatval($row['average_rating']),
                    'reviews_count' => intval($row['reviews_count'])
                );
            }
        }
        
        // Якщо недостатньо курсів з тієї ж категорії, додаємо популярні курси з інших категорій
        if (count($related_courses) < 4) {
            $remaining = 4 - count($related_courses);
            
            $popular_sql = "SELECT 
                                c.id, 
                                c.title, 
                                c.short_description as description, 
                                c.image_url as image, 
                                c.price, 
                                cat.name as category,
                                u.first_name, 
                                u.last_name,
                                CONCAT(u.first_name, ' ', u.last_name) as mentor_name,
                                IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as average_rating,
                                IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count
                            FROM 
                                courses c
                            LEFT JOIN 
                                users u ON c.mentor_id = u.id
                            LEFT JOIN
                                categories cat ON c.category_id = cat.id
                            WHERE 
                                c.id != ? AND (c.category_id != ? OR c.category_id IS NULL)
                            ORDER BY 
                                average_rating DESC, reviews_count DESC
                            LIMIT ?";
            
            $stmt = $conn->prepare($popular_sql);
            $stmt->bind_param("iii", $courseId, $category_id, $remaining);
            $stmt->execute();
            $popular_result = $stmt->get_result();
            
            if ($popular_result->num_rows > 0) {
                while ($row = $popular_result->fetch_assoc()) {
                    // Форматуємо дані викладача
                    $mentorName = trim($row['first_name'] . ' ' . $row['last_name']);
                    if (empty($mentorName)) {
                        $mentorName = "Невідомий автор";
                    }
                    
                    // Перевіряємо наявність зображення
                    $image = !empty($row['image']) ? $row['image'] : 'img/default-image-course.png';
                    
                    $related_courses[] = array(
                        'id' => $row['id'],
                        'title' => $row['title'],
                        'description' => $row['description'],
                        'image' => $image,
                        'price' => floatval($row['price']),
                        'category' => $row['category'],
                        'mentor_name' => $mentorName,
                        'average_rating' => floatval($row['average_rating']),
                        'reviews_count' => intval($row['reviews_count'])
                    );
                }
            }
        }
        
        $response = $related_courses;
        
    } else {
        $response['error'] = 'Курс не знайдено';
    }
} catch (Exception $e) {
    $response['error'] = 'Помилка: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 