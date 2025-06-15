<?php
// Налаштування заголовків CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Перевіряємо, чи запит має метод OPTIONS (preflight запит)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Підключення до бази даних
include 'connect.php';

// Перевірка методу запиту
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволено. Використовуйте POST.'
    ]);
    exit;
}

// Перевірка наявності обов'язкових полів
if (!isset($_POST['section_id']) || !isset($_POST['title']) || !isset($_POST['resource_type'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Необхідно вказати ID секції, назву та тип ресурсу'
    ]);
    exit;
}

try {
    // Початок транзакції
    $conn->begin_transaction();
    
    $sectionId = (int)$_POST['section_id'];
    $title = trim($_POST['title']);
    $resourceType = trim($_POST['resource_type']);
    $content = isset($_POST['content']) ? trim($_POST['content']) : null;
    $resourceUrl = isset($_POST['resource_url']) ? trim($_POST['resource_url']) : null;
    $durationMinutes = isset($_POST['duration_minutes']) && is_numeric($_POST['duration_minutes']) ? (int)$_POST['duration_minutes'] : null;
    
    // Перевірка типу ресурсу
    $allowedTypes = ['text', 'video', 'document', 'image', 'quiz'];
    
    if (!in_array($resourceType, $allowedTypes)) {
        throw new Exception('Недопустимий тип ресурсу');
    }
    
    // Перевірка існування секції
    $checkSectionSql = "SELECT course_id FROM course_sections WHERE id = ?";
    $checkSectionStmt = $conn->prepare($checkSectionSql);
    $checkSectionStmt->bind_param('i', $sectionId);
    $checkSectionStmt->execute();
    $sectionResult = $checkSectionStmt->get_result();
    
    if ($sectionResult->num_rows === 0) {
        throw new Exception('Секцію не знайдено');
    }
    
    // Обробка завантаження файлу (для типів 'document' та 'image')
    if (($resourceType === 'document' || $resourceType === 'image') && isset($_FILES['resource_file']) && $_FILES['resource_file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../project/uploads/' . $resourceType . 's/';
        
        // Створюємо директорію, якщо не існує
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Генеруємо унікальне ім'я файлу
        $fileName = uniqid() . '_' . basename($_FILES['resource_file']['name']);
        $targetPath = $uploadDir . $fileName;
        
        // Для типу 'image' перевіряємо, чи це зображення
        if ($resourceType === 'image') {
            $check = getimagesize($_FILES['resource_file']['tmp_name']);
            if ($check === false) {
                throw new Exception('Файл не є зображенням');
            }
            
            // Обмеження на формат файлу
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            $fileExtension = strtolower(pathinfo($_FILES['resource_file']['name'], PATHINFO_EXTENSION));
            
            if (!in_array($fileExtension, $allowedExtensions)) {
                throw new Exception('Дозволені лише файли формату JPG, JPEG, PNG і GIF');
            }
        }
        
        // Обмеження на розмір файлу (10 МБ)
        if ($_FILES['resource_file']['size'] > 10000000) {
            throw new Exception('Розмір файлу перевищує 10 МБ');
        }
        
        // Переміщуємо файл
        if (move_uploaded_file($_FILES['resource_file']['tmp_name'], $targetPath)) {
            $resourceUrl = '/uploads/' . $resourceType . 's/' . $fileName;
        } else {
            throw new Exception('Помилка при завантаженні файлу');
        }
    }
    
    // Перевірка наявності необхідних даних для кожного типу ресурсу
    if ($resourceType === 'text' && empty($content)) {
        throw new Exception('Для текстового ресурсу необхідно вказати вміст');
    } elseif (($resourceType === 'video' || $resourceType === 'document' || $resourceType === 'image') && empty($resourceUrl)) {
        throw new Exception('Для ресурсу типу "' . $resourceType . '" необхідно вказати URL або завантажити файл');
    }
    
    // Отримання максимального порядкового номера для ресурсів цієї секції
    $maxOrderSql = "SELECT MAX(order_num) as max_order FROM section_resources WHERE section_id = ?";
    $maxOrderStmt = $conn->prepare($maxOrderSql);
    $maxOrderStmt->bind_param('i', $sectionId);
    $maxOrderStmt->execute();
    $maxOrderResult = $maxOrderStmt->get_result();
    $maxOrder = $maxOrderResult->fetch_assoc()['max_order'];
    
    // Встановлення нового порядкового номера
    $orderNum = $maxOrder !== null ? $maxOrder + 1 : 0;
    
    // Додавання нового ресурсу
    $insertSql = "INSERT INTO section_resources (section_id, title, resource_type, resource_url, content, duration_minutes, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bind_param('issssii', $sectionId, $title, $resourceType, $resourceUrl, $content, $durationMinutes, $orderNum);
    
    if (!$insertStmt->execute()) {
        throw new Exception('Помилка при створенні ресурсу: ' . $insertStmt->error);
    }
    
    $resourceId = $insertStmt->insert_id;
    
    // Завершення транзакції
    $conn->commit();
    
    // Успішна відповідь
    echo json_encode([
        'success' => true,
        'resource_id' => $resourceId,
        'message' => 'Ресурс успішно створено'
    ]);
    
} catch (Exception $e) {
    // Відкат транзакції у разі помилки
    $conn->rollback();
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

// Закриваємо з'єднання
$conn->close();
?> 