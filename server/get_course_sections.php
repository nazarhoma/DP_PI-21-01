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

// Перевірка наявності обов'язкового параметра course_id
if (!isset($_GET['course_id']) || !is_numeric($_GET['course_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Не вказаний або некоректний ID курсу'
    ]);
    exit;
}

$courseId = (int)$_GET['course_id'];

try {
    // Запит для отримання секцій курсу
    $sql = "SELECT 
                cs.id, 
                cs.course_id,
                cs.title,
                cs.description,
                cs.order_num,
                cs.created_at,
                cs.updated_at,
                (SELECT COUNT(*) FROM section_resources sr WHERE sr.section_id = cs.id) AS resources_count
            FROM 
                course_sections cs
            WHERE 
                cs.course_id = ?
            ORDER BY 
                cs.order_num ASC, cs.id ASC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $courseId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $sections = [];
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Форматуємо дані секції
            $sections[] = [
                'id' => $row['id'],
                'course_id' => $row['course_id'],
                'title' => $row['title'],
                'description' => $row['description'],
                'order_num' => (int)$row['order_num'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'resources_count' => (int)$row['resources_count']
            ];
        }
    }
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'sections' => $sections
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