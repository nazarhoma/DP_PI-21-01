<?php
// Налаштування заголовків для CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Виведення помилок
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Підключення до бази даних
require_once 'connect.php';

// Встановлюємо менш строгий SQL режим для групування
$conn->query("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

// Перевіряємо метод запиту
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Отримуємо ID користувача
    $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;
    
    if (!$user_id) {
        die(json_encode([
            'success' => false,
            'message' => 'ID користувача не вказано'
        ]));
    }
    
    // Підготовлений запит для отримання курсів користувача
    $query = "
        SELECT 
            c.id, c.title, c.short_description as description, c.image_url as image, 
            c.price, c.duration_hours as duration, 
            dl.name as level, l.name as language, cat.name as category,
            u.username as author,
            CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as author_fullname,
            ce.progress_percentage as progress,
            ce.status,
            COALESCE(AVG(cr.rating), 0) as rating,
            COUNT(DISTINCT cr.id) as reviews
        FROM 
            courses c
        JOIN 
            course_enrollments ce ON c.id = ce.course_id
        LEFT JOIN 
            users u ON c.mentor_id = u.id
        LEFT JOIN 
            difficulty_levels dl ON c.level_id = dl.id
        LEFT JOIN
            languages l ON c.language_id = l.id
        LEFT JOIN
            categories cat ON c.category_id = cat.id
        LEFT JOIN 
            course_reviews cr ON c.id = cr.course_id
        WHERE 
            ce.user_id = ?
        GROUP BY 
            c.id, c.title, c.short_description, c.image_url, c.price, c.duration_hours,
            dl.name, l.name, cat.name,
            u.username, u.first_name, u.last_name, ce.progress_percentage, ce.status
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Отримуємо курси користувача
        $courses = [];
        while ($row = $result->fetch_assoc()) {
            // Перетворюємо числові значення рейтингу на цілі числа
            $row['rating'] = (int) $row['rating'];
            if ($row['rating'] === 0) $row['rating'] = 4; // Якщо рейтинг відсутній, встановлюємо за замовчуванням 4
            
            // Перевіряємо шлях до зображення та додаємо базовий URL, якщо потрібно
            if (!empty($row['image']) && !str_starts_with($row['image'], 'http')) {
                // Якщо шлях не починається з http, додаємо доменне ім'я
                $row['image'] = 'http://localhost/' . ltrim($row['image'], '/');
            } else if (empty($row['image'])) {
                // Якщо зображення відсутнє, встановлюємо зображення за замовчуванням
                $row['image'] = 'http://localhost/img/default-image-course.png';
            }
            
            // Перевіряємо і форматуємо повне ім'я автора
            if (empty(trim($row['author_fullname']))) {
                $row['author_fullname'] = $row['author'];
            }
            
            // Додаємо курс до масиву
            $courses[] = $row;
        }
        
        // Додаємо логування для діагностики
        error_log("Знайдено " . count($courses) . " курсів для користувача з ID: " . $user_id);
        
        // Відправляємо успішну відповідь
        echo json_encode([
            'success' => true,
            'courses' => $courses
        ]);
    } else {
        // Відправляємо повідомлення про відсутність курсів
        echo json_encode([
            'success' => false,
            'message' => 'Курси не знайдено для цього користувача',
            'courses' => []
        ]);
    }
    
    $stmt->close();
} else {
    // Якщо метод запиту не POST
    echo json_encode([
        'success' => false,
        'message' => 'Невірний метод запиту'
    ]);
}

// Закриваємо з'єднання
$conn->close();
?> 