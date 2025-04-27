<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['id'])) {
    echo json_encode(['error'=>'ID курсу не вказано']);
    exit;
}
$id = intval($_GET['id']);
$sql = "SELECT id,title,description,price,image,students_count,average_rating,reviews_count,category,language,level,duration,mentor_id
        FROM courses WHERE id=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i',$id);
$stmt->execute();
$res = $stmt->get_result();
if($row = $res->fetch_assoc()) {
    echo json_encode($row);
} else {
    echo json_encode(['error'=>'Курс не знайдено']);
}
$conn->close();
