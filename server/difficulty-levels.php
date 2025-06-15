<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

require_once 'connect.php';

try {
    $query = "SELECT * FROM difficulty_levels";
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception("Database error: " . mysqli_error($conn));
    }
    
    $levels = array();
    while ($row = mysqli_fetch_assoc($result)) {
        $levels[] = $row;
    }
    
    echo json_encode($levels);
} catch (Exception $e) {
    error_log('Server error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

mysqli_free_result($result);
?> 