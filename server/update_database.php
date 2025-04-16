<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

include 'connect.php';

$response = array();

// Перевіряємо наявність поля avatar в таблиці і додаємо його, якщо потрібно
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'avatar'");
if ($result->num_rows === 0) {
    $conn->query("ALTER TABLE users ADD avatar VARCHAR(255) NULL");
    $response['avatar_field'] = "Поле 'avatar' додано до таблиці";
} else {
    $response['avatar_field'] = "Поле 'avatar' вже існує в таблиці";
}

// Перевіряємо наявність поля gender в таблиці і додаємо його, якщо потрібно
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'gender'");
if ($result->num_rows === 0) {
    $conn->query("ALTER TABLE users ADD gender VARCHAR(50) NULL");
    $response['gender_field'] = "Поле 'gender' додано до таблиці";
} else {
    $response['gender_field'] = "Поле 'gender' вже існує в таблиці";
}

// Перевіряємо наявність поля age в таблиці і додаємо його, якщо потрібно
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'age'");
if ($result->num_rows === 0) {
    $conn->query("ALTER TABLE users ADD age INT NULL");
    $response['age_field'] = "Поле 'age' додано до таблиці";
} else {
    $response['age_field'] = "Поле 'age' вже існує в таблиці";
}

// Перевіряємо наявність поля education в таблиці і додаємо його, якщо потрібно
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'education'");
if ($result->num_rows === 0) {
    $conn->query("ALTER TABLE users ADD education VARCHAR(255) NULL");
    $response['education_field'] = "Поле 'education' додано до таблиці";
} else {
    $response['education_field'] = "Поле 'education' вже існує в таблиці";
}

// Перевіряємо наявність поля native_language в таблиці і додаємо його, якщо потрібно
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'native_language'");
if ($result->num_rows === 0) {
    $conn->query("ALTER TABLE users ADD native_language VARCHAR(100) NULL");
    $response['native_language_field'] = "Поле 'native_language' додано до таблиці";
} else {
    $response['native_language_field'] = "Поле 'native_language' вже існує в таблиці";
}

$response['success'] = true;
$response['message'] = "Структуру бази даних оновлено";

echo json_encode($response);

$conn->close();
?> 