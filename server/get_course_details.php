<?php
// Налаштування заголовків CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Перевіряємо, чи запит має метод OPTIONS (preflight запит)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Підключення до бази даних
include 'connect.php';

// Перевірка методу запиту
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволено. Використовуйте GET.'
    ]);
    exit;
}

// Перевірка наявності обов'язкового параметра id
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Не вказаний або некоректний ID курсу'
    ]);
    exit;
}

$courseId = (int)$_GET['id'];

try {
    // Запит для отримання деталей курсу
    $sql = "SELECT 
                c.id, 
                c.mentor_id,
                c.category_id,
                c.language_id,
                c.level_id,
                c.title, 
                c.short_description, 
                c.long_description,
                c.image_url, 
                c.price, 
                c.duration_hours,
                c.created_at, 
                c.updated_at
            FROM 
                courses c
            WHERE 
                c.id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $courseId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Курс не знайдено'
        ]);
        exit;
    }
    
    $course = $result->fetch_assoc();
    
    // Отримання додаткової статистики по курсу
    $enrollmentsCountSql = "SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = ?";
    $enrollmentsStmt = $conn->prepare($enrollmentsCountSql);
    $enrollmentsStmt->bind_param('i', $courseId);
    $enrollmentsStmt->execute();
    $enrollmentsResult = $enrollmentsStmt->get_result();
    $enrollmentsCount = $enrollmentsResult->fetch_assoc()['count'];
    
    $reviewsCountSql = "SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM course_reviews WHERE course_id = ?";
    $reviewsStmt = $conn->prepare($reviewsCountSql);
    $reviewsStmt->bind_param('i', $courseId);
    $reviewsStmt->execute();
    $reviewsResult = $reviewsStmt->get_result();
    $reviewsData = $reviewsResult->fetch_assoc();
    
    // Форматуємо дані курсу з додатковою інформацією
    $courseData = [
        'id' => $course['id'],
        'mentor_id' => $course['mentor_id'],
        'category_id' => $course['category_id'],
        'language_id' => $course['language_id'],
        'level_id' => $course['level_id'],
        'title' => $course['title'],
        'short_description' => $course['short_description'],
        'long_description' => $course['long_description'],
        'image_url' => $course['image_url'],
        'price' => (float)$course['price'],
        'duration_hours' => (int)$course['duration_hours'],
        'created_at' => $course['created_at'],
        'updated_at' => $course['updated_at'],
        'statistics' => [
            'enrollments_count' => (int)$enrollmentsCount,
            'reviews_count' => (int)$reviewsData['count'],
            'average_rating' => $reviewsData['avg_rating'] ? (float)$reviewsData['avg_rating'] : 0
        ]
    ];
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'course' => $courseData
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Помилка сервера: ' . $e->getMessage()
    ]);
}

// Закриваємо з'єднання
$conn->close();
?> 