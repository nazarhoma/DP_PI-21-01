<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
require_once 'connect.php';

// Логування для відлагодження
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
    
    // Отримуємо ID курсу
    if (!isset($_POST['course_id'])) {
        throw new Exception("Не вказано ID курсу");
    }
    
    $course_id = intval($_POST['course_id']);
    
    $debug_info['user_id'] = $user_id;
    $debug_info['course_id'] = $course_id;
    
    // Спочатку підрахуємо загальну кількість ресурсів у курсі
    $total_resources_sql = "
        SELECT COUNT(*) as total 
        FROM section_resources sr
        JOIN course_sections cs ON sr.section_id = cs.id
        WHERE cs.course_id = ?
    ";
    
    $stmt = $conn->prepare($total_resources_sql);
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту загальної кількості: " . $conn->error);
    }
    
    $stmt->bind_param('i', $course_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $total_resources = $result->fetch_assoc()['total'];
    
    $debug_info['total_resources'] = $total_resources;
    
    // Якщо у курсі немає ресурсів, прогрес дорівнює 0
    if ($total_resources == 0) {
        echo json_encode([
            'success' => true,
            'progress' => 0,
            'completed_resources' => [],
            'debug' => $debug_info
        ]);
        exit;
    }
    
    // Отримуємо список завершених ресурсів
    $completed_resources_list_sql = "
        SELECT sr.id
        FROM user_progress up
        JOIN section_resources sr ON up.resource_id = sr.id
        JOIN course_sections cs ON sr.section_id = cs.id
        WHERE up.user_id = ? AND cs.course_id = ? AND up.completed = 1
    ";
    
    $stmt = $conn->prepare($completed_resources_list_sql);
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту списку виконаних ресурсів: " . $conn->error);
    }
    
    $stmt->bind_param('ii', $user_id, $course_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $completed_resources_ids = [];
    while ($row = $result->fetch_assoc()) {
        $completed_resources_ids[] = intval($row['id']);
    }
    
    $completed_resources_count = count($completed_resources_ids);
    $debug_info['completed_resources_count'] = $completed_resources_count;
    
    // Розраховуємо відсоток виконання
    $progress_percentage = ($completed_resources_count / $total_resources) * 100;
    $progress_percentage = round($progress_percentage); // Округлюємо до цілого числа
    
    echo json_encode([
        'success' => true,
        'progress' => $progress_percentage,
        'completed' => $completed_resources_count,
        'total' => $total_resources,
        'completed_resources' => $completed_resources_ids,
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