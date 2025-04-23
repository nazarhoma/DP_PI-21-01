<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

// Виведення помилок
ini_set('display_errors', 1); 
ini_set('display_startup_errors', 1); 
error_reporting(E_ALL);

// Встановлюємо менш строгий SQL режим для групування
$conn->query("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

$response = array();
$courses = array();
$instructors = array();

// Перевіряємо, чи передано пошуковий запит
if (!isset($_GET['query']) || empty($_GET['query'])) {
    $response['success'] = false;
    $response['message'] = 'Пошуковий запит не вказано';
    echo json_encode($response);
    exit;
}

$searchQuery = '%' . $conn->real_escape_string($_GET['query']) . '%';
$searchType = isset($_GET['type']) ? $_GET['type'] : 'all'; // Можливі значення: all, courses, instructors

try {
    // Пошук курсів, якщо тип пошуку 'all' або 'courses'
    if ($searchType == 'all' || $searchType == 'courses') {
        $sql_courses = "SELECT 
                c.id, 
                c.title, 
                c.short_description AS description, 
                c.image_url AS image, 
                c.price, 
                c.duration_hours AS duration, 
                dl.name AS level,
                l.name AS language,
                cat.name AS category,
                u.first_name, 
                u.last_name,
                u.id as mentor_id,
                IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as avg_rating,
                IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count
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
                c.title LIKE ? OR
                c.short_description LIKE ? OR
                c.long_description LIKE ? OR
                cat.name LIKE ?
            ORDER BY 
                c.id ASC";

        $stmt_courses = $conn->prepare($sql_courses);
        $stmt_courses->bind_param("ssss", $searchQuery, $searchQuery, $searchQuery, $searchQuery);
        $stmt_courses->execute();
        $result_courses = $stmt_courses->get_result();

        if ($result_courses->num_rows > 0) {
            while ($row = $result_courses->fetch_assoc()) {
                // Форматуємо ім'я автора
                $author_name = trim($row['first_name'] . ' ' . $row['last_name']);
                if (empty($author_name)) {
                    $author_name = "Невідомий автор";
                }
                
                // Обчислюємо рейтинг
                $rating = $row['avg_rating'] > 0 ? $row['avg_rating'] : 0;
                
                // Форматуємо інформацію про курс
                $info = "{$row['level']} · {$row['language']}";
                
                // Перевіряємо наявність зображення
                $image = !empty($row['image']) ? $row['image'] : 'img/default-image-course.png';
                
                $courses[] = array(
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'author' => $author_name,
                    'mentor_id' => $row['mentor_id'],
                    'rating' => floatval($rating),
                    'reviews' => intval($row['reviews_count']),
                    'info' => $info,
                    'price' => floatval($row['price']),
                    'image' => $image,
                    'description' => $row['description'],
                    'category' => $row['category'],
                    'type' => 'course'
                );
            }
        }
    }
    
    // Пошук менторів, якщо тип пошуку 'all' або 'instructors'
    if ($searchType == 'all' || $searchType == 'instructors') {
        $sql_instructors = "SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                u.avatar,
                u.role,
                u.education,
                AVG(cr.rating) as avg_rating,
                COUNT(DISTINCT ce.user_id) as students_count,
                COUNT(DISTINCT c.id) as courses_count
            FROM 
                users u
            LEFT JOIN 
                courses c ON u.id = c.mentor_id
            LEFT JOIN 
                course_reviews cr ON c.id = cr.course_id
            LEFT JOIN
                course_enrollments ce ON c.id = ce.course_id
            WHERE 
                u.role = 'mentor' AND (
                u.first_name LIKE ? OR
                u.last_name LIKE ? OR
                u.username LIKE ? OR
                u.education LIKE ?)
            GROUP BY 
                u.id, u.first_name, u.last_name, u.username, u.avatar, u.role, u.education
            ORDER BY 
                avg_rating DESC, 
                students_count DESC";

        $stmt_instructors = $conn->prepare($sql_instructors);
        $stmt_instructors->bind_param("ssss", $searchQuery, $searchQuery, $searchQuery, $searchQuery);
        $stmt_instructors->execute();
        $result_instructors = $stmt_instructors->get_result();

        if ($result_instructors->num_rows > 0) {
            while ($row = $result_instructors->fetch_assoc()) {
                // Форматуємо дані для відповідності формату JSON, який очікує фронтенд
                $name = trim($row['first_name'] . ' ' . $row['last_name']);
                if (empty($name)) {
                    $name = $row['username'] ?: "Невідомий інструктор";
                }
                
                $image = !empty($row['avatar']) ? $row['avatar'] : 'img/default-avatar.png';
                $rating = $row['avg_rating'] > 0 ? $row['avg_rating'] : 4.5;
                $students = $row['students_count'] > 0 ? $row['students_count'] : 0;
                
                $instructors[] = array(
                    'id' => $row['id'],
                    'name' => $name,
                    'role' => "Інструктор",
                    'rating' => floatval($rating),
                    'students' => intval($students),
                    'courses_count' => intval($row['courses_count']),
                    'image' => $image,
                    'education' => $row['education'],
                    'type' => 'instructor'
                );
            }
        }
    }
    
    // Формуємо відповідь
    $response['success'] = true;
    $response['courses'] = $courses;
    $response['instructors'] = $instructors;
    $response['total_courses'] = count($courses);
    $response['total_instructors'] = count($instructors);
    $response['query'] = trim($_GET['query']);
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = "Помилка: " . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 