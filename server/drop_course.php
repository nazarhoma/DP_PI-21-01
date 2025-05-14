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
    
    // Отримуємо ID курсу
    if (!isset($_POST['course_id'])) {
        throw new Exception("Не вказано ID курсу");
    }
    
    $course_id = intval($_POST['course_id']);
    
    // Отримуємо статус курсу, який потрібно встановити (за замовчуванням "dropped")
    $new_status = isset($_POST['status']) ? $_POST['status'] : 'dropped';
    
    $debug_info['user_id'] = $user_id;
    $debug_info['course_id'] = $course_id;
    $debug_info['new_status'] = $new_status;
    
    // Перевіряємо, чи існує запис про зарахування на курс
    $check_sql = "SELECT id, status FROM course_enrollments WHERE user_id = ? AND course_id = ?";
    
    $stmt = $conn->prepare($check_sql);
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту перевірки: " . $conn->error);
    }
    
    $stmt->bind_param('ii', $user_id, $course_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Зарахування на курс не знайдено");
    }
    
    $enrollment = $result->fetch_assoc();
    $debug_info['current_status'] = $enrollment['status'];
    
    // Формуємо SQL-запит в залежності від статусу
    $update_sql = "UPDATE course_enrollments SET status = ?";
    
    // Додаємо timestamp поля при необхідності
    if ($new_status === 'completed') {
        $update_sql .= ", completed_at = NOW()";
    }
    
    $update_sql .= " WHERE user_id = ? AND course_id = ?";
    
    $stmt = $conn->prepare($update_sql);
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту оновлення: " . $conn->error);
    }
    
    $stmt->bind_param('sii', $new_status, $user_id, $course_id);
    $stmt->execute();
    
    $debug_info['affected_rows'] = $stmt->affected_rows;
    
    if ($stmt->affected_rows === 0) {
        throw new Exception("Не вдалося змінити статус курсу");
    }
    
    // Формуємо повідомлення в залежності від статусу
    $message = '';
    if ($new_status === 'dropped') {
        $message = 'Ви успішно покинули курс';
    } elseif ($new_status === 'active') {
        $message = 'Ви успішно відновили курс';
    } else {
        $message = 'Статус курсу успішно змінено';
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message,
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