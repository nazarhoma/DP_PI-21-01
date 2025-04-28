<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['id'])) {
    echo json_encode(['error'=>'ID ментора не вказано']);
    exit;
}
$id = intval($_GET['id']);
$sql = "SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.username,
    u.avatar,
    (SELECT COUNT(DISTINCT ce.user_id) FROM course_enrollments ce 
        JOIN courses c ON ce.course_id = c.id 
        WHERE c.mentor_id = u.id) AS students_count,
    (SELECT COUNT(*) FROM course_reviews r 
        JOIN courses c ON r.course_id = c.id 
        WHERE c.mentor_id = u.id) AS reviews_count,
    (SELECT COUNT(*) FROM courses WHERE mentor_id = u.id) AS courses_count
FROM users u
WHERE u.id = ?";
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
