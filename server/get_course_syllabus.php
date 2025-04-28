<?php
header('Content-Type: application/json');
include 'connect.php';
if(!isset($_GET['course_id'])) {
    echo json_encode(['error'=>'ID курсу не вказано']);
    exit;
}
$cid = intval($_GET['course_id']);
$sql1 = "SELECT id, title, description FROM course_sections WHERE course_id=? ORDER BY order_num";
$stmt1 = $conn->prepare($sql1);
$stmt1->bind_param('i',$cid);
$stmt1->execute();
$secRes = $stmt1->get_result();
$sections = [];
while($s = $secRes->fetch_assoc()) {
    $sid = $s['id'];
    $sql2 = "SELECT title, resource_type, duration_minutes, order_num FROM section_resources WHERE section_id=? ORDER BY order_num";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param('i',$sid);
    $stmt2->execute();
    $resRes = $stmt2->get_result();
    $resources = [];
    while($r = $resRes->fetch_assoc()) {
        $resources[] = [
            'title' => $r['title'],
            'type' => $r['resource_type'],
            'duration' => $r['duration_minutes'],
            'order' => $r['order_num']
        ];
    }
    $sections[] = [
        'id'=>$sid,
        'title'=>$s['title'],
        'description'=>$s['description'],
        'resources'=>$resources,
        'resources_count'=>count($resources)
    ];
}
echo json_encode(['sections'=>$sections,'total_resources'=>array_sum(array_column($sections,'resources_count'))]);
$conn->close();
