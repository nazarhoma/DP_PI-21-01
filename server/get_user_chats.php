<?php
// Дозволяємо CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
require_once 'connect.php';

// Перехоплюємо помилки
function captureError($errno, $errstr, $errfile, $errline) {
    echo json_encode([
        'success' => false, 
        'error' => $errstr,
        'file' => $errfile,
        'line' => $errline
    ]);
    exit;
}
set_error_handler('captureError');

// Перевірка авторизації (через сесію або параметри запиту)
session_start();
$user_id = $_SESSION['user_id'] ?? null;

// Якщо немає сесії, перевіряємо параметри запиту
if (!$user_id) {
    $user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? null;
    
    if ($user_id) {
        // Зберігаємо в сесію для наступних запитів
        $_SESSION['user_id'] = $user_id;
    }
}

$user_role = $_POST['user_role'] ?? 'student';

// Якщо користувача не знайдено, повертаємо помилку
if (!$user_id) {
    echo json_encode([
        'success' => false,
        'message' => 'Користувача не знайдено'
    ]);
    exit;
}

try {
    $users = [];
    
    if ($user_role === 'admin') {
        // Для адміністратора показуємо всіх користувачів, з якими є чат
        $query = "SELECT DISTINCT 
                    u.id, u.first_name, u.last_name, u.avatar, u.role 
                  FROM 
                    users u
                  JOIN 
                    messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
                  WHERE 
                    (m.sender_id = ? OR m.receiver_id = ?) 
                    AND u.id != ?
                  ORDER BY 
                    u.first_name, u.last_name";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('iii', $user_id, $user_id, $user_id);
    }
    elseif ($user_role === 'mentor') {
        // Для ментора показуємо:
        // 1. Студентів, які написали йому
        // 2. Менторів курсів, які він купив
        // 3. Адміністратора, якщо писав йому
        $query = "SELECT DISTINCT 
                    u.id, u.first_name, u.last_name, u.avatar, u.role 
                  FROM 
                    users u 
                  LEFT JOIN 
                    messages m ON ((m.sender_id = u.id AND m.receiver_id = ?) OR (m.receiver_id = u.id AND m.sender_id = ?))
                  LEFT JOIN 
                    courses c ON c.mentor_id = u.id 
                  LEFT JOIN 
                    course_enrollments ce ON ce.course_id = c.id AND ce.user_id = ?
                  WHERE 
                    ((u.role = 'student' AND m.id IS NOT NULL) OR (ce.id IS NOT NULL) OR (u.role = 'admin' AND m.id IS NOT NULL))
                    AND u.id != ?
                  ORDER BY 
                    u.first_name, u.last_name";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('iiii', $user_id, $user_id, $user_id, $user_id);
    }
    else {
        // Для звичайного користувача показуємо менторів курсів, які він купив, а також адміністратора, якщо є повідомлення
        $query = "SELECT DISTINCT 
                    u.id, u.first_name, u.last_name, u.avatar, u.role 
                  FROM 
                    users u 
                  LEFT JOIN 
                    messages m ON ((m.sender_id = u.id AND m.receiver_id = ?) OR (m.receiver_id = u.id AND m.sender_id = ?))
                  LEFT JOIN 
                    courses c ON c.mentor_id = u.id 
                  LEFT JOIN 
                    course_enrollments ce ON ce.course_id = c.id AND ce.user_id = ?
                  WHERE 
                    ((u.role IN ('mentor') AND ce.id IS NOT NULL) OR (u.role = 'admin' AND m.id IS NOT NULL))
                    AND u.id != ?
                  ORDER BY 
                    u.first_name, u.last_name";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('iiii', $user_id, $user_id, $user_id, $user_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    // Додаємо окремий запит для адміністратора, якщо відсутній у результатах
    if (!$user_role == 'admin') {
        $adminExists = false;
        foreach ($users as $user) {
            if ($user['role'] === 'admin') {
                $adminExists = true;
                break;
            }
        }
        
        if (!$adminExists) {
            // Перевіряємо, чи є повідомлення з адміністратором
            $adminQuery = "SELECT DISTINCT 
                            u.id, u.first_name, u.last_name, u.avatar, u.role 
                           FROM 
                            users u 
                           JOIN 
                            messages m ON ((m.sender_id = u.id AND m.receiver_id = ?) OR (m.receiver_id = u.id AND m.sender_id = ?))
                           WHERE 
                            u.role = 'admin'
                           LIMIT 1";
            
            $adminStmt = $conn->prepare($adminQuery);
            $adminStmt->bind_param('ii', $user_id, $user_id);
            $adminStmt->execute();
            $adminResult = $adminStmt->get_result();
            
            if ($adminResult->num_rows > 0) {
                $users[] = $adminResult->fetch_assoc();
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
} 