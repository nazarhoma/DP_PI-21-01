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
    // Отримуємо всі рівні складності
    $sql = "SELECT id, name FROM difficulty_levels ORDER BY id ASC";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $levels = [];
        
        while ($row = $result->fetch_assoc()) {
            $levels[] = [
                'id' => intval($row['id']),
                'name' => $row['name']
            ];
        }
        
        $response['success'] = true;
        $response['levels'] = $levels;
    } else {
        $response['success'] = true;
        $response['levels'] = [];
        $response['message'] = 'Рівні складності не знайдено';
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['success'] = false;
    $response['message'] = 'Помилка: ' . $e->getMessage();
} finally {
    $conn->close();
}

echo json_encode($response); 