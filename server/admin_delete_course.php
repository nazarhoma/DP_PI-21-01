<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'connect.php';

// Перевіряємо, чи метод запиту POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Метод не дозволений'
    ]);
    exit;
}

try {
    // Перевіряємо наявність ID курсу
    if (!isset($_POST['course_id']) || empty($_POST['course_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID курсу не вказано'
        ]);
        exit;
    }
    
    $courseId = (int)$_POST['course_id'];
    
    // Починаємо транзакцію
    $conn->begin_transaction();
    
    // Видаляємо всі записи, пов'язані з курсом
    // Завдяки зовнішнім ключам з ON DELETE CASCADE, багато видалень виконається автоматично
    
    // Видаляємо записи з cart
    $deleteCart = "DELETE FROM cart WHERE course_id = ?";
    $stmtCart = $conn->prepare($deleteCart);
    $stmtCart->bind_param("i", $courseId);
    $stmtCart->execute();
    
    // Видаляємо записи з orders
    $deleteOrders = "DELETE FROM orders WHERE course_id = ?";
    $stmtOrders = $conn->prepare($deleteOrders);
    $stmtOrders->bind_param("i", $courseId);
    $stmtOrders->execute();
    
    // Видаляємо сам курс
    $deleteCourse = "DELETE FROM courses WHERE id = ?";
    $stmtCourse = $conn->prepare($deleteCourse);
    $stmtCourse->bind_param("i", $courseId);
    $stmtCourse->execute();
    
    // Перевіряємо, чи був курс видалений
    if ($stmtCourse->affected_rows > 0) {
        // Завершуємо транзакцію
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Курс успішно видалено'
        ]);
    } else {
        // Відкатуємо транзакцію, якщо курс не знайдено
        $conn->rollback();
        
        echo json_encode([
            'success' => false,
            'message' => 'Курс не знайдено або вже видалено'
        ]);
    }
} catch (Exception $e) {
    // Відкатуємо транзакцію в разі помилки
    $conn->rollback();
    
    echo json_encode([
        'success' => false,
        'message' => 'Помилка при видаленні курсу: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 