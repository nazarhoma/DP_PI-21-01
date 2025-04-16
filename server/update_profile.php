<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

include 'connect.php';

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : '';
    $first_name = isset($_POST['first_name']) ? $_POST['first_name'] : '';
    $last_name = isset($_POST['last_name']) ? $_POST['last_name'] : '';
    $gender = isset($_POST['gender']) ? $_POST['gender'] : '';
    $age = isset($_POST['age']) ? $_POST['age'] : null;
    $education = isset($_POST['education']) ? $_POST['education'] : '';
    $native_language = isset($_POST['native_language']) ? $_POST['native_language'] : '';
    
    if (empty($user_id)) {
        $response['success'] = false;
        $response['message'] = "ID користувача обов'язковий";
        echo json_encode($response);
        exit;
    }
    
    // Перевіряємо, чи існує користувач
    $stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows === 0) {
        $response['success'] = false;
        $response['message'] = "Користувача не знайдено";
        echo json_encode($response);
        exit;
    }
    
    // Перевіряємо наявність поля віку в таблиці і додаємо його, якщо потрібно
    $result = $conn->query("SHOW COLUMNS FROM users LIKE 'age'");
    if ($result->num_rows === 0) {
        $conn->query("ALTER TABLE users ADD age INT NULL");
    }
    
    // Перевіряємо наявність інших нових полів і додаємо їх
    $result = $conn->query("SHOW COLUMNS FROM users LIKE 'gender'");
    if ($result->num_rows === 0) {
        $conn->query("ALTER TABLE users ADD gender VARCHAR(50) NULL");
    }
    
    $result = $conn->query("SHOW COLUMNS FROM users LIKE 'education'");
    if ($result->num_rows === 0) {
        $conn->query("ALTER TABLE users ADD education VARCHAR(255) NULL");
    }
    
    $result = $conn->query("SHOW COLUMNS FROM users LIKE 'native_language'");
    if ($result->num_rows === 0) {
        $conn->query("ALTER TABLE users ADD native_language VARCHAR(100) NULL");
    }
    
    // Будуємо запит на оновлення
    $update_query = "UPDATE users SET ";
    $params = [];
    $types = "";
    
    if (!empty($first_name)) {
        $update_query .= "first_name = ?, ";
        $params[] = $first_name;
        $types .= "s";
    }
    
    if (!empty($last_name)) {
        $update_query .= "last_name = ?, ";
        $params[] = $last_name;
        $types .= "s";
    }
    
    if (!empty($gender)) {
        $update_query .= "gender = ?, ";
        $params[] = $gender;
        $types .= "s";
    }
    
    if ($age !== null) {
        $update_query .= "age = ?, ";
        $params[] = $age;
        $types .= "i";
    }
    
    if (!empty($education)) {
        $update_query .= "education = ?, ";
        $params[] = $education;
        $types .= "s";
    }
    
    if (!empty($native_language)) {
        $update_query .= "native_language = ?, ";
        $params[] = $native_language;
        $types .= "s";
    }
    
    // Видаляємо останню кому
    $update_query = rtrim($update_query, ", ");
    $update_query .= " WHERE id = ?";
    $params[] = $user_id;
    $types .= "i";
    
    if (count($params) > 1) {  // Перевіряємо, чи є хоч одне поле для оновлення
        $update_stmt = $conn->prepare($update_query);
        
        // Динамічно прив'язуємо параметри
        $bind_params = array($types);
        for ($i = 0; $i < count($params); $i++) {
            $bind_params[] = &$params[$i];
        }
        call_user_func_array(array($update_stmt, 'bind_param'), $bind_params);
        
        if ($update_stmt->execute()) {
            $response['success'] = true;
            $response['message'] = "Профіль успішно оновлено";
            
            // Повертаємо оновлені дані користувача
            $get_user = $conn->prepare("SELECT first_name, last_name, email, username, role, avatar, gender, age, education, native_language FROM users WHERE id = ?");
            $get_user->bind_param("i", $user_id);
            $get_user->execute();
            $user_result = $get_user->get_result();
            $user_data = $user_result->fetch_assoc();
            
            // Додаємо повний URL до аватару, якщо він існує
            if (isset($user_data['avatar']) && !empty($user_data['avatar'])) {
                $avatar_path = $user_data['avatar'];
                if (strpos($avatar_path, 'http') !== 0) { // Якщо не починається з http
                    if (strpos($avatar_path, '/') !== 0) { // Додаємо слеш на початку, якщо його немає
                        $avatar_path = '/' . $avatar_path;
                    }
                    $user_data['avatar_full_url'] = 'http://' . $_SERVER['HTTP_HOST'] . $avatar_path;
                }
            }
            
            $response['user_data'] = $user_data;
            $get_user->close();
        } else {
            $response['success'] = false;
            $response['message'] = "Помилка при оновленні профілю: " . $conn->error;
        }
        
        $update_stmt->close();
    } else {
        $response['success'] = false;
        $response['message'] = "Немає даних для оновлення";
    }
    
    $stmt->close();
    $conn->close();
} else {
    $response['success'] = false;
    $response['message'] = "Метод не дозволений";
}

echo json_encode($response);
?> 