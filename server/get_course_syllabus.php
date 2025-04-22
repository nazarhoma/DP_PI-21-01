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
    $course_sql = "SELECT title, resources_files FROM courses WHERE id = ?";
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
    $sections_sql = "SELECT id, title, description, order_number 
                    FROM course_sections 
                    WHERE course_id = ? 
                    ORDER BY order_number ASC";
    
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
            
            // Запит для отримання уроків розділу
            $lessons_sql = "SELECT id, title, content_type, content_url, duration, order_number 
                           FROM course_lessons 
                           WHERE section_id = ? 
                           ORDER BY order_number ASC";
            
            $lessons_stmt = $conn->prepare($lessons_sql);
            $lessons_stmt->bind_param("i", $section_id);
            $lessons_stmt->execute();
            $lessons_result = $lessons_stmt->get_result();
            
            $lessons = array();
            $section_duration_seconds = 0;
            $lessons_count = 0;
            
            if ($lessons_result->num_rows > 0) {
                while ($lesson = $lessons_result->fetch_assoc()) {
                    // Перетворюємо тривалість уроку з формату "mm:ss" в секунди
                    $duration_seconds = 0;
                    if (!empty($lesson['duration'])) {
                        $duration_parts = explode(':', $lesson['duration']);
                        if (count($duration_parts) == 2) {
                            $duration_seconds = intval($duration_parts[0]) * 60 + intval($duration_parts[1]);
                        } elseif (count($duration_parts) == 3) {
                            $duration_seconds = intval($duration_parts[0]) * 3600 + intval($duration_parts[1]) * 60 + intval($duration_parts[2]);
                        }
                        $section_duration_seconds += $duration_seconds;
                    }
                    
                    $lessons[] = array(
                        'id' => $lesson['id'],
                        'title' => $lesson['title'],
                        'content_type' => $lesson['content_type'],
                        'content_url' => $lesson['content_url'],
                        'duration' => $lesson['duration'],
                        'duration_seconds' => $duration_seconds,
                        'order_number' => $lesson['order_number']
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
    
    // Парсимо ресурси курсу, якщо вони є
    $resources = array();
    if (!empty($course_data['resources_files'])) {
        $resources = json_decode($course_data['resources_files'], true);
        
        // Якщо json_decode поверне null, значить формат неправильний - створюємо порожній масив
        if ($resources === null) {
            $resources = array();
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