<?php
// Налаштування заголовків для CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Перевіряємо, чи запит має метод OPTIONS (preflight запит)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Відповідаємо 200 OK для preflight запиту
    http_response_code(200);
    exit;
}

// Виведення помилок під час розробки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Перевіряємо метод запиту
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Метод не дозволено. Використовуйте GET.'
    ]));
}

// Підключення до бази даних
include 'connect.php';

$response = [];

try {
    // Отримуємо всі мови
    $sql = "SELECT id, code, name FROM languages ORDER BY name ASC";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $languages = [];
        
        while ($row = $result->fetch_assoc()) {
            $languages[] = [
                'id' => intval($row['id']),
                'code' => $row['code'],
                'name' => $row['name']
            ];
        }
        
        $response['success'] = true;
        $response['languages'] = $languages;
    } else {
        $response['success'] = true;
        $response['languages'] = [];
        $response['message'] = 'Мови не знайдено';
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['success'] = false;
    $response['message'] = 'Помилка: ' . $e->getMessage();
} finally {
    $conn->close();
}

echo json_encode($response); 