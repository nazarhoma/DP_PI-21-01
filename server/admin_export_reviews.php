<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="reviews.csv"');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'connect.php';

try {
    // Отримуємо всі відгуки з інформацією про користувачів та курси
    $sql = "SELECT cr.id, cr.rating, cr.review_text as text, cr.created_at,
                   c.title as course_title, 
                   u.username as user_name, CONCAT(u.first_name, ' ', u.last_name) as full_name
            FROM course_reviews cr
            JOIN courses c ON cr.course_id = c.id
            JOIN users u ON cr.user_id = u.id
            ORDER BY cr.created_at DESC";
    
    $result = $conn->query($sql);
    
    if ($result) {
        // Відкриваємо потік для виводу CSV-файлу
        $output = fopen('php://output', 'w');
        
        // Додаємо BOM (Byte Order Mark) для коректного відображення UTF-8
        fputs($output, "\xEF\xBB\xBF");
        
        // Додаємо заголовки колонок
        fputcsv($output, array('ID', 'Користувач', 'Назва курсу', 'Рейтинг', 'Відгук', 'Дата'));
        
        // Додаємо дані рядок за рядком
        while ($row = $result->fetch_assoc()) {
            // Використовуємо повне ім'я користувача, якщо воно є
            $userName = !empty(trim($row['full_name'])) ? $row['full_name'] : $row['user_name'];
            
            fputcsv($output, array(
                $row['id'],
                $userName,
                $row['course_title'],
                $row['rating'],
                $row['text'],
                date('d.m.Y H:i', strtotime($row['created_at']))
            ));
        }
        
        // Закриваємо потік виводу
        fclose($output);
    } else {
        header('Content-Type: application/json');
        echo json_encode(array(
            'success' => false,
            'message' => 'Помилка запиту до бази даних: ' . $conn->error
        ));
    }
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(array(
        'success' => false,
        'message' => 'Помилка: ' . $e->getMessage()
    ));
}

$conn->close();
?> 