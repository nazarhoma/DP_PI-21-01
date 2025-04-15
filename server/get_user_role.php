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
    
    // Отримуємо актуальну роль користувача з БД
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->bind_result($role);
    
    if ($stmt->fetch()) {
        $response['success'] = true;
        $response['role'] = $role;
    } else {
        $response['success'] = false;
        $response['message'] = "Користувача не знайдено";
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