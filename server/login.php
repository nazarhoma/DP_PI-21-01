<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Налаштування для виявлення помилок
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Реєстрація помилок у логи
error_log("login.php скрипт запущено");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    include 'connect.php';
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $login = isset($_POST['login']) ? $_POST['login'] : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        
        error_log("Спроба авторизації: логін - $login");
        
        if (empty($login) || empty($password)) {
            error_log("Помилка: Порожні поля");
            echo json_encode([
                'success' => false,
                'message' => "Всі поля обов'язкові для заповнення"
            ]);
            exit;
        }
        
        $stmt = $conn->prepare("SELECT id, username, email, password, role FROM users WHERE email = ? OR username = ?");
        $stmt->bind_param("ss", $login, $login);
        $stmt->execute();
        $stmt->store_result();
        
        $rows = $stmt->num_rows;
        error_log("Знайдено записів у БД: $rows");

        if ($rows > 0) {
            $stmt->bind_result($id, $username, $email, $hashed_password, $role);
            $stmt->fetch();
            
            error_log("Користувача знайдено: ID - $id, Username - $username, Email - $email, Role - $role");

            // Перевіряємо пароль
            if (password_verify($password, $hashed_password)) {
                error_log("Пароль вірний, авторизація успішна");
                
                // Отримуємо повні дані користувача
                $query = "SELECT id, username, email, role, first_name, last_name, 
                        avatar, gender, age, education, native_language, created_at 
                        FROM users WHERE id = ?";
                $full_data_stmt = $conn->prepare($query);
                $full_data_stmt->bind_param("i", $id);
                $full_data_stmt->execute();
                $full_data_result = $full_data_stmt->get_result();
                $user_data = $full_data_result->fetch_assoc();
                
                // Логуємо для діагностики
                error_log("Повні дані користувача при авторизації: " . print_r($user_data, true));
                
                $response_data = [
                    'success' => true,
                    'message' => 'Авторизація успішна!',
                    'user' => $user_data
                ];
                
                echo json_encode($response_data);
                error_log("Відправлено JSON відповідь: " . json_encode($response_data));
            } else {
                error_log("Пароль невірний");
                echo json_encode([
                    'success' => false,
                    'message' => "Невірний пароль"
                ]);
            }
        } else {
            error_log("Користувача не знайдено");
            echo json_encode([
                'success' => false,
                'message' => "Користувача з таким email або логіном не знайдено"
            ]);
        }

        $stmt->close();
        $conn->close();
    } else {
        error_log("Метод не дозволений: " . $_SERVER['REQUEST_METHOD']);
        echo json_encode([
            'success' => false,
            'message' => "Метод не дозволений"
        ]);
    }
} catch (Exception $e) {
    error_log("Критична помилка: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => "Помилка сервера: " . $e->getMessage()
    ]);
}
?>
