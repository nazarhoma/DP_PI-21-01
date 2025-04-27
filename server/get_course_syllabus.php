<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['course_id'])) {
    echo json_encode(['error'=>'ID курсу не вказано']);
    exit;
}
$cid = intval($_GET['course_id']);
$sql1 = "SELECT id,title,description FROM course_sections WHERE course_id=? ORDER BY id";
$stmt1 = $conn->prepare($sql1);
$stmt1->bind_param('i',$cid);
$stmt1->execute();
$secRes = $stmt1->get_result();
$sections = [];
while($s = $secRes->fetch_assoc()) {
    $sid = $s['id'];
    $sql2 = "SELECT title,content_type,duration 
             FROM course_lessons WHERE section_id=? ORDER BY id";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param('i',$sid);
    $stmt2->execute();
    $lesRes = $stmt2->get_result();
    $lessons = [];
    while($l = $lesRes->fetch_assoc()) {
        $lessons[] = $l;
    }
    $sections[] = [
        'id'=>$sid,
        'title'=>$s['title'],
        'description'=>$s['description'],
        'lessons'=>$lessons,
        'lessons_count'=>count($lessons)
    ];
}
echo json_encode(['sections'=>$sections,'total_lessons'=>array_sum(array_column($sections,'lessons_count'))]);
$conn->close();
