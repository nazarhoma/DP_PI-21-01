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
    // Перевіряємо наявність необхідних параметрів
    if (!isset($_GET['tab']) || empty($_GET['tab']) || 
        !isset($_GET['course_id']) || empty($_GET['course_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Не вказано необхідні параметри'
        ]);
        exit;
    }
    
    $tab = $_GET['tab'];
    $courseId = (int)$_GET['course_id'];
    
    // Функція для отримання даних залежно від вкладки
    $data = [];
    
    switch ($tab) {
        case 'commission':
            // Отримуємо дані про комісію курсу (порожньо, бо не маємо такої таблиці)
            $data = [
                'percent' => 20,
                'amount' => 0
            ];
            break;
            
        case 'course-reviews':
            // Отримуємо відгуки курсу
            $sql = "SELECT cr.id, cr.rating, cr.review_text, cr.created_at,
                           u.username, u.first_name, u.last_name, u.avatar
                    FROM course_reviews cr
                    JOIN users u ON cr.user_id = u.id
                    WHERE cr.course_id = ?
                    ORDER BY cr.created_at DESC";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $courseId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $userName = !empty(trim($row['first_name'])) && !empty(trim($row['last_name'])) 
                          ? $row['first_name'] . ' ' . $row['last_name']
                          : $row['username'];
                
                $data[] = [
                    'id' => $row['id'],
                    'rating' => $row['rating'],
                    'text' => $row['review_text'],
                    'date' => date('d.m.Y', strtotime($row['created_at'])),
                    'user_name' => $userName,
                    'user_avatar' => $row['avatar']
                ];
            }
            break;
            
        case 'customers':
            // Отримуємо користувачів, які купили курс з course_enrollments
            $sql = "SELECT ce.id as enrollment_id, ce.enrolled_at, u.id as user_id, u.username, u.email, u.first_name, u.last_name, c.price
                    FROM course_enrollments ce
                    JOIN users u ON ce.user_id = u.id
                    JOIN courses c ON ce.course_id = c.id
                    WHERE ce.course_id = ?
                    ORDER BY ce.enrolled_at DESC";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $courseId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $userName = !empty(trim($row['first_name'])) && !empty(trim($row['last_name'])) 
                          ? $row['first_name'] . ' ' . $row['last_name']
                          : $row['username'];
                $data[] = [
                    'id' => $row['user_id'],
                    'name' => $userName,
                    'username' => $row['username'],
                    'email' => $row['email'],
                    'type' => 'Купив',
                    'country' => '', // Якщо є поле country, підставити тут
                    'joined_date' => date('d.m.Y', strtotime($row['enrolled_at'])),
                    'total_amount' => $row['price'],
                    'order_number' => $row['enrollment_id']
                ];
            }
            break;
            
        case 'chapters':
            // Отримуємо розділи курсу
            $sql = "SELECT cs.id, cs.title, cs.description, cs.order_num,
                          (SELECT COUNT(*) FROM section_resources WHERE section_id = cs.id) as resources_count
                   FROM course_sections cs
                   WHERE cs.course_id = ?
                   ORDER BY cs.order_num";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $courseId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = [
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'description' => $row['description'],
                    'order' => $row['order_num'],
                    'resources_count' => $row['resources_count']
                ];
            }
            break;
            
        case 'promotion':
            // Отримуємо дані про промо (поки порожньо)
            $data = [];
            break;
            
        case 'detail':
            // Отримуємо деталі курсу
            $sql = "SELECT c.id, c.title, c.short_description, c.long_description, 
                          c.price, c.duration_hours, c.image_url, c.created_at
                   FROM courses c
                   WHERE c.id = ?";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $courseId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $data = $result->fetch_assoc();
            }
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Невідома вкладка'
            ]);
            exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Помилка при отриманні даних вкладки: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 