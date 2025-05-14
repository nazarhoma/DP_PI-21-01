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

// Перевіряємо наявність користувача
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Не авторизовано']);
    exit;
}

try {
    // Отримуємо роль користувача
    $stmt = $conn->prepare('SELECT role FROM users WHERE id = ?');
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту: " . $conn->error);
    }
    
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if (!$res->num_rows) {
        echo json_encode(['success' => false, 'message' => 'Користувача не знайдено']);
        exit;
    }
    
    $role = $res->fetch_assoc()['role'];
    $debug_info = ['user_id' => $user_id, 'role' => $role];

    $chats = [];
    if ($role === 'student') {
        // Студент: отримуємо менторів, у яких він купив курси
        $sql = "SELECT DISTINCT u.id, u.first_name, u.last_name, u.username, u.avatar
                FROM course_enrollments ce
                JOIN courses c ON ce.course_id = c.id
                JOIN users u ON c.mentor_id = u.id
                WHERE ce.user_id = ? AND u.id IS NOT NULL AND u.id != ?";
        
        $debug_info['sql_student'] = $sql;
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Помилка підготовки запиту для студента: " . $conn->error);
        }
        
        $stmt->bind_param('ii', $user_id, $user_id);
        $success = $stmt->execute();
        if (!$success) {
            throw new Exception("Помилка виконання запиту для студента: " . $stmt->error);
        }
        
        $res = $stmt->get_result();
        $debug_info['mentors_count'] = $res->num_rows;
        
        while ($row = $res->fetch_assoc()) {
            $row['name'] = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')) ?: $row['username'];
            $row['avatar_url'] = $row['avatar'] ?: 'img/avatars/default-avatar.png';
            $chats[] = $row;
        }
    } else if ($role === 'mentor') {
        // Перевіряємо, чи є курси у ментора
        $checkMentorCourses = $conn->prepare("SELECT COUNT(*) as count FROM courses WHERE mentor_id = ?");
        if (!$checkMentorCourses) {
            throw new Exception("Помилка підготовки запиту перевірки курсів: " . $conn->error);
        }
        
        $checkMentorCourses->bind_param('i', $user_id);
        $checkMentorCourses->execute();
        $courseCount = $checkMentorCourses->get_result()->fetch_assoc()['count'];
        
        $debug_info['courses_count'] = $courseCount;
        
        if ($courseCount == 0) {
            // Немає курсів, повертаємо порожній список
            echo json_encode(['success' => true, 'users' => [], 'debug' => $debug_info]);
            exit;
        }
        
        // Ментор: отримує студентів, які купили його курси
        $sql = "SELECT DISTINCT u.id, u.first_name, u.last_name, u.username, u.avatar
                FROM users u
                JOIN course_enrollments ce ON u.id = ce.user_id
                JOIN courses c ON ce.course_id = c.id
                WHERE c.mentor_id = ? AND u.id != ?";
                
        $debug_info['sql_mentor'] = $sql;
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Помилка підготовки запиту для ментора: " . $conn->error);
        }
        
        $stmt->bind_param('ii', $user_id, $user_id);
        $success = $stmt->execute();
        if (!$success) {
            throw new Exception("Помилка виконання запиту для ментора: " . $stmt->error);
        }
        
        $res = $stmt->get_result();
        $debug_info['students_count'] = $res->num_rows;
        
        while ($row = $res->fetch_assoc()) {
            $row['name'] = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')) ?: $row['username'];
            $row['avatar_url'] = $row['avatar'] ?: 'img/avatars/default-avatar.png';
            $chats[] = $row;
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Недостатньо прав']);
        exit;
    }

    $debug_info['chats_count'] = count($chats);
    echo json_encode(['success' => true, 'users' => $chats, 'debug' => $debug_info]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Помилка сервера: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
} 