<?php
// Налаштування заголовків CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Функція для транслітерації кирилічних символів
function transliterate($string) {
    $cyrillic = [
        'а','б','в','г','д','е','ё','ж','з','и','й','к','л','м','н','о','п',
        'р','с','т','у','ф','х','ц','ч','ш','щ','ъ','ы','ь','э','ю','я',
        'А','Б','В','Г','Д','Е','Ё','Ж','З','И','Й','К','Л','М','Н','О','П',
        'Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Ъ','Ы','Ь','Э','Ю','Я', ' '
    ];
    $latin = [
        'a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p',
        'r','s','t','u','f','h','ts','ch','sh','sch','','y','','e','yu','ya',
        'A','B','V','G','D','E','E','Zh','Z','I','Y','K','L','M','N','O','P',
        'R','S','T','U','F','H','Ts','Ch','Sh','Sch','','Y','','E','Yu','Ya', '_'
    ];
    return str_replace($cyrillic, $latin, $string);
}

// Перевіряємо, чи запит має метод OPTIONS (preflight запит)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Підключення до бази даних
require_once 'connect.php';

// Увімкнення відображення помилок
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Логування для відлагодження
error_log("Request started");
error_log("POST data: " . print_r($_POST, true));
if (isset($_FILES)) {
    error_log("Files data: " . print_r($_FILES, true));
}

// Перевірка методу запиту
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволено. Використовуйте POST.'
    ]);
    exit;
}

