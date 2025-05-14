<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
require_once 'connect.php';

// Для відлагодження
$debug_info = [];

try {
    // Отримуємо ID користувача
    session_start();
    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    // Якщо нема в сесії, перевіряємо в POST
    if (!$user_id && isset($_POST['user_id'])) {
        $user_id = intval($_POST['user_id']);
    }
    
    if (!$user_id) {
        throw new Exception("Не вдалося отримати ID користувача");
    }
    
    // Отримуємо ID ресурсу
    if (!isset($_POST['resource_id'])) {
        throw new Exception("Не вказано ID ресурсу");
    }
    
    $resource_id = intval($_POST['resource_id']);
    $course_id = isset($_POST['course_id']) ? intval($_POST['course_id']) : 0;
    
    $debug_info['user_id'] = $user_id;
    $debug_info['resource_id'] = $resource_id;
    $debug_info['course_id'] = $course_id;
    
    // Перевіряємо, чи існує запис про прогрес для цього користувача й ресурсу
    $check_sql = "SELECT id FROM user_progress WHERE user_id = ? AND resource_id = ?";
    
    $stmt = $conn->prepare($check_sql);
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту перевірки: " . $conn->error);
    }
    
    $stmt->bind_param('ii', $user_id, $resource_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Запис існує, оновлюємо його щоб зняти позначку "виконано"
        $update_sql = "UPDATE user_progress SET completed = 0 WHERE user_id = ? AND resource_id = ?";
        
        $stmt = $conn->prepare($update_sql);
        if (!$stmt) {
            throw new Exception("Помилка підготовки запиту оновлення: " . $conn->error);
        }
        
        $stmt->bind_param('ii', $user_id, $resource_id);
        $stmt->execute();
        
        $debug_info['action'] = 'update';
        $debug_info['affected_rows'] = $stmt->affected_rows;
    } else {
        // Записа немає, нічого не робимо
        $debug_info['action'] = 'no_record';
    }
    
    // Отримуємо загальний прогрес по курсу, якщо вказаний ID курсу
    $progress = 0;
    
    if ($course_id > 0) {
        // Підрахуємо загальну кількість ресурсів у курсі
        $total_sql = "
            SELECT COUNT(*) as total 
            FROM section_resources sr
            JOIN course_sections cs ON sr.section_id = cs.id
            WHERE cs.course_id = ?
        ";
        
        $stmt = $conn->prepare($total_sql);
        $stmt->bind_param('i', $course_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $total_resources = $result->fetch_assoc()['total'];
        
        $debug_info['total_resources'] = $total_resources;
        
        if ($total_resources > 0) {
            // Підрахуємо кількість виконаних ресурсів
            $completed_sql = "
                SELECT COUNT(*) as completed 
                FROM user_progress up
                JOIN section_resources sr ON up.resource_id = sr.id
                JOIN course_sections cs ON sr.section_id = cs.id
                WHERE up.user_id = ? AND cs.course_id = ? AND up.completed = 1
            ";
            
            $stmt = $conn->prepare($completed_sql);
            $stmt->bind_param('ii', $user_id, $course_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $completed_resources = $result->fetch_assoc()['completed'];
            
            $debug_info['completed_resources'] = $completed_resources;
            
            // Розраховуємо відсоток виконання
            $progress = round(($completed_resources / $total_resources) * 100);
            
            // Оновлюємо прогрес у таблиці course_enrollments
            $update_enrollment_sql = "
                UPDATE course_enrollments 
                SET progress_percentage = ?, 
                    status = CASE 
                        WHEN ? < 100 AND status = 'completed' THEN 'active'
                        ELSE status 
                    END
                WHERE user_id = ? AND course_id = ?
            ";
            
            $stmt = $conn->prepare($update_enrollment_sql);
            $stmt->bind_param('iiii', $progress, $progress, $user_id, $course_id);
            $stmt->execute();
            
            $debug_info['enrollment_update'] = $stmt->affected_rows;
        }
    }
    
    echo json_encode([
        'success' => true,
        'progress' => $progress,
        'debug' => $debug_info
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => $debug_info
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
} 