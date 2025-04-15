<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

include 'connect.php';

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = isset($_POST['email']) ? $_POST['email'] : '';
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $first_name = isset($_POST['first_name']) ? $_POST['first_name'] : '';
    $last_name = isset($_POST['last_name']) ? $_POST['last_name'] : '';

    if (empty($email) || empty($username) || empty($password) || empty($first_name) || empty($last_name)) {
        $response['message'] = "Всі поля обов'язкові для заповнення";
        echo json_encode($response);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $response['message'] = "Електронна пошта вже використовується";
        echo json_encode($response);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $response['message'] = "Логін вже використовується";
        echo json_encode($response);
        exit;
    }

    $hashed_password = password_hash($password, PASSWORD_BCRYPT);
    $role = 'student'; // Роль за замовчуванням

    // Вставка в базу даних, тепер з роллю
    $stmt = $conn->prepare("INSERT INTO users (email, username, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $email, $username, $hashed_password, $first_name, $last_name, $role);

    if ($stmt->execute()) {
        $response['message'] = "Користувач успішно зареєстрований";
    } else {
        $response['message'] = "Помилка сервера, спробуйте пізніше";
    }

    echo json_encode($response);

    $stmt->close();
    $conn->close();
} else {
    $response['message'] = "Метод не дозволений";
    echo json_encode($response);
}