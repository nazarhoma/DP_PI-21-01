<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

// Виведення помилок
ini_set('display_errors', 1); 
ini_set('display_startup_errors', 1); 
error_reporting(E_ALL);

// Додавання логування помилок
function logError($message) {
    error_log($message, 0);
}

// Встановлюємо менш строгий SQL режим для групування
$conn->query("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

$response = array();
$courses = array();
$instructors = array();

// Перевіряємо, чи передано пошуковий запит
if (!isset($_GET['query']) || empty($_GET['query'])) {
    $response['success'] = false;
    $response['message'] = 'Пошуковий запит не вказано';
    echo json_encode($response);
    exit;
}

$searchQuery = '%' . $conn->real_escape_string($_GET['query']) . '%';
$searchType = isset($_GET['type']) ? $_GET['type'] : 'all'; // Можливі значення: all, courses, instructors

// Розбиваємо пошуковий запит на окремі слова
$searchWords = explode(' ', trim($_GET['query']));
$searchWordQueries = [];
foreach ($searchWords as $word) {
    if (!empty($word)) {
        $searchWordQueries[] = '%' . $conn->real_escape_string($word) . '%';
    }
}

// Якщо масив пошукових слів порожній, додаємо оригінальний запит
if (empty($searchWordQueries)) {
    $searchWordQueries[] = $searchQuery;
}

try {
    // Пошук курсів, якщо тип пошуку 'all' або 'courses'
    if ($searchType == 'all' || $searchType == 'courses') {
        $sql_courses = "SELECT 
                c.id, 
                c.title, 
                c.short_description AS description, 
                c.image_url AS image, 
                c.price, 
                c.duration_hours AS duration, 
                dl.name AS level,
                l.name AS language,
                cat.name AS category,
                u.first_name, 
                u.last_name,
                u.id as mentor_id,
                IFNULL((SELECT AVG(rating) FROM course_reviews WHERE course_id = c.id), 0) as avg_rating,
                IFNULL((SELECT COUNT(*) FROM course_reviews WHERE course_id = c.id), 0) as reviews_count";
        
        // Додаємо розрахунок рейтингу збігів для кожного слова
        if (count($searchWordQueries) > 1) {
            $sql_courses .= ", (";
            $matchCases = [];
            
            // Додаємо найвищий пріоритет для точного збігу з фразою
            $matchCases[] = "CASE 
                WHEN c.title LIKE ? THEN 10
                WHEN c.short_description LIKE ? THEN 6
                WHEN c.long_description LIKE ? THEN 4
                ELSE 0
            END";
            
            foreach ($searchWordQueries as $index => $wordQuery) {
                $matchCases[] = "CASE 
                    WHEN c.title LIKE ? THEN 3
                    WHEN c.short_description LIKE ? THEN 2
                    WHEN c.long_description LIKE ? THEN 1
                    WHEN cat.name LIKE ? THEN 1
                    ELSE 0
                END";
            }
            
            $sql_courses .= implode(" + ", $matchCases);
            $sql_courses .= ") AS match_relevance";
        }
        
        $sql_courses .= " FROM 
                courses c
            LEFT JOIN 
                users u ON c.mentor_id = u.id
            LEFT JOIN
                difficulty_levels dl ON c.level_id = dl.id
            LEFT JOIN
                languages l ON c.language_id = l.id
            LEFT JOIN
                categories cat ON c.category_id = cat.id
            WHERE ";
        
        // Спрощена версія - шукаємо за кожним словом в усіх полях
        $whereConditions = [];
        
        foreach ($searchWordQueries as $index => $wordQuery) {
            $whereConditions[] = "c.title LIKE ? OR 
                                   c.short_description LIKE ? OR 
                                   c.long_description LIKE ? OR 
                                   cat.name LIKE ?";
        }
        
        // Якщо умов немає - додаємо умову пошуку за оригінальним запитом
        if (empty($whereConditions)) {
            $sql_courses .= "c.title LIKE ? OR 
                           c.short_description LIKE ? OR 
                           c.long_description LIKE ? OR 
                           cat.name LIKE ?";
            $params = [$searchQuery, $searchQuery, $searchQuery, $searchQuery];
            $types = 'ssss';
        } else {
            $sql_courses .= "(" . implode(') OR (', $whereConditions) . ")";
            
            // Підготовка параметрів для bind_param
            $types = '';
            $params = [];
            
            // Параметри для рейтингу збігів
            if (count($searchWordQueries) > 1) {
                // Параметри для точного збігу з фразою
                $params[] = $searchQuery;
                $params[] = $searchQuery;
                $params[] = $searchQuery;
                $types .= 'sss';
                
                foreach ($searchWordQueries as $wordQuery) {
                    $params[] = $wordQuery;
                    $params[] = $wordQuery;
                    $params[] = $wordQuery;
                    $params[] = $wordQuery;
                    $types .= 'ssss';
                }
            }
            
            // Параметри для умов WHERE
            foreach ($searchWordQueries as $wordQuery) {
                $types .= 'ssss'; // 4 параметри для кожного слова
                $params[] = $wordQuery;
                $params[] = $wordQuery;
                $params[] = $wordQuery;
                $params[] = $wordQuery;
            }
        }
        
        // Змінюємо сортування для включення релевантності
        if (count($searchWordQueries) > 1) {
            $sql_courses .= " ORDER BY match_relevance DESC, avg_rating DESC, c.id ASC";
        } else {
            $sql_courses .= " ORDER BY avg_rating DESC, c.id ASC";
        }

        $stmt_courses = $conn->prepare($sql_courses);
        
        try {
            // Динамічний bind_param
            if (!empty($params)) {
                // Правильний спосіб використання динамічного bind_param
                if (count($params) > 0) {
                    // Створюємо масив посилань на параметри
                    $bindParams = [];
                    $bindParams[] = $types;
                    
                    for ($i = 0; $i < count($params); $i++) {
                        $bindParams[] = &$params[$i];
                    }
                    
                    call_user_func_array(array($stmt_courses, 'bind_param'), $bindParams);
                    $stmt_courses->execute();
                    $result_courses = $stmt_courses->get_result();
                } else {
                    // Якщо параметрів немає, просто виконуємо запит
                    $stmt_courses->execute();
                    $result_courses = $stmt_courses->get_result();
                }
            }
        } catch (Exception $e) {
            logError("Помилка при виконанні пошуку курсів: " . $e->getMessage());
            logError("SQL: " . $sql_courses);
            logError("Параметри: " . print_r($params, true));
        }

        if ($result_courses->num_rows > 0) {
            while ($row = $result_courses->fetch_assoc()) {
                // Форматуємо ім'я автора
                $author_name = trim($row['first_name'] . ' ' . $row['last_name']);
                if (empty($author_name)) {
                    $author_name = "Невідомий автор";
                }
                
                // Обчислюємо рейтинг
                $rating = $row['avg_rating'] > 0 ? $row['avg_rating'] : 0;
                
                // Форматуємо інформацію про курс
                $info = "{$row['duration']} год. {$row['level']}";
                
                // Перевіряємо наявність зображення
                $image = !empty($row['image']) ? $row['image'] : 'img/default-image-course.png';
                
                $courses[] = array(
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'author' => $author_name,
                    'mentor_id' => $row['mentor_id'],
                    'rating' => floatval($rating),
                    'reviews' => intval($row['reviews_count']),
                    'info' => $info,
                    'price' => floatval($row['price']),
                    'image' => $image,
                    'description' => $row['description'],
                    'category' => $row['category'],
                    'type' => 'course'
                );
            }
        }
    }
    
    // Пошук менторів, якщо тип пошуку 'all' або 'instructors'
    if ($searchType == 'all' || $searchType == 'instructors') {
        $sql_instructors = "SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                u.avatar,
                u.role,
                u.education,
                AVG(cr.rating) as avg_rating,
                COUNT(DISTINCT ce.user_id) as students_count,
                COUNT(DISTINCT c.id) as courses_count";
        
        // Додаємо розрахунок рейтингу збігів для кожного слова
        if (count($searchWordQueries) > 1) {
            $sql_instructors .= ", (";
            $matchCases = [];
            
            // Додаємо пріоритетний збіг для повного імені
            $matchCases[] = "CASE WHEN CONCAT(u.first_name, ' ', u.last_name) LIKE ? THEN 5 ELSE 0 END";
            
            // Додаємо пріоритет для точного збігу з фразою
            $matchCases[] = "CASE 
                WHEN CONCAT(u.first_name, ' ', u.last_name) LIKE ? THEN 10
                WHEN u.first_name LIKE ? THEN 7
                WHEN u.last_name LIKE ? THEN 7
                WHEN u.username LIKE ? THEN 5
                ELSE 0
            END";
            
            foreach ($searchWordQueries as $index => $wordQuery) {
                $matchCases[] = "CASE 
                    WHEN u.first_name LIKE ? THEN 3
                    WHEN u.last_name LIKE ? THEN 3
                    WHEN u.username LIKE ? THEN 2
                    WHEN u.education LIKE ? THEN 1
                    ELSE 0
                END";
            }
            
            $sql_instructors .= implode(" + ", $matchCases);
            $sql_instructors .= ") AS match_relevance";
        }
        
        $sql_instructors .= " FROM 
                users u
            LEFT JOIN 
                courses c ON u.id = c.mentor_id
            LEFT JOIN 
                course_reviews cr ON c.id = cr.course_id
            LEFT JOIN
                course_enrollments ce ON c.id = ce.course_id
            WHERE 
                u.role = 'mentor' AND (";
        
        // Спрощена версія - додаємо пошук за повним ім'ям та окремими словами
        $whereConditions = [];
        $whereConditions[] = "CONCAT(u.first_name, ' ', u.last_name) LIKE ?";
        
        foreach ($searchWordQueries as $wordQuery) {
            $whereConditions[] = "u.first_name LIKE ? OR 
                                 u.last_name LIKE ? OR 
                                 u.username LIKE ? OR 
                                 u.education LIKE ?";
        }
        
        // Якщо умов немає - додаємо умову пошуку за оригінальним запитом
        if (count($whereConditions) <= 1) {
            $sql_instructors .= "CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
                               u.first_name LIKE ? OR 
                               u.last_name LIKE ? OR 
                               u.username LIKE ? OR 
                               u.education LIKE ?";
            $params = [$searchQuery, $searchQuery, $searchQuery, $searchQuery, $searchQuery];
            $types = 'sssss';
        } else {
            $sql_instructors .= implode(' OR ', $whereConditions);
            
            // Параметри для bind_param
            $types = '';
            $params = [];
            
            // Параметри для рейтингу збігів
            if (count($searchWordQueries) > 1) {
                // Параметр для збігу повного імені в CASE
                $params[] = $searchQuery;
                $types .= 's';
                
                // Параметри для точного збігу фрази
                $params[] = $searchQuery;
                $params[] = $searchQuery;
                $params[] = $searchQuery;
                $params[] = $searchQuery;
                $types .= 'ssss';
                
                foreach ($searchWordQueries as $wordQuery) {
                    $params[] = $wordQuery;
                    $params[] = $wordQuery;
                    $params[] = $wordQuery;
                    $params[] = $wordQuery;
                    $types .= 'ssss';
                }
            }
            
            // Параметр для збігу повного імені в WHERE
            $params[] = $searchQuery;
            $types .= 's';
            
            // Параметри для кожного слова в WHERE
            foreach ($searchWordQueries as $wordQuery) {
                $types .= 'ssss';
                $params[] = $wordQuery;
                $params[] = $wordQuery;
                $params[] = $wordQuery;
                $params[] = $wordQuery;
            }
        }
        
        $sql_instructors .= ") GROUP BY 
                u.id, u.first_name, u.last_name, u.username, u.avatar, u.role, u.education";
        
        // Змінюємо сортування для включення релевантності
        if (count($searchWordQueries) > 1) {
            $sql_instructors .= " ORDER BY match_relevance DESC, avg_rating DESC, students_count DESC";
        } else {
            $sql_instructors .= " ORDER BY avg_rating DESC, students_count DESC";
        }

        $stmt_instructors = $conn->prepare($sql_instructors);
        
        try {
            // Динамічний bind_param
            if (!empty($params)) {
                // Правильний спосіб використання динамічного bind_param
                if (count($params) > 0) {
                    // Створюємо масив посилань на параметри
                    $bindParams = [];
                    $bindParams[] = $types;
                    
                    for ($i = 0; $i < count($params); $i++) {
                        $bindParams[] = &$params[$i];
                    }
                    
                    call_user_func_array(array($stmt_instructors, 'bind_param'), $bindParams);
                    $stmt_instructors->execute();
                    $result_instructors = $stmt_instructors->get_result();
                } else {
                    // Якщо параметрів немає, просто виконуємо запит
                    $stmt_instructors->execute();
                    $result_instructors = $stmt_instructors->get_result();
                }
            }
        } catch (Exception $e) {
            logError("Помилка при виконанні пошуку інструкторів: " . $e->getMessage());
            logError("SQL: " . $sql_instructors);
            logError("Параметри: " . print_r($params, true));
        }

        if ($result_instructors->num_rows > 0) {
            while ($row = $result_instructors->fetch_assoc()) {
                // Форматуємо дані для відповідності формату JSON, який очікує фронтенд
                $name = trim($row['first_name'] . ' ' . $row['last_name']);
                if (empty($name)) {
                    $name = $row['username'] ?: "Невідомий інструктор";
                }
                
                $image = !empty($row['avatar']) ? $row['avatar'] : 'img/avatars/default-avatar.png';
                $rating = $row['avg_rating'] > 0 ? round($row['avg_rating'], 1) : 0;
                $students = $row['students_count'] > 0 ? $row['students_count'] : 0;
                
                $instructors[] = array(
                    'id' => $row['id'],
                    'name' => $name,
                    'role' => "Інструктор",
                    'rating' => floatval($rating),
                    'students' => intval($students),
                    'courses_count' => intval($row['courses_count']),
                    'image' => $image,
                    'education' => $row['education'],
                    'type' => 'instructor'
                );
            }
        }
    }
    
    // Формуємо відповідь
    $response['success'] = true;
    $response['courses'] = $courses;
    $response['instructors'] = $instructors;
    $response['total_courses'] = count($courses);
    $response['total_instructors'] = count($instructors);
    $response['query'] = trim($_GET['query']);
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = "Помилка: " . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 