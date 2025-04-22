<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

$response = array();

// Перевіряємо, чи передано ID курсу
if (!isset($_GET['course_id']) || empty($_GET['course_id'])) {
    $response['error'] = 'ID курсу не вказано';
    echo json_encode($response);
    exit;
}

$courseId = intval($_GET['course_id']);

try {
    // Спочатку отримуємо загальну інформацію про курс
    $course_sql = "SELECT title FROM courses WHERE id = ?";
    $stmt = $conn->prepare($course_sql);
    $stmt->bind_param("i", $courseId);
    $stmt->execute();
    $course_result = $stmt->get_result();
    
    if ($course_result->num_rows == 0) {
        $response['error'] = 'Курс не знайдено';
        echo json_encode($response);
        exit;
    }
    
    $course_data = $course_result->fetch_assoc();
    
    // Запит для отримання розділів курсу
    $sections_sql = "SELECT id, title, description, order_num as order_number
                    FROM course_sections 
                    WHERE course_id = ? 
                    ORDER BY order_num ASC";
    
    $stmt = $conn->prepare($sections_sql);
    $stmt->bind_param("i", $courseId);
    $stmt->execute();
    $sections_result = $stmt->get_result();
    
    $sections = array();
    $total_lessons = 0;
    $total_duration_seconds = 0;
    
    if ($sections_result->num_rows > 0) {
        while ($section = $sections_result->fetch_assoc()) {
            $section_id = $section['id'];
            
            // Запит для отримання ресурсів розділу
            $resources_sql = "SELECT id, title, resource_type as content_type, 
                             resource_url as content_url, duration_minutes as duration, 
                             order_num as order_number  
                             FROM section_resources 
                             WHERE section_id = ? 
                             ORDER BY order_num ASC";
            
            $resources_stmt = $conn->prepare($resources_sql);
            $resources_stmt->bind_param("i", $section_id);
            $resources_stmt->execute();
            $resources_result = $resources_stmt->get_result();
            
            $lessons = array();
            $section_duration_seconds = 0;
            $lessons_count = 0;
            
            if ($resources_result->num_rows > 0) {
                while ($resource = $resources_result->fetch_assoc()) {
                    // Перетворюємо тривалість ресурсу з хвилин в секунди
                    $duration_seconds = 0;
                    if (!empty($resource['duration'])) {
                        $duration_seconds = intval($resource['duration']) * 60;
                        $section_duration_seconds += $duration_seconds;
                    }
                    
                    // Форматуємо тривалість для відображення
                    $duration_formatted = '';
                    if (!empty($resource['duration'])) {
                        $duration_minutes = intval($resource['duration']);
                        if ($duration_minutes >= 60) {
                            $hours = floor($duration_minutes / 60);
                            $minutes = $duration_minutes % 60;
                            $duration_formatted = $hours . ':' . str_pad($minutes, 2, '0', STR_PAD_LEFT);
                        } else {
                            $duration_formatted = '0:' . str_pad($duration_minutes, 2, '0', STR_PAD_LEFT);
                        }
                    }
                    
                    $lessons[] = array(
                        'id' => $resource['id'],
                        'title' => $resource['title'],
                        'content_type' => $resource['content_type'],
                        'content_url' => $resource['content_url'],
                        'duration' => $duration_formatted,
                        'duration_seconds' => $duration_seconds,
                        'order_number' => $resource['order_number']
                    );
                    
                    $lessons_count++;
                }
            }
            
            $total_duration_seconds += $section_duration_seconds;
            $total_lessons += $lessons_count;
            
            // Форматуємо тривалість розділу
            $section_duration_formatted = '';
            $section_duration_hours = floor($section_duration_seconds / 3600);
            $section_duration_minutes = floor(($section_duration_seconds % 3600) / 60);
            
            if ($section_duration_hours > 0) {
                $section_duration_formatted = $section_duration_hours . ' год ';
            }
            
            if ($section_duration_minutes > 0 || $section_duration_formatted == '') {
                $section_duration_formatted .= $section_duration_minutes . ' хв';
            }
            
            $sections[] = array(
                'id' => $section['id'],
                'title' => $section['title'],
                'description' => $section['description'],
                'order_number' => $section['order_number'],
                'lessons_count' => $lessons_count,
                'duration' => $section_duration_formatted,
                'duration_seconds' => $section_duration_seconds,
                'lessons' => $lessons
            );
        }
    }
    
    // Форматуємо загальну тривалість курсу
    $total_duration_formatted = '';
    $total_duration_hours = floor($total_duration_seconds / 3600);
    $total_duration_minutes = floor(($total_duration_seconds % 3600) / 60);
    
    if ($total_duration_hours > 0) {
        $total_duration_formatted = $total_duration_hours . ' год ';
    }
    
    if ($total_duration_minutes > 0 || $total_duration_formatted == '') {
        $total_duration_formatted .= $total_duration_minutes . ' хв';
    }
    
    // Отримуємо додаткові ресурси курсу з таблиці section_resources
    $additional_resources_sql = "SELECT sr.id, sr.title, sr.resource_type, sr.resource_url 
                                FROM section_resources sr 
                                JOIN course_sections cs ON sr.section_id = cs.id 
                                WHERE cs.course_id = ? AND sr.resource_type = 'document'";
    
    $additional_resources_stmt = $conn->prepare($additional_resources_sql);
    $additional_resources_stmt->bind_param("i", $courseId);
    $additional_resources_stmt->execute();
    $additional_resources_result = $additional_resources_stmt->get_result();
    
    $resources = array();
    if ($additional_resources_result->num_rows > 0) {
        while ($resource = $additional_resources_result->fetch_assoc()) {
            $resources[] = array(
                'id' => $resource['id'],
                'title' => $resource['title'],
                'type' => $resource['resource_type'],
                'url' => $resource['resource_url']
            );
        }
    }
    
    // Формуємо відповідь
    $response = array(
        'title' => $course_data['title'],
        'total_lessons' => $total_lessons,
        'total_duration' => $total_duration_formatted,
        'total_duration_seconds' => $total_duration_seconds,
        'resources' => $resources,
        'sections' => $sections
    );
    
} catch (Exception $e) {
    $response['error'] = 'Помилка: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 