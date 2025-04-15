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

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : '';
    
    if (empty($user_id)) {
        $response['success'] = false;
        $response['message'] = "ID користувача не вказаний";
        echo json_encode($response);
        exit;
    }
    
    // Оновлюємо роль користувача на "mentor"
    $stmt = $conn->prepare("UPDATE users SET role = 'mentor' WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = "Роль користувача успішно оновлена до ментора";
    } else {
        $response['success'] = false;
        $response['message'] = "Помилка при оновленні ролі: " . $conn->error;
    }
    
    echo json_encode($response);
    
    $stmt->close();
    $conn->close();
} else {
    $response['success'] = false;
    $response['message'] = "Метод не дозволений";
    echo json_encode($response);
}
?> 