try {
    // Перевірка наявності обов'язкових полів
    if (!isset($_POST['section_id']) || !isset($_POST['title']) || !isset($_POST['resource_type'])) {
        throw new Exception('Не всі обов\'язкові поля заповнені');
    }

    $section_id = intval($_POST['section_id']);
    $title = trim($_POST['title']);
    $resource_type = $_POST['resource_type'];
    $content = isset($_POST['content']) ? trim($_POST['content']) : null;
    $resource_url = isset($_POST['resource_url']) ? trim($_POST['resource_url']) : null;
    $duration_minutes = isset($_POST['duration_minutes']) ? intval($_POST['duration_minutes']) : null;

    // Перевірка довжини назви
    if (strlen($title) > 255) {
        throw new Exception('Назва ресурсу не повинна перевищувати 255 символів');
    }

    // Перевірка існування секції
    $checkSectionSql = "SELECT course_id FROM course_sections WHERE id = ?";
    $checkSectionStmt = $conn->prepare($checkSectionSql);
    $checkSectionStmt->bind_param('i', $section_id);
    $checkSectionStmt->execute();
    $sectionResult = $checkSectionStmt->get_result();
    
    if ($sectionResult->num_rows === 0) {
        throw new Exception('Секцію не знайдено');
    }

    // Перевірка типу ресурсу
    $allowedTypes = ['text', 'video', 'document', 'image', 'quiz'];
    
    if (!in_array($resource_type, $allowedTypes)) {
        throw new Exception('Недопустимий тип ресурсу');
    }

    // Обробка завантаження файлу
    if (isset($_FILES['resource_file']) && $_FILES['resource_file']['error'] === UPLOAD_ERR_OK) {
        try {
            // Виводимо інформацію про поточну директорію та шляхи
            error_log("Current directory: " . getcwd());
            error_log("__DIR__: " . __DIR__);
            error_log("Document root: " . $_SERVER['DOCUMENT_ROOT']);
            
            // Визначаємо базову директорію для завантажень (використовуємо DOCUMENT_ROOT)
            $base_upload_dir = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/project/resources/';
            
            // Конвертуємо всі слеші в прямі для Linux
            $base_upload_dir = str_replace('\\', '/', $base_upload_dir);
            
            // Визначаємо піддиректорію в залежності від типу ресурсу
            $resource_type_dir = '';
            if ($resource_type === 'document') {
                $resource_type_dir = 'document/';
            } elseif ($resource_type === 'image') {
                $resource_type_dir = 'images/';
            }
            
            $upload_dir = $base_upload_dir . $resource_type_dir;
            error_log("Full upload directory path: " . $upload_dir);
            
            // Перевіряємо наявність директорії
            if (!file_exists($upload_dir)) {
                error_log("Directory does not exist: " . $upload_dir);
                throw new Exception("Директорія не існує: " . $upload_dir);
            }
            
            // Перевіряємо права доступу
            if (!is_writable($upload_dir)) {
                error_log("Directory not writable: " . $upload_dir);
                error_log("Directory permissions: " . substr(sprintf('%o', fileperms($upload_dir)), -4));
                throw new Exception("Немає прав на запис в директорію: " . $upload_dir);
            }
            
            // Генеруємо безпечне ім'я файлу
            $original_name = pathinfo($_FILES['resource_file']['name'], PATHINFO_FILENAME);
            $file_extension = strtolower(pathinfo($_FILES['resource_file']['name'], PATHINFO_EXTENSION));
            
            // Транслітеруємо ім'я файлу та видаляємо небезпечні символи
            $safe_name = transliterate($original_name);
            $safe_name = preg_replace('/[^a-zA-Z0-9_-]/', '', $safe_name);
            
            // Формуємо фінальне ім'я файлу
            $file_name = $safe_name . '_' . uniqid() . '.' . $file_extension;
            $file_path = $upload_dir . $file_name;
            
            error_log("Attempting to upload file to: " . $file_path);
            error_log("Temporary file location: " . $_FILES['resource_file']['tmp_name']);
            error_log("File size: " . $_FILES['resource_file']['size']);
            
            // Перевіряємо тимчасовий файл
            if (!file_exists($_FILES['resource_file']['tmp_name'])) {
                throw new Exception("Тимчасовий файл не знайдено");
            }
            
            // Завантажуємо файл
            if (!move_uploaded_file($_FILES['resource_file']['tmp_name'], $file_path)) {
                $upload_error = error_get_last();
                error_log("Upload error: " . print_r($upload_error, true));
                throw new Exception("Помилка при завантаженні файлу: " . ($upload_error ? $upload_error['message'] : 'Невідома помилка'));
            }
            
            // Зберігаємо URL файлу відносно кореня проекту
            $resource_url = 'project/resources/' . $resource_type_dir . $file_name;
            
        } catch (Exception $e) {
            error_log("Error in file upload: " . $e->getMessage());
            throw $e;
        }
    }

    // Перевірка наявності контенту або URL для відповідних типів ресурсів
    if ($resource_type === 'text' && empty($content)) {
        throw new Exception('Для текстового ресурсу необхідно вказати вміст');
    }

    if ($resource_type === 'video' && empty($resource_url)) {
        throw new Exception('Для відео необхідно вказати URL');
    }

    if (($resource_type === 'document' || $resource_type === 'image') && empty($resource_url)) {
        throw new Exception('Для документа або зображення необхідно завантажити файл або вказати URL');
    }

    // Отримуємо максимальний order_num для секції
    $order_sql = "SELECT COALESCE(MAX(order_num), -1) + 1 as next_order FROM section_resources WHERE section_id = ?";
    $order_stmt = $conn->prepare($order_sql);
    $order_stmt->bind_param('i', $section_id);
    $order_stmt->execute();
    $order_result = $order_stmt->get_result();
    $order_num = $order_result->fetch_assoc()['next_order'];

    // Додаємо ресурс до бази даних
    $sql = "INSERT INTO section_resources (section_id, title, resource_type, resource_url, content, duration_minutes, order_num) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('issssii', $section_id, $title, $resource_type, $resource_url, $content, $duration_minutes, $order_num);
    
    if (!$stmt->execute()) {
        throw new Exception('Помилка при збереженні ресурсу: ' . $stmt->error);
    }

    $resource_id = $stmt->insert_id;

    echo json_encode([
        'success' => true,
        'message' => 'Ресурс успішно створено',
        'resource_id' => $resource_id
    ]);

} catch (Exception $e) {
    error_log("Error occurred: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?> 