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

// Перевіряємо, чи метод запиту GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволений'
    ]);
    exit;
}

try {
    // Перевіряємо наявність ID курсу
    if (!isset($_GET['course_id']) || empty($_GET['course_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID курсу не вказано'
        ]);
        exit;
    }
    
    $courseId = (int)$_GET['course_id'];
    
    // Отримуємо інформацію про курс
    $sql = "SELECT c.id, c.title, c.short_description, c.long_description, 
                   c.price, c.image_url, c.created_at, c.updated_at,
                   u.id as mentor_id, u.username as mentor_name, u.first_name, u.last_name,
                   u.avatar as mentor_avatar
            FROM courses c
            LEFT JOIN users u ON c.mentor_id = u.id
            WHERE c.id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $courseId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Курс не знайдено'
        ]);
        exit;
    }
    
    $course = $result->fetch_assoc();
    
    // Форматуємо ім'я ментора
    $mentorName = $course['first_name'] && $course['last_name'] 
                ? $course['first_name'] . ' ' . $course['last_name'] 
                : $course['mentor_name'];
    
    // Отримуємо додаткові статистичні дані
    $enrollmentsQuery = "SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = ?";
    $stmtEnrollments = $conn->prepare($enrollmentsQuery);
    $stmtEnrollments->bind_param("i", $courseId);
    $stmtEnrollments->execute();
    $enrollmentsResult = $stmtEnrollments->get_result();
    $enrollmentsCount = $enrollmentsResult->fetch_assoc()['count'];
    
    $reviewsQuery = "SELECT COUNT(*) as count FROM course_reviews WHERE course_id = ?";
    $stmtReviews = $conn->prepare($reviewsQuery);
    $stmtReviews->bind_param("i", $courseId);
    $stmtReviews->execute();
    $reviewsResult = $stmtReviews->get_result();
    $reviewsCount = $reviewsResult->fetch_assoc()['count'];
    
    // Формуємо результат
    $courseDetails = [
        'id' => $course['id'],
        'title' => $course['title'],
        'short_description' => $course['short_description'],
        'long_description' => $course['long_description'],
        'price' => $course['price'],
        'image_url' => $course['image_url'],
        'created_at' => $course['created_at'],
        'updated_at' => $course['updated_at'],
        'mentor' => [
            'id' => $course['mentor_id'],
            'name' => $mentorName,
            'avatar' => $course['mentor_avatar']
        ],
        'stats' => [
            'enrollments_count' => $enrollmentsCount,
            'reviews_count' => $reviewsCount,
            'completion_rate' => 0 // Можна обчислити, якщо є дані про завершення курсу
        ]
    ];
    
    echo json_encode([
        'success' => true,
        'course' => $courseDetails
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Помилка при отриманні деталей курсу: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 