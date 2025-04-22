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
    // Запит для отримання детальної інформації про курс
    $sql = "SELECT 
                c.id, 
                c.title, 
                c.short_description,
                c.long_description, 
                c.image_url as image, 
                c.price, 
                c.duration_hours as duration, 
                dl.name as level, 
                l.name as language, 
                cat.name as category,
                (SELECT COUNT(*) FROM section_resources sr 
                 JOIN course_sections cs ON sr.section_id = cs.id 
                 WHERE cs.course_id = c.id) as lessons_count,
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
            LEFT JOIN
                difficulty_levels dl ON c.level_id = dl.id
            LEFT JOIN
                languages l ON c.language_id = l.id
            LEFT JOIN
                categories cat ON c.category_id = cat.id
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
        
        // Підраховуємо кількість ресурсів
        $sql_resources = "SELECT COUNT(*) as resources_count FROM section_resources sr
                          JOIN course_sections cs ON sr.section_id = cs.id
                          WHERE cs.course_id = ?";
        $stmt_resources = $conn->prepare($sql_resources);
        $stmt_resources->bind_param("i", $courseId);
        $stmt_resources->execute();
        $result_resources = $stmt_resources->get_result();
        $resourcesCount = 0;
        if ($result_resources->num_rows > 0) {
            $resourcesData = $result_resources->fetch_assoc();
            $resourcesCount = intval($resourcesData['resources_count']);
        }
        
        // Формуємо відповідь
        $response = array(
            'id' => $courseData['id'],
            'title' => $courseData['title'],
            'description' => $courseData['long_description'] ?: $courseData['short_description'],
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