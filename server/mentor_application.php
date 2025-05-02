<?php
header('Content-Type: application/json');
include 'connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Метод не дозволений']);
    exit;
}

$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$organization = isset($_POST['organization']) ? trim($_POST['organization']) : '';
$mentor_description = isset($_POST['mentor_description']) ? trim($_POST['mentor_description']) : '';

if (!$user_id || !$phone || !$organization || !$mentor_description) {
    echo json_encode(['success' => false, 'message' => 'Всі поля обовʼязкові']);
    exit;
}

// Перевірка наявності вже існуючої заявки зі статусом considered
$stmt = $conn->prepare('SELECT id FROM mentor_applications WHERE user_id = ? AND mentor_status = "considered"');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Ваша заявка вже знаходиться на розгляді.']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Додаємо заявку
$stmt = $conn->prepare('INSERT INTO mentor_applications (user_id, phone, organization, mentor_description, mentor_status) VALUES (?, ?, ?, ?, "considered")');
$stmt->bind_param('isss', $user_id, $phone, $organization, $mentor_description);
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Помилка при збереженні заявки: ' . $conn->error]);
}
$stmt->close();
$conn->close(); 