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

// Перевірка наявності обов'язкового параметра mentor_id
if (!isset($_GET['mentor_id']) || !is_numeric($_GET['mentor_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Не вказаний або некоректний ID ментора'
    ]);
    exit;
}

$mentorId = (int)$_GET['mentor_id'];

try {
    // Запит для отримання курсів ментора
    $sql = "SELECT 
                c.id, 
                c.title, 
                c.short_description, 
                c.image_url, 
                c.price, 
                c.created_at, 
                c.updated_at,
                COUNT(cs.id) AS sections_count,
                COUNT(DISTINCT ce.user_id) AS enrollments_count
            FROM 
                courses c
                LEFT JOIN course_sections cs ON c.id = cs.course_id
                LEFT JOIN course_enrollments ce ON c.id = ce.course_id
            WHERE 
                c.mentor_id = ?
            GROUP BY 
                c.id, c.title, c.short_description, c.image_url, c.price, c.created_at, c.updated_at
            ORDER BY 
                c.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $mentorId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $courses = [];
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Форматуємо дані курсу
            $courses[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'short_description' => $row['short_description'],
                'image_url' => $row['image_url'],
                'price' => (float)$row['price'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'sections_count' => (int)$row['sections_count'],
                'enrollments_count' => (int)$row['enrollments_count']
            ];
        }
    }
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'courses' => $courses
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