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

try {
    // Отримуємо нових менторів, які ще не мають курсів
    $sql = "SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                   u.avatar, u.gender, u.education, u.native_language, 
                   u.created_at, COUNT(c.id) as courses_count
            FROM users u
            LEFT JOIN courses c ON u.id = c.mentor_id
            WHERE u.role = 'mentor'
            GROUP BY u.id
            HAVING courses_count = 0
            ORDER BY u.created_at DESC";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $mentors = array();
        
        while ($row = $result->fetch_assoc()) {
            // Форматуємо ім'я користувача
            $name = $row['first_name'] && $row['last_name'] 
                  ? $row['first_name'] . ' ' . $row['last_name'] 
                  : $row['username'];
            
            $mentors[] = array(
                'id' => $row['id'],
                'name' => $name,
                'email' => $row['email'],
                'specialization' => '',  // Можна додати, якщо таке поле буде в БД
                'experience' => '',      // Можна додати, якщо таке поле буде в БД
                'description' => '',     // Можна додати, якщо таке поле буде в БД
                'avatar' => $row['avatar'],
                'gender' => $row['gender'],
                'education' => $row['education'],
                'native_language' => $row['native_language'],
                'created_at' => $row['created_at']
            );
        }
        
        echo json_encode(array(
            'success' => true,
            'mentors' => $mentors
        ));
    } else {
        echo json_encode(array(
            'success' => false,
            'message' => 'Помилка запиту до бази даних: ' . $conn->error
        ));
    }
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Помилка: ' . $e->getMessage()
    ));
}

$conn->close();
?> 