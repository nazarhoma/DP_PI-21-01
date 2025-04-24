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
    $upload_dir = str_replace('\\', '/', $upload_dir);
    
    error_log("Upload directory: " . $upload_dir);
    
    // Перевіряємо і створюємо директорію, якщо потрібно
    if (!file_exists($upload_dir)) {
        error_log("Directory doesn't exist, trying to create: " . $upload_dir);
        if (!mkdir($upload_dir, 0777, true)) {
            error_log("Failed to create directory: " . $upload_dir);
            $response['success'] = false;
            $response['message'] = "Не вдалося створити директорію для завантаження";
            echo json_encode($response);
            exit;
        }
        error_log("Directory created successfully");
    }
    
    // Перевіряємо права на запис
    if (!is_writable($upload_dir)) {
        error_log("Directory is not writable: " . $upload_dir);
        $response['success'] = false;
        $response['message'] = "Немає прав на запис у директорію";
        
        // Спробуємо змінити права
        chmod($upload_dir, 0777);
        error_log("Attempted to change permissions");
        
        if (!is_writable($upload_dir)) {
            error_log("Directory is still not writable after chmod");
            echo json_encode($response);
            exit;
        }
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
    error_log("Trying to move file to: " . $avatar_path);
    error_log("Temp file exists: " . (file_exists($_FILES['avatar']['tmp_name']) ? "Yes" : "No"));
    
    if (move_uploaded_file($_FILES['avatar']['tmp_name'], $avatar_path)) {
        // Перевіряємо, чи файл дійсно завантажено
        if (file_exists($avatar_path)) {
            error_log("Avatar file exists after upload: Yes, size: " . filesize($avatar_path));
        } else {
            error_log("Avatar file doesn't exist after upload!");
        }
        
        // Змінюємо права доступу до файлу
        chmod($avatar_path, 0644);
        
        // Оновлюємо шлях до аватару в базі даних
        // URL шлях для використання в HTML/JavaScript
        $avatar_url = 'img/avatars/' . $avatar_name;
        error_log("File upload successful, saving in DB with path: " . $avatar_url);
        
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
        error_log("File upload failed: " . $_FILES['avatar']['error']);
        error_log("Source file: " . $_FILES['avatar']['tmp_name']);
    }
    
    $stmt->close();
    $conn->close();
} else {
    $response['success'] = false;
    $response['message'] = "Метод не дозволений";
}

echo json_encode($response);
?> 