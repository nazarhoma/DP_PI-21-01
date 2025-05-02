<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'connect.php';

try {
    // Вибираємо заявки зі статусом considered
    $sql = "SELECT ma.id as application_id, ma.user_id, ma.phone, ma.organization, ma.mentor_description, 
                   u.first_name, u.last_name, u.email
            FROM mentor_applications ma
            JOIN users u ON ma.user_id = u.id
            WHERE ma.mentor_status = 'considered'
            ORDER BY ma.id ASC";
    $result = $conn->query($sql);
    if ($result) {
        $mentors = array();
        while ($row = $result->fetch_assoc()) {
            $mentors[] = array(
                'application_id' => $row['application_id'],
                'user_id' => $row['user_id'],
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'organization' => $row['organization'],
                'mentor_description' => $row['mentor_description']
            );
        }
        echo json_encode(array(
            'success' => true,
            'mentors' => $mentors
        ));
    } else {
        echo json_encode(array(
            'success' => false,
            'message' => 'Помилка запиту до бази даних: ' . $conn->error
        ));
    }
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Помилка: ' . $e->getMessage()
    ));
}

$conn->close();
?> 