<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['id'])) {
    echo json_encode(['error'=>'ID ментора не вказано']);
    exit;
}
$id = intval($_GET['id']);
$sql = "SELECT id,first_name,last_name,username,avatar,title,students_count,reviews_count,courses_count
        FROM users WHERE id=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i',$id);
$stmt->execute();
$res = $stmt->get_result();
if($m = $res->fetch_assoc()) {
    echo json_encode($m);
} else {
    echo json_encode(['error'=>'Ментор не знайдено']);
}
$conn->close();
