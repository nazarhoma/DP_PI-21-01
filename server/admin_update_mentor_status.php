<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'connect.php';

// Перевіряємо, чи метод запиту POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволений'
    ]);
    exit;
}

try {
    // Перевіряємо наявність необхідних параметрів
    if (!isset($_POST['mentor_id']) || empty($_POST['mentor_id']) || 
        !isset($_POST['status']) || empty($_POST['status'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Не вказано ID ментора або статус'
        ]);
        exit;
    }
    
    $mentorId = (int)$_POST['mentor_id'];
    $status = $_POST['status']; // 'approved' або 'rejected'
    
    // Оновлюємо статус користувача
    if ($status === 'approved') {
        // Схвалюємо ментора - нічого не робимо, так як користувач вже має роль 'mentor'
        echo json_encode([
            'success' => true,
            'message' => 'Ментора успішно схвалено'
        ]);
    } else if ($status === 'rejected') {
        // Відхиляємо ментора - змінюємо роль на 'student'
        $sql = "UPDATE users SET role = 'student' WHERE id = ? AND role = 'mentor'";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $mentorId);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Ментора відхилено, роль змінено на студент'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Користувача не знайдено або він не є ментором'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Невірний статус. Допустимі значення: approved, rejected'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Помилка при оновленні статусу ментора: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 