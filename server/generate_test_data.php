<?php
// Параметри підключення до бази даних
$host = 'localhost';
$dbname = 'users';
$username = 'root';
$password = '';

try {
    // Підключення до бази даних через PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Підключення до бази даних успішне.<br>";

    // Початок транзакції
    $pdo->beginTransaction();

    // Додавання нових менторів (разом з наявними буде 10)
    // Спочатку створимо масив з даними менторів
    $mentors = [
        ['username' => 'olena_teacher', 'email' => 'olena@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Олена', 'last_name' => 'Петренко', 'gender' => 'female', 'age' => 35, 'education' => 'Київський національний університет', 'native_language' => 'Українська'],
        ['username' => 'petro_coder', 'email' => 'petro@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Петро', 'last_name' => 'Коваленко', 'gender' => 'male', 'age' => 42, 'education' => 'Національний технічний університет', 'native_language' => 'Українська'],
        ['username' => 'maria_eng', 'email' => 'maria@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Марія', 'last_name' => 'Іваненко', 'gender' => 'female', 'age' => 28, 'education' => 'Львівський національний університет', 'native_language' => 'Українська'],
        ['username' => 'alex_coach', 'email' => 'alex@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Олександр', 'last_name' => 'Сидоренко', 'gender' => 'male', 'age' => 39, 'education' => 'Харківський національний університет', 'native_language' => 'Українська'],
        ['username' => 'julia_dev', 'email' => 'julia@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Юлія', 'last_name' => 'Мельник', 'gender' => 'female', 'age' => 31, 'education' => 'Одеський національний університет', 'native_language' => 'Українська'],
        ['username' => 'taras_tutor', 'email' => 'taras@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Тарас', 'last_name' => 'Шевчук', 'gender' => 'male', 'age' => 45, 'education' => 'Чернівецький національний університет', 'native_language' => 'Українська'],
        ['username' => 'natalia_prof', 'email' => 'natalia@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Наталія', 'last_name' => 'Бондаренко', 'gender' => 'female', 'age' => 37, 'education' => 'Дніпровський національний університет', 'native_language' => 'Українська'],
        ['username' => 'andriy_expert', 'email' => 'andriy@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Андрій', 'last_name' => 'Ткаченко', 'gender' => 'male', 'age' => 33, 'education' => 'Національний університет Києво-Могилянська академія', 'native_language' => 'Українська'],
        ['username' => 'oksana_guide', 'email' => 'oksana@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Оксана', 'last_name' => 'Литвин', 'gender' => 'female', 'age' => 29, 'education' => 'Тернопільський національний університет', 'native_language' => 'Українська']
    ];

    $mentor_ids = [2]; // Додаємо вже існуючого ментора з ID 2
    $sql = "INSERT INTO users (username, email, password, role, first_name, last_name, gender, age, education, native_language) VALUES (:username, :email, :password, 'mentor', :first_name, :last_name, :gender, :age, :education, :native_language)";
    $stmt = $pdo->prepare($sql);

    foreach ($mentors as $mentor) {
        $stmt->execute([
            ':username' => $mentor['username'],
            ':email' => $mentor['email'],
            ':password' => $mentor['password'],
            ':first_name' => $mentor['first_name'],
            ':last_name' => $mentor['last_name'],
            ':gender' => $mentor['gender'],
            ':age' => $mentor['age'],
            ':education' => $mentor['education'],
            ':native_language' => $mentor['native_language']
        ]);
        $mentor_ids[] = $pdo->lastInsertId();
    }
    echo "Додано " . count($mentors) . " нових менторів.<br>";

    // Додавання нових студентів (разом з наявними буде 20+)
    // Створюємо масив з даними студентів
    $students = [
        ['username' => 'sofia_student', 'email' => 'sofia@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Софія', 'last_name' => 'Морозова', 'gender' => 'female', 'age' => 22, 'education' => 'Середня освіта', 'native_language' => 'Українська'],
        ['username' => 'maksym_learner', 'email' => 'maksym@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Максим', 'last_name' => 'Кравченко', 'gender' => 'male', 'age' => 19, 'education' => 'Коледж', 'native_language' => 'Українська'],
        ['username' => 'anna_beginner', 'email' => 'anna@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Анна', 'last_name' => 'Білоус', 'gender' => 'female', 'age' => 25, 'education' => 'Бакалавр', 'native_language' => 'Українська'],
        ['username' => 'dmytro_newbie', 'email' => 'dmytro@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Дмитро', 'last_name' => 'Лисенко', 'gender' => 'male', 'age' => 27, 'education' => 'Магістр', 'native_language' => 'Українська'],
        ['username' => 'vika_student', 'email' => 'vika@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Вікторія', 'last_name' => 'Пономаренко', 'gender' => 'female', 'age' => 20, 'education' => 'Коледж', 'native_language' => 'Українська'],
        ['username' => 'oleg_curious', 'email' => 'oleg@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Олег', 'last_name' => 'Захарченко', 'gender' => 'male', 'age' => 31, 'education' => 'Бакалавр', 'native_language' => 'Українська'],
        ['username' => 'iryna_ready', 'email' => 'iryna@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Ірина', 'last_name' => 'Кузьменко', 'gender' => 'female', 'age' => 24, 'education' => 'Бакалавр', 'native_language' => 'Українська'],
        ['username' => 'vadym_seeker', 'email' => 'vadym@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Вадим', 'last_name' => 'Ткачук', 'gender' => 'male', 'age' => 26, 'education' => 'Магістр', 'native_language' => 'Українська'],
        ['username' => 'katya_learn', 'email' => 'katya@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Катерина', 'last_name' => 'Василенко', 'gender' => 'female', 'age' => 23, 'education' => 'Бакалавр', 'native_language' => 'Українська'],
        ['username' => 'roman_study', 'email' => 'roman@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Роман', 'last_name' => 'Данилюк', 'gender' => 'male', 'age' => 29, 'education' => 'Магістр', 'native_language' => 'Українська'],
        ['username' => 'tetiana_keen', 'email' => 'tetiana@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Тетяна', 'last_name' => 'Бойко', 'gender' => 'female', 'age' => 21, 'education' => 'Коледж', 'native_language' => 'Українська'],
        ['username' => 'yuriy_progress', 'email' => 'yuriy@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Юрій', 'last_name' => 'Савченко', 'gender' => 'male', 'age' => 28, 'education' => 'Бакалавр', 'native_language' => 'Українська'],
        ['username' => 'ludmyla_pupil', 'email' => 'ludmyla@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Людмила', 'last_name' => 'Руденко', 'gender' => 'female', 'age' => 30, 'education' => 'Магістр', 'native_language' => 'Українська'],
        ['username' => 'pavlo_scholar', 'email' => 'pavlo@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Павло', 'last_name' => 'Марченко', 'gender' => 'male', 'age' => 22, 'education' => 'Бакалавр', 'native_language' => 'Українська'],
        ['username' => 'svitlana_trainee', 'email' => 'svitlana@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Світлана', 'last_name' => 'Левченко', 'gender' => 'female', 'age' => 25, 'education' => 'Бакалавр', 'native_language' => 'Українська'],
        ['username' => 'mykola_academic', 'email' => 'mykola@example.com', 'password' => password_hash('password123', PASSWORD_DEFAULT), 'first_name' => 'Микола', 'last_name' => 'Дмитренко', 'gender' => 'male', 'age' => 24, 'education' => 'Коледж', 'native_language' => 'Українська']
    ];

    $student_ids = [1, 3, 4, 5]; // Додаємо вже існуючих студентів з ID 1, 3, 4, 5
    $sql = "INSERT INTO users (username, email, password, role, first_name, last_name, gender, age, education, native_language) VALUES (:username, :email, :password, 'student', :first_name, :last_name, :gender, :age, :education, :native_language)";
    $stmt = $pdo->prepare($sql);

    foreach ($students as $student) {
        $stmt->execute([
            ':username' => $student['username'],
            ':email' => $student['email'],
            ':password' => $student['password'],
            ':first_name' => $student['first_name'],
            ':last_name' => $student['last_name'],
            ':gender' => $student['gender'],
            ':age' => $student['age'],
            ':education' => $student['education'],
            ':native_language' => $student['native_language']
        ]);
        $student_ids[] = $pdo->lastInsertId();
    }
    echo "Додано " . count($students) . " нових студентів.<br>";

    // Масив з новими курсами (додамо 20 нових до 10 існуючих)
    $categories = ['Програмування', 'Веб-розробка', 'Дизайн', 'Маркетинг', 'Бізнес', 'Мови', 'Математика', 'Фізика', 'Хімія', 'Біологія', 'Історія', 'Музика', 'Мистецтво'];
    $levels = ['beginner', 'intermediate', 'advanced'];
    $languages = ['Українська', 'Англійська'];

    $courses = [
        ['title' => 'React.js для початківців', 'description' => 'Вивчення основ бібліотеки React.js для створення інтерактивних веб-інтерфейсів.', 'image' => 'img/default-image-course.png', 'price' => 359.99, 'duration' => '8 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Веб-розробка'],
        ['title' => 'Node.js та Express', 'description' => 'Створення серверної частини веб-додатків з використанням Node.js та фреймворку Express.', 'image' => 'img/default-image-course.png', 'price' => 329.99, 'duration' => '6 тижнів', 'level' => 'intermediate', 'language' => 'Українська', 'category' => 'Веб-розробка'],
        ['title' => 'Основи C++', 'description' => 'Вивчення мови програмування C++ з нуля до рівня впевненого користувача.', 'image' => 'img/default-image-course.png', 'price' => 279.99, 'duration' => '10 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Програмування'],
        ['title' => 'Алгоритми та структури даних', 'description' => 'Поглиблене вивчення алгоритмів та структур даних для оптимізації програм.', 'image' => 'img/default-image-course.png', 'price' => 389.99, 'duration' => '12 тижнів', 'level' => 'advanced', 'language' => 'Українська', 'category' => 'Програмування'],
        ['title' => 'Photoshop для дизайнерів', 'description' => 'Практичний курс роботи з Adobe Photoshop для створення професійних дизайнів.', 'image' => 'img/default-image-course.png', 'price' => 269.99, 'duration' => '6 тижнів', 'level' => 'intermediate', 'language' => 'Українська', 'category' => 'Дизайн'],
        ['title' => 'Основи 3D моделювання', 'description' => 'Курс з основ 3D моделювання за допомогою Blender для початківців.', 'image' => 'img/default-image-course.png', 'price' => 319.99, 'duration' => '8 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Дизайн'],
        ['title' => 'Цифровий маркетинг', 'description' => 'Повний курс з цифрового маркетингу, включаючи SEO, SMM та email-маркетинг.', 'image' => 'img/default-image-course.png', 'price' => 349.99, 'duration' => '10 тижнів', 'level' => 'intermediate', 'language' => 'Українська', 'category' => 'Маркетинг'],
        ['title' => 'Контент-маркетинг', 'description' => 'Створення ефективного контенту для просування бізнесу в інтернеті.', 'image' => 'img/default-image-course.png', 'price' => 249.99, 'duration' => '6 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Маркетинг'],
        ['title' => 'Стартап від А до Я', 'description' => 'Як створити успішний стартап з нуля та залучити інвестиції.', 'image' => 'img/default-image-course.png', 'price' => 399.99, 'duration' => '12 тижнів', 'level' => 'intermediate', 'language' => 'Українська', 'category' => 'Бізнес'],
        ['title' => 'Фінансова грамотність', 'description' => 'Основи управління особистими фінансами та інвестування.', 'image' => 'img/default-image-course.png', 'price' => 229.99, 'duration' => '8 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Бізнес'],
        ['title' => 'Німецька мова для початківців', 'description' => 'Курс німецької мови для тих, хто починає вивчення з нуля.', 'image' => 'img/default-image-course.png', 'price' => 219.99, 'duration' => '16 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Мови'],
        ['title' => 'Польська мова', 'description' => 'Інтенсивний курс польської мови для швидкого опанування.', 'image' => 'img/default-image-course.png', 'price' => 199.99, 'duration' => '12 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Мови'],
        ['title' => 'Вища математика', 'description' => 'Комплексний курс з вищої математики для студентів технічних спеціальностей.', 'image' => 'img/default-image-course.png', 'price' => 349.99, 'duration' => '16 тижнів', 'level' => 'advanced', 'language' => 'Українська', 'category' => 'Математика'],
        ['title' => 'Фізика для інженерів', 'description' => 'Прикладний курс фізики для майбутніх інженерів та технічних спеціалістів.', 'image' => 'img/default-image-course.png', 'price' => 329.99, 'duration' => '14 тижнів', 'level' => 'intermediate', 'language' => 'Українська', 'category' => 'Фізика'],
        ['title' => 'Основи хімії', 'description' => 'Базовий курс з хімії, який охоплює основні розділи органічної та неорганічної хімії.', 'image' => 'img/default-image-course.png', 'price' => 259.99, 'duration' => '10 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Хімія'],
        ['title' => 'Біологія людини', 'description' => 'Докладний курс з анатомії та фізіології людини.', 'image' => 'img/default-image-course.png', 'price' => 279.99, 'duration' => '12 тижнів', 'level' => 'intermediate', 'language' => 'Українська', 'category' => 'Біологія'],
        ['title' => 'Історія України', 'description' => 'Повний курс з історії України від найдавніших часів до сьогодення.', 'image' => 'img/default-image-course.png', 'price' => 199.99, 'duration' => '14 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Історія'],
        ['title' => 'Гра на гітарі', 'description' => 'Курс гри на гітарі для початківців. Техніка, акорди, пісні.', 'image' => 'img/default-image-course.png', 'price' => 179.99, 'duration' => '8 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Музика'],
        ['title' => 'Живопис олійними фарбами', 'description' => 'Техніки та прийоми живопису олійними фарбами для початківців.', 'image' => 'img/default-image-course.png', 'price' => 229.99, 'duration' => '10 тижнів', 'level' => 'beginner', 'language' => 'Українська', 'category' => 'Мистецтво'],
        ['title' => 'Data Science з Python', 'description' => 'Використання Python для аналізу даних, машинного навчання та візуалізації.', 'image' => 'img/default-image-course.png', 'price' => 399.99, 'duration' => '12 тижнів', 'level' => 'intermediate', 'language' => 'Українська', 'category' => 'Програмування']
    ];

    // Додаємо нові курси
    $course_ids = range(1, 10); // Додаємо вже існуючі курси з ID 1-10
    $new_course_ids = [];
    $sql = "INSERT INTO courses (title, description, image, mentor_id, price, duration, level, language, category) VALUES (:title, :description, :image, :mentor_id, :price, :duration, :level, :language, :category)";
    $stmt = $pdo->prepare($sql);

    foreach ($courses as $course) {
        // Випадково обираємо ментора або залишаємо NULL (для 1-2 менторів)
        $mentor_id = rand(0, 10) < 9 ? $mentor_ids[array_rand($mentor_ids)] : NULL;
        
        $stmt->execute([
            ':title' => $course['title'],
            ':description' => $course['description'],
            ':image' => $course['image'],
            ':mentor_id' => $mentor_id,
            ':price' => $course['price'],
            ':duration' => $course['duration'],
            ':level' => $course['level'],
            ':language' => $course['language'],
            ':category' => $course['category']
        ]);
        $new_course_id = $pdo->lastInsertId();
        $new_course_ids[] = $new_course_id;
        $course_ids[] = $new_course_id;
    }
    echo "Додано " . count($courses) . " нових курсів.<br>";

    // Додавання записів до course_enrollments
    // Масив для зберігання зв'язків студент-курс
    $enrollments = [];
    
    // Додаємо записи для студентів
    foreach ($student_ids as $student_id) {
        // Кожен студент записується на 3-7 курсів
        $num_enrollments = rand(3, 7);
        $enrolled_courses = array_rand(array_flip($course_ids), $num_enrollments);
        
        if (!is_array($enrolled_courses)) {
            $enrolled_courses = [$enrolled_courses];
        }
        
        foreach ($enrolled_courses as $course_id) {
            $enrollments[] = [
                'user_id' => $student_id,
                'course_id' => $course_id,
                'status' => array_rand(['active' => 1, 'completed' => 1, 'dropped' => 1]),
                'progress' => rand(0, 100)
            ];
        }
    }
    
    // Додаємо записи для деяких менторів (вони також можуть навчатися)
    foreach ($mentor_ids as $mentor_id) {
        // 50% шанс, що ментор також навчається на 1-3 курсах
        if (rand(0, 1) == 1) {
            $num_enrollments = rand(1, 3);
            $enrolled_courses = array_rand(array_flip($course_ids), $num_enrollments);
            
            if (!is_array($enrolled_courses)) {
                $enrolled_courses = [$enrolled_courses];
            }
            
            foreach ($enrolled_courses as $course_id) {
                $enrollments[] = [
                    'user_id' => $mentor_id,
                    'course_id' => $course_id,
                    'status' => array_rand(['active' => 1, 'completed' => 1]),
                    'progress' => rand(30, 100)
                ];
            }
        }
    }
    
    // Виконуємо запити для додавання записів у course_enrollments
    $sql = "INSERT INTO course_enrollments (user_id, course_id, status, progress) VALUES (:user_id, :course_id, :status, :progress)";
    $stmt = $pdo->prepare($sql);
    
    foreach ($enrollments as $enrollment) {
        $stmt->execute([
            ':user_id' => $enrollment['user_id'],
            ':course_id' => $enrollment['course_id'],
            ':status' => $enrollment['status'],
            ':progress' => $enrollment['progress']
        ]);
    }
    echo "Додано " . count($enrollments) . " записів про зарахування на курси.<br>";

    // Додавання відгуків
    // Можливі тексти відгуків
    $review_texts = [
        'Чудовий курс! Дуже задоволений вивченим матеріалом.',
        'Гарний курс, багато цікавої інформації. Рекомендую всім!',
        'Курс непоганий, але деякі теми розкриті недостатньо глибоко.',
        'Дуже корисний матеріал. Викладач пояснює чітко і зрозуміло.',
        'Найкращий курс, який я проходив! Дякую за чудовий досвід.',
        'Непоганий курс, але хотілося б більше практичних завдань.',
        'Курс виправдав мої очікування. Отримав багато нових знань.',
        'Викладач дуже добре пояснює складні теми. Задоволений курсом.',
        'Матеріал викладений доступно, є багато прикладів. Рекомендую!',
        'Цей курс змінив моє уявлення про предмет. Дуже вдячний викладачу!',
        'Шкода, що не знайшов цей курс раніше! Дуже корисна інформація.',
        'Курс добре структурований, все пояснюється на простих прикладах.',
        'Матеріал цікавий, але іноді занадто складний для новачків.',
        'Дуже практичний курс, багато реальних прикладів з життя.',
        'Відмінний курс для тих, хто хоче швидко освоїти цю тему.',
        'Інформація подається дуже доступно і зрозуміло.',
        'Трохи розчарований курсом, очікував більшого.',
        'Хороший вступний курс, дає базові знання з предмету.',
        'Курс допоміг мені значно покращити свої навички.',
        'Дуже детальний курс, навіть не очікував такого обсягу інформації!'
    ];

    // Додаємо відгуки (всього має бути біля 30, у нас вже є 12)
    $reviews = [];
    
    // Ми будемо додавати відгуки лише для тих, хто записаний на курс
    foreach ($enrollments as $enrollment) {
        // 30% шанс, що користувач залишив відгук після проходження курсу
        if (rand(1, 100) <= 30) {
            $reviews[] = [
                'user_id' => $enrollment['user_id'],
                'course_id' => $enrollment['course_id'],
                'rating' => rand(3, 5), // Оцінки від 3 до 5
                'review_text' => $review_texts[array_rand($review_texts)]
            ];
        }
    }
    
    // Обмежуємо кількість нових відгуків до 18 (щоб разом з існуючими було близько 30)
    shuffle($reviews);
    $reviews = array_slice($reviews, 0, 18);
    
    // Виконуємо запити для додавання відгуків
    $sql = "INSERT INTO course_reviews (user_id, course_id, rating, review_text) VALUES (:user_id, :course_id, :rating, :review_text)";
    $stmt = $pdo->prepare($sql);
    
    foreach ($reviews as $review) {
        $stmt->execute([
            ':user_id' => $review['user_id'],
            ':course_id' => $review['course_id'],
            ':rating' => $review['rating'],
            ':review_text' => $review['review_text']
        ]);
    }
    echo "Додано " . count($reviews) . " нових відгуків.<br>";

    // Завершення транзакції
    $pdo->commit();
    echo "Всі дані успішно додано до бази даних.";
} catch (PDOException $e) {
    // У разі помилки скасовуємо транзакцію
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Помилка: " . $e->getMessage();
}
?> 