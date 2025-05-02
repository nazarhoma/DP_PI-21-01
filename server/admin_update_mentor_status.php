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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволений'
    ]);
    exit;
}

try {
    if (!isset($_POST['mentor_id']) || empty($_POST['mentor_id']) || 
        !isset($_POST['status']) || empty($_POST['status'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Не вказано ID заявки або статус'
        ]);
        exit;
    }
    
    $applicationId = (int)$_POST['mentor_id'];
    $status = $_POST['status']; // 'approved' або 'rejected'
    
    if (!in_array($status, ['approved', 'rejected'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Невірний статус. Допустимі значення: approved, rejected'
        ]);
        exit;
    }

    // Отримуємо заявку та user_id
    $stmt = $conn->prepare('SELECT user_id FROM mentor_applications WHERE id = ?');
    $stmt->bind_param('i', $applicationId);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Заявку не знайдено'
        ]);
        $stmt->close();
        exit;
    }
    $stmt->bind_result($user_id);
    $stmt->fetch();
    $stmt->close();

    if ($status === 'approved') {
        // Оновлюємо статус заявки
        $stmt = $conn->prepare('UPDATE mentor_applications SET mentor_status = "accepted" WHERE id = ?');
        $stmt->bind_param('i', $applicationId);
        $stmt->execute();
        $stmt->close();
        // Оновлюємо роль користувача
        $stmt = $conn->prepare('UPDATE users SET role = "mentor" WHERE id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $stmt->close();
        echo json_encode([
            'success' => true,
            'message' => 'Ментора успішно прийнято'
        ]);
    } else if ($status === 'rejected') {
        // Оновлюємо статус заявки
        $stmt = $conn->prepare('UPDATE mentor_applications SET mentor_status = "rejected" WHERE id = ?');
        $stmt->bind_param('i', $applicationId);
        $stmt->execute();
        $stmt->close();
        echo json_encode([
            'success' => true,
            'message' => 'Заявку ментора відхилено'
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