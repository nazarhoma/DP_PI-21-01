<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

require_once 'connect.php';

try {
    // Параметри пагінації
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $per_page = isset($_GET['per_page']) ? max(1, intval($_GET['per_page'])) : 12;
    $offset = ($page - 1) * $per_page;

    // Базова частина запиту
    $base_query = "FROM courses c 
    LEFT JOIN users u ON c.mentor_id = u.id 
    LEFT JOIN difficulty_levels dl ON c.level_id = dl.id
    LEFT JOIN languages l ON c.language_id = l.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE 1=1";
    
    $where_conditions = array();
    
    // Логуємо отримані параметри
    error_log('Received parameters: ' . print_r($_GET, true));

    // Фільтр за тривалістю
    if (isset($_GET['duration']) && $_GET['duration'] != '') {
        $duration = $_GET['duration'];
        error_log('Duration filter: ' . $duration);
        
        if (strpos($duration, '-') !== false) {
            list($min, $max) = explode('-', $duration);
            $min = intval($min);
            $max = intval($max);
            $where_conditions[] = "c.duration_hours BETWEEN $min AND $max";
            error_log("Duration range: $min to $max");
        } else {
            $duration = intval($duration);
            $where_conditions[] = "c.duration_hours = $duration";
            error_log("Single duration: $duration");
        }
    }

    // Фільтр за рейтингом
    if (isset($_GET['rating']) && $_GET['rating'] != '') {
        $rating = floatval($_GET['rating']);
        $where_conditions[] = "(SELECT COALESCE(AVG(rating), 0) FROM course_reviews cr WHERE cr.course_id = c.id) >= $rating";
        error_log("Rating filter: $rating");
    }

    // Фільтр за ціною
    if (isset($_GET['price_min']) && $_GET['price_min'] != '') {
        $price_min = floatval($_GET['price_min']);
        $where_conditions[] = "c.price >= $price_min";
        error_log("Min price: $price_min");
    }
    if (isset($_GET['price_max']) && $_GET['price_max'] != '') {
        $price_max = floatval($_GET['price_max']);
        $where_conditions[] = "c.price <= $price_max";
        error_log("Max price: $price_max");
    }

    // Фільтр за складністю
    if (isset($_GET['difficulty']) && $_GET['difficulty'] != '') {
        $difficulties = array_map('intval', explode(',', $_GET['difficulty']));
        $difficulties_str = implode(',', $difficulties);
        $where_conditions[] = "c.level_id IN ($difficulties_str)";
        error_log('Difficulty filter: ' . $difficulties_str);
    }

    // Фільтр за категоріями
    if (isset($_GET['categories']) && $_GET['categories'] != '') {
        $categories = array_map('intval', explode(',', $_GET['categories']));
        $categories_str = implode(',', $categories);
        $where_conditions[] = "c.category_id IN ($categories_str)";
        error_log('Categories filter: ' . $categories_str);
    }

    // Додаємо умови WHERE до базового запиту
    if (!empty($where_conditions)) {
        $base_query .= " AND " . implode(" AND ", $where_conditions);
    }

    // Запит для отримання загальної кількості
    $count_query = "SELECT COUNT(DISTINCT c.id) as total " . $base_query;
    $count_result = mysqli_query($conn, $count_query);
    if (!$count_result) {
        throw new Exception("Database error (count): " . mysqli_error($conn));
    }
    $total_count = mysqli_fetch_assoc($count_result)['total'];
    mysqli_free_result($count_result);

    // Якщо немає результатів, повертаємо відповідне повідомлення
    if ($total_count == 0) {
        echo json_encode([
            'courses' => [],
            'total' => 0,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => 0,
            'message' => 'Курсів за вказаними критеріями не знайдено'
        ]);
        exit;
    }

    // Основний запит з пагінацією
    $query = "SELECT 
        c.*,
        CONCAT(u.first_name, ' ', u.last_name) as mentor_name,
        u.id as mentor_id,
        dl.name AS level,
        l.name AS language,
        cat.name AS category,
        COALESCE((SELECT COUNT(*) FROM course_reviews cr WHERE cr.course_id = c.id), 0) as reviews_count,
        COALESCE((SELECT AVG(rating) FROM course_reviews cr WHERE cr.course_id = c.id), 0) as rating
        " . $base_query . "
        GROUP BY c.id
        LIMIT $offset, $per_page";

    // Логуємо фінальний запит
    error_log('Final query: ' . $query);

    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception("Database error: " . mysqli_error($conn));
    }
    
    $courses = array();
    while ($row = mysqli_fetch_assoc($result)) {
        // Форматуємо ім'я автора
        $author_name = trim($row['mentor_name']);
        if (empty($author_name)) {
            $author_name = "Невідомий автор";
        }

        // Форматуємо рівень складності
        $level_text = "";
        switch($row['level']) {
            case 'beginner':
                $level_text = "Для початківців";
                break;
            case 'intermediate':
                $level_text = "Середній рівень";
                break;
            case 'advanced':
                $level_text = "Просунутий рівень";
                break;
            default:
                $level_text = "Для всіх рівнів";
        }

        // Формуємо інформацію про курс
        $info = $row['duration_hours'] . " год. " . $level_text;

        // Перевіряємо наявність зображення
        $image = !empty($row['image_url']) ? $row['image_url'] : 'img/default-image-course.png';

        $courses[] = array(
            'id' => $row['id'],
            'title' => $row['title'],
            'author' => $author_name,
            'mentor_id' => $row['mentor_id'],
            'rating' => floatval($row['rating']),
            'reviews' => intval($row['reviews_count']),
            'info' => $info,
            'price' => floatval($row['price']),
            'image' => $image,
            'description' => $row['short_description'],
            'category' => $row['category']
        );
    }

    // Логуємо результат
    error_log('Query result count: ' . count($courses));

    // Повертаємо дані з інформацією про пагінацію
    echo json_encode([
        'courses' => $courses,
        'total' => intval($total_count),
        'page' => $page,
        'per_page' => $per_page,
        'total_pages' => ceil($total_count / $per_page)
    ]);

} catch (Exception $e) {
    error_log('Server error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

if (isset($result)) {
    mysqli_free_result($result);
}
?> 