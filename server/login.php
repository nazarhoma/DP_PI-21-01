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
    $login = isset($_POST['login']) ? $_POST['login'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    if (empty($login) || empty($password)) {
        $response['message'] = "Всі поля обов'язкові для заповнення";
        echo json_encode($response);
        exit;
    }
    $stmt = $conn->prepare("SELECT id, username, email, password, role FROM users WHERE email = ? OR username = ?");
    $stmt->bind_param("ss", $login, $login);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $username, $email, $hashed_password, $role);
        $stmt->fetch();

        // Перевірка пароля
        if (password_verify($password, $hashed_password)) {
            $response['message'] = "Авторизація успішна!";
            $response['user'] = array('id' => $id, 'username' => $username, 'email' => $email, 'role' => $role);
        } else {
            $response['message'] = "Невірний пароль";
        }
    } else {
        $response['message'] = "Користувача з таким email або логіном не знайдено";
    }

    echo json_encode($response);

    $stmt->close();
    $conn->close();
} else {
    $response['message'] = "Метод не дозволений";
    echo json_encode($response);
}
?>
