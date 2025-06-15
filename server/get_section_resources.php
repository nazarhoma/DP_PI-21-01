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

// Перевірка наявності обов'язкового параметра section_id
if (!isset($_GET['section_id']) || !is_numeric($_GET['section_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Не вказаний або некоректний ID секції'
    ]);
    exit;
}

$sectionId = (int)$_GET['section_id'];

try {
    // Запит для отримання ресурсів секції
    $sql = "SELECT 
                sr.id, 
                sr.section_id,
                sr.title,
                sr.resource_type,
                sr.resource_url,
                sr.content,
                sr.duration_minutes,
                sr.order_num,
                sr.created_at,
                sr.updated_at
            FROM 
                section_resources sr
            WHERE 
                sr.section_id = ?
            ORDER BY 
                sr.order_num ASC, sr.id ASC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $sectionId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $resources = [];
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Форматуємо дані ресурсу
            $resources[] = [
                'id' => $row['id'],
                'section_id' => $row['section_id'],
                'title' => $row['title'],
                'resource_type' => $row['resource_type'],
                'resource_url' => $row['resource_url'],
                'content' => $row['content'],
                'duration_minutes' => $row['duration_minutes'] ? (int)$row['duration_minutes'] : null,
                'order_num' => (int)$row['order_num'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ];
        }
    }
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'resources' => $resources
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