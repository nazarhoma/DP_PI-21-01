<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

$response = array();

// Перевіряємо, чи передано ID курсу
if (!isset($_GET['id']) || empty($_GET['id'])) {
    $response['error'] = 'ID курсу не вказано';
    echo json_encode($response);
    exit;
}

$courseId = intval($_GET['id']);

try {
    // Запит для отримання детальної інформації про курс
    $sql = "SELECT 
                c.id, 
                c.title, 
                c.description, 
                c.image, 
                c.price, 
                c.duration, 
                c.level, 
                c.language, 
                c.category,
                (SELECT COUNT(*) FROM course_lessons cl JOIN course_sections cs ON cl.section_id = cs.id WHERE cs.course_id = c.id) as lessons_count,
                c.resources_files,
                c.mentor_id,
                u.first_name, 
                u.last_name,
                IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as average_rating,
                IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count,
                IFNULL((SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id), 0) as students_count
            FROM 
                courses c
            LEFT JOIN 
                users u ON c.mentor_id = u.id
            WHERE 
                c.id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $courseId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $courseData = $result->fetch_assoc();
        
        // Форматуємо дані для відповіді
        $authorName = trim($courseData['first_name'] . ' ' . $courseData['last_name']);
        if (empty($authorName)) {
            $authorName = "Невідомий автор";
        }
        
        // Перевіряємо наявність зображення
        $image = !empty($courseData['image']) ? $courseData['image'] : 'img/default-image-course.png';
        
        // Підраховуємо кількість ресурсів із JSON-поля resources_files
        $resourcesCount = 0;
        if (!empty($courseData['resources_files'])) {
            $resources = json_decode($courseData['resources_files'], true);
            if (is_array($resources)) {
                $resourcesCount = count($resources);
            }
        }
        
        // Формуємо відповідь
        $response = array(
            'id' => $courseData['id'],
            'title' => $courseData['title'],
            'description' => $courseData['description'],
            'image' => $image,
            'price' => floatval($courseData['price']),
            'duration' => $courseData['duration'],
            'level' => $courseData['level'],
            'language' => $courseData['language'],
            'category' => $courseData['category'],
            'mentor_id' => $courseData['mentor_id'],
            'mentor_name' => $authorName,
            'average_rating' => floatval($courseData['average_rating']),
            'reviews_count' => intval($courseData['reviews_count']),
            'students_count' => intval($courseData['students_count']),
            'lessons_count' => intval($courseData['lessons_count']),
            'resources_count' => $resourcesCount
        );
    } else {
        $response['error'] = 'Курс не знайдено';
    }
} catch (Exception $e) {
    $response['error'] = 'Помилка: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 