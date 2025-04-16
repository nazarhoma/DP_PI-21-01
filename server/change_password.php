<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

include 'connect.php';

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : '';
    $current_password = isset($_POST['current_password']) ? $_POST['current_password'] : '';
    $new_password = isset($_POST['new_password']) ? $_POST['new_password'] : '';

    if (empty($user_id) || empty($current_password) || empty($new_password)) {
        $response['success'] = false;
        $response['message'] = "Всі поля обов'язкові для заповнення";
        echo json_encode($response);
        exit;
    }

    // Перевіряємо поточний пароль
    $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $response['success'] = false;
        $response['message'] = "Користувача не знайдено";
        echo json_encode($response);
        exit;
    }

    $user = $result->fetch_assoc();
    if (!password_verify($current_password, $user['password'])) {
        $response['success'] = false;
        $response['message'] = "Поточний пароль невірний";
        echo json_encode($response);
        exit;
    }

    // Хешуємо і оновлюємо пароль
    $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
    $update_stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $update_stmt->bind_param("si", $hashed_password, $user_id);

    if ($update_stmt->execute()) {
        $response['success'] = true;
        $response['message'] = "Пароль успішно змінено";
    } else {
        $response['success'] = false;
        $response['message'] = "Помилка при оновленні паролю: " . $conn->error;
    }

    $update_stmt->close();
    echo json_encode($response);

    $stmt->close();
    $conn->close();
} else {
    $response['success'] = false;
    $response['message'] = "Метод не дозволений";
    echo json_encode($response);
}
?> 