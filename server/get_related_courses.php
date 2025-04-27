<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['course_id'])) {
    echo json_encode(['error'=>'ID курсу не вказано']);
    exit;
}
$cid = intval($_GET['course_id']);
$sqlCat = "SELECT category FROM courses WHERE id=?";
$stmtCat = $conn->prepare($sqlCat);
$stmtCat->bind_param('i',$cid);
$stmtCat->execute();
$catRes = $stmtCat->get_result();
$cat = $catRes->fetch_assoc()['category']?:'';
$sql = "SELECT id,title,author,price,image,average_rating,reviews_count 
        FROM courses 
        WHERE category=? AND id<>? 
        ORDER BY id DESC LIMIT 4";
$stmt = $conn->prepare($sql);
$stmt->bind_param('si',$cat,$cid);
$stmt->execute();
$res = $stmt->get_result();
$related = [];
while($c = $res->fetch_assoc()) {
    $related[] = $c;
}
echo json_encode(['courses'=>$related]);
$conn->close();
