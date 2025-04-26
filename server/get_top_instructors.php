<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'connect.php';

$response = array();
$instructors = array();

try {
    // Запит для отримання топ-5 інструкторів з найвищим середнім рейтингом їхніх курсів
    $sql = "SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                u.avatar,
                u.role,
                AVG(cr.rating) as avg_rating,
                COUNT(DISTINCT ce.user_id) as students_count
            FROM 
                users u
            JOIN 
                courses c ON u.id = c.mentor_id
            LEFT JOIN 
                course_reviews cr ON c.id = cr.course_id
            LEFT JOIN
                course_enrollments ce ON c.id = ce.course_id
            WHERE 
                u.role = 'mentor'
            GROUP BY 
                u.id, u.first_name, u.last_name, u.username, u.avatar, u.role
            HAVING 
                AVG(cr.rating) IS NOT NULL
            ORDER BY 
                avg_rating DESC, 
                students_count DESC
            LIMIT 5";

    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Форматуємо дані для відповідності формату JSON, який очікує фронтенд
            $name = trim($row['first_name'] . ' ' . $row['last_name']);
            if (empty($name)) {
                $name = $row['username'] ?: "Невідомий інструктор";
            }

            // Визначаємо роль
            $role = "Інструктор";
            
            // Перевіряємо наявність аватару
            $image = !empty($row['avatar']) ? $row['avatar'] : 'img/instructor.png';

            // Округляємо рейтинг до одного десяткового знаку
            $rating = round($row['avg_rating'], 1);
            // Переконуємося, що рейтинг не більше 5
            if ($rating > 5) $rating = 5;

            // Кількість студентів
            $students = intval($row['students_count']);
            if ($students < 1) $students = 0; // Мінімальне значення, якщо немає студентів

            $instructors[] = array(
                'id' => $row['id'],
                'name' => $name,
                'role' => $role,
                'rating' => $rating,
                'students' => $students,
                'image' => $image
            );
        }
        $response['success'] = true;
        $response['instructors'] = $instructors;
    } else {
        // Якщо немає інструкторів з рейтингом, спробуємо отримати будь-яких менторів
        $sql_alt = "SELECT 
                        u.id,
                        u.first_name,
                        u.last_name,
                        u.username,
                        u.avatar,
                        u.role
                    FROM 
                        users u
                    WHERE 
                        u.role = 'mentor'
                    LIMIT 5";
        
        $result_alt = $conn->query($sql_alt);
        
        if ($result_alt->num_rows > 0) {
            while ($row = $result_alt->fetch_assoc()) {
                $name = trim($row['first_name'] . ' ' . $row['last_name']);
                if (empty($name)) {
                    $name = $row['username'] ?: "Невідомий інструктор";
                }
                
                $image = !empty($row['avatar']) ? $row['avatar'] : 'img/instructor.png';
                
                $instructors[] = array(
                    'id' => $row['id'],
                    'name' => $name,
                    'role' => "Інструктор",
                    'rating' => 0, // Значення за замовчуванням
                    'students' => 0, // Значення за замовчуванням
                    'image' => $image
                );
            }
            $response['success'] = true;
            $response['instructors'] = $instructors;
        } else {
            $response['success'] = false;
            $response['message'] = "Інструкторів не знайдено";
        }
    }
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = "Помилка: " . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?> 