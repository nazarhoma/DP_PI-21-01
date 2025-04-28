<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['course_id'])) {
    echo json_encode(['error'=>'ID курсу не вказано']);
    exit;
}
$cid = intval($_GET['course_id']);
$sqlCat = "SELECT category_id FROM courses WHERE id=?";
$stmtCat = $conn->prepare($sqlCat);
$stmtCat->bind_param('i',$cid);
$stmtCat->execute();
$catRes = $stmtCat->get_result();
$cat_id = $catRes->fetch_assoc()['category_id']?:'';
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
    u.first_name,
    u.last_name,
    IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as average_rating,
    IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count
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
    c.category_id=? AND c.id<>? 
ORDER BY c.id DESC LIMIT 4";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ii',$cat_id,$cid);
$stmt->execute();
$res = $stmt->get_result();
$related = [];
while($c = $res->fetch_assoc()) {
    $related[] = $c;
}
echo json_encode(['courses'=>$related]);
$conn->close();
