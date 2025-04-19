<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

$response = array();
$courses = array();

try {
    // Запит для отримання всіх курсів з інформацією про авторів та середнім рейтингом
    $sql = "SELECT 
                c.id, 
                c.title, 
                c.description, 
                c.image, 
                c.price, 
                c.duration, 
                c.level, 
                c.language, 
                c.category,
                u.first_name, 
                u.last_name,
                u.id as mentor_id,
                IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as avg_rating,
                IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count
            FROM 
                courses c
            LEFT JOIN 
                users u ON c.mentor_id = u.id
            ORDER BY 
                c.id ASC";

    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Форматуємо дані для відповідності формату JSON, який очікує фронтенд
            $author_name = trim($row['first_name'] . ' ' . $row['last_name']);
            if (empty($author_name)) {
                $author_name = "Невідомий автор";
            }

            // Формування рядка з інформацією про курс
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

            $info = $row['duration'] . ". " . $level_text;

            // Перевіряємо наявність зображення
            $image = !empty($row['image']) ? $row['image'] : 'img/default-image-course.png';

            // Округляємо рейтинг до цілого числа для відображення зірок
            $rating = round($row['avg_rating']);
            if ($rating < 1) $rating = 1;
            if ($rating > 5) $rating = 5;

            $courses[] = array(
                'id' => $row['id'],
                'title' => $row['title'],
                'author' => $author_name,
                'mentor_id' => $row['mentor_id'],
                'rating' => $rating,
                'reviews' => $row['reviews_count'],
                'info' => $info,
                'price' => floatval($row['price']),
                'image' => $image,
                'description' => $row['description'],
                'category' => $row['category']
            );
        }
        $response['success'] = true;
        $response['courses'] = $courses;
    } else {
        $response['success'] = false;
        $response['message'] = "Курси не знайдено";
    }
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = "Помилка: " . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 