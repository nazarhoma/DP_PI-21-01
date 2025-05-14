<?php
header('Content-Type: application/json');
include 'connect.php';

// Розпочинаємо сесію для отримання user_id
session_start();
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

// Перевіряємо чи передано user_id через GET, якщо немає в сесії
if (!$user_id && isset($_GET['user_id'])) {
    $user_id = intval($_GET['user_id']);
}

if(!isset($_GET['id'])) {
    echo json_encode(['error'=>'ID курсу не вказано']);
    exit;
}

$id = intval($_GET['id']);

// Перевіряємо, що ID курсу є валідним числом більше 0
if ($id <= 0) {
    echo json_encode(['error'=>'Невірний ID курсу']);
    exit;
}

// Перевіряємо підключення до бази даних
if ($conn->connect_error) {
    echo json_encode(['error'=>'Помилка підключення до бази даних: ' . $conn->connect_error]);
    exit;
}

$sql = "SELECT 
    c.id, 
    c.title, 
    c.short_description AS description, 
    c.image_url AS image, 
    c.price, 
    c.duration_hours AS duration, 
    dl.name AS level,
    l.name AS language,
    cat.name AS category,
    u.id as mentor_id,
    CONCAT(u.first_name, ' ', u.last_name) as author,
    IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as average_rating,
    IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count,
    IFNULL((SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id), 0) as students_count";

// Додаємо статус курсу, якщо є id користувача
if ($user_id) {
    $sql .= ", IFNULL((SELECT status FROM course_enrollments WHERE course_id = c.id AND user_id = ?), '') as status";
}

$sql .= " FROM 
    courses c
LEFT JOIN 
    users u ON c.mentor_id = u.id
LEFT JOIN
    difficulty_levels dl ON c.level_id = dl.id
LEFT JOIN
    languages l ON c.language_id = l.id
LEFT JOIN
    categories cat ON c.category_id = cat.id
WHERE 
    c.id = ?";

try {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Помилка підготовки запиту: " . $conn->error);
    }
    
    if ($user_id) {
        $stmt->bind_param('ii', $user_id, $id);
    } else {
        $stmt->bind_param('i', $id);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Помилка виконання запиту: " . $stmt->error);
    }
    
    $res = $stmt->get_result();
    if ($res === false) {
        throw new Exception("Помилка отримання результатів: " . $stmt->error);
    }
    
    if($row = $res->fetch_assoc()) {
        echo json_encode($row);
    } else {
        echo json_encode(['error'=>'Курс не знайдено']);
    }
} catch (Exception $e) {
    echo json_encode(['error'=>'Помилка запиту: ' . $e->getMessage()]);
}

$conn->close();
