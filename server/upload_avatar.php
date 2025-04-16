<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

include 'connect.php';

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : '';
    
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
    
    // Перевіряємо, чи файл був завантажений
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== 0) {
        $response['success'] = false;
        $response['message'] = "Помилка завантаження файлу";
        echo json_encode($response);
        exit;
    }
    
    // Налаштування для завантаження файлу
    $upload_dir = '../project/img/avatars/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    // Перевіряємо тип файлу
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($_FILES['avatar']['type'], $allowed_types)) {
        $response['success'] = false;
        $response['message'] = "Дозволені тільки файли JPG, PNG та GIF";
        echo json_encode($response);
        exit;
    }
    
    // Перевіряємо розмір файлу (максимум 2 МБ)
    if ($_FILES['avatar']['size'] > 2 * 1024 * 1024) {
        $response['success'] = false;
        $response['message'] = "Розмір файлу не повинен перевищувати 2 МБ";
        echo json_encode($response);
        exit;
    }
    
    // Генеруємо унікальне ім'я файлу
    $file_extension = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
    $avatar_name = 'avatar_' . $user_id . '_' . time() . '.' . $file_extension;
    $avatar_path = $upload_dir . $avatar_name;
    
    // Завантажуємо файл
    if (move_uploaded_file($_FILES['avatar']['tmp_name'], $avatar_path)) {
        // Оновлюємо шлях до аватару в базі даних
        $avatar_url = 'img/avatars/' . $avatar_name; // Відносний шлях для фронтенду
        
        $update_stmt = $conn->prepare("UPDATE users SET avatar = ? WHERE id = ?");
        $update_stmt->bind_param("si", $avatar_url, $user_id);
        
        if ($update_stmt->execute()) {
            $response['success'] = true;
            $response['message'] = "Аватар успішно оновлено";
            $response['avatar_url'] = $avatar_url;
        } else {
            $response['success'] = false;
            $response['message'] = "Помилка при оновленні аватару в базі даних: " . $conn->error;
        }
        
        $update_stmt->close();
    } else {
        $response['success'] = false;
        $response['message'] = "Помилка при збереженні файлу";
    }
    
    $stmt->close();
    $conn->close();
} else {
    $response['success'] = false;
    $response['message'] = "Метод не дозволений";
}

echo json_encode($response);
?> 