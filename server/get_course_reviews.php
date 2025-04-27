<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['course_id'])) {
    echo json_encode(['error'=>'ID курсу не вказано']);
    exit;
}
$cid = intval($_GET['course_id']);
$sql = "SELECT r.id,r.rating,r.review_text AS content,r.created_at,
               u.first_name,u.last_name,u.username,u.avatar
        FROM course_reviews r
        JOIN users u ON u.id=r.user_id
        WHERE r.course_id=?
        ORDER BY r.created_at DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i',$cid);
$stmt->execute();
$res = $stmt->get_result();
$reviews = [];
while($r = $res->fetch_assoc()) {
    $name = trim($r['first_name'].' '.$r['last_name']);
    if(!$name) $name = $r['username']?:'Користувач';
    $avatar = $r['avatar']?:'img/avatars/default-avatar.png';
    $reviews[] = [
        'user_name'=>$name,
        'user_avatar'=>$avatar,
        'rating'=>intval($r['rating']),
        'content'=>$r['content'],
        'date'=>$r['created_at']
    ];
}
echo json_encode(['reviews'=>$reviews]);
$conn->close();
