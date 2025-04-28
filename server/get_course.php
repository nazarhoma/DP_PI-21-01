<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['id'])) {
    echo json_encode(['error'=>'ID курсу не вказано']);
    exit;
}
$id = intval($_GET['id']);
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
    IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as average_rating,
    IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count,
    IFNULL((SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id), 0) as students_count
FROM 
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
