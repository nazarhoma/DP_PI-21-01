<?php
// Налаштування заголовків для CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Підключення до бази даних
$servername = "localhost"; 
$username = "root";  
$password = "";      
$dbname = "byway";   

// Створення з'єднання
$conn = new mysqli($servername, $username, $password, $dbname);

// Перевірка з'єднання
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => "Помилка з'єднання з базою даних: " . $conn->connect_error
    ]));
}

// Встановлюємо кодування
$conn->set_charset("utf8mb4");

// Перевіряємо метод запиту
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Отримуємо ID користувача
    $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;
    
    if (!$user_id) {
        die(json_encode([
            'success' => false,
            'message' => 'ID користувача не вказано'
        ]));
    }
    
    // Підготовлений запит для отримання даних користувача
    $stmt = $conn->prepare("
        SELECT 
            id, username, email, role, first_name, last_name, 
            avatar, gender, age, education, native_language,
            created_at
        FROM users 
        WHERE id = ?
    ");
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Отримуємо дані користувача
        $user_data = $result->fetch_assoc();
        
        // Відправляємо успішну відповідь
        echo json_encode([
            'success' => true,
            'user_data' => $user_data
        ]);
    } else {
        // Відправляємо повідомлення про помилку
        echo json_encode([
            'success' => false,
            'message' => 'Користувача не знайдено'
        ]);
    }
    
    $stmt->close();
} else {
    // Якщо метод запиту не POST
    echo json_encode([
        'success' => false,
        'message' => 'Невірний метод запиту'
    ]);
}

// Закриваємо з'єднання
$conn->close();
?> 