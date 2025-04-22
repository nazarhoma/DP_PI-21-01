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
    // Отримуємо всі категорії
    $sql = "SELECT id, name, parent_id FROM categories ORDER BY parent_id ASC, name ASC";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        $categories = [];
        
        while ($row = $result->fetch_assoc()) {
            $categories[] = [
                'id' => intval($row['id']),
                'name' => $row['name'],
                'parent_id' => $row['parent_id'] ? intval($row['parent_id']) : null
            ];
        }
        
        $response['success'] = true;
        $response['categories'] = $categories;
    } else {
        $response['success'] = true;
        $response['categories'] = [];
        $response['message'] = 'Категорії не знайдено';
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['success'] = false;
    $response['message'] = 'Помилка: ' . $e->getMessage();
} finally {
    $conn->close();
}

echo json_encode($response); 