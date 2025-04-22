<?php
require_once 'includes/header.php';
require_once 'includes/db.php';

// Отримуємо ID курсу з URL
$course_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($course_id <= 0) {
    echo '<div class="container error-container"><p>Курс не знайдено</p></div>';
    require_once 'includes/footer.php';
    exit;
}

// Отримуємо дані курсу
$stmt = $conn->prepare("SELECT * FROM courses WHERE id = ?");
$stmt->bind_param("i", $course_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo '<div class="container error-container"><p>Курс не знайдено</p></div>';
    require_once 'includes/footer.php';
    exit;
}

$course = $result->fetch_assoc();
?>

<div class="course-header-container">
    <div class="container">
        <div class="course-header">
            <div class="course-header-info">
                <h1 class="course-title"><?php echo htmlspecialchars($course['title']); ?></h1>
                <p class="course-description"><?php echo htmlspecialchars($course['description']); ?></p>
                <div class="course-meta">
                    <div class="course-author">
                        <i class="fas fa-user"></i>
                        <span>Викладач: <?php echo htmlspecialchars($course['instructor']); ?></span>
                    </div>
                    <div class="course-category">
                        <i class="fas fa-tag"></i>
                        <span>Категорія: <?php echo htmlspecialchars($course['category']); ?></span>
                    </div>
                </div>
            </div>
            <div class="course-header-image">
                <img src="<?php echo htmlspecialchars($course['image_url']); ?>" alt="<?php echo htmlspecialchars($course['title']); ?>">
            </div>
        </div>
    </div>
</div>

<div class="container">
    <div class="course-content">
        <div class="course-tabs">
            <div class="tabs-nav">
                <button class="tab-btn active" data-tab="tab-syllabus">Навчальний план</button>
                <button class="tab-btn" data-tab="tab-resources">Ресурси</button>
                <button class="tab-btn" data-tab="tab-info">Про курс</button>
                <button class="tab-btn" data-tab="tab-reviews">Відгуки</button>
            </div>

            <div class="tab-content">
                <!-- Вкладка з навчальним планом -->
                <div id="tab-syllabus" class="tab-pane active">
                    <div class="course-syllabus">
                        <div class="syllabus-overview">
                            <h3>Огляд курсу</h3>
                            <div class="syllabus-stats">
                                <div class="syllabus-stat sections-count">
                                    <div class="stat-icon"><i class="fas fa-book-open"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-label">Розділів</div>
                                        <div class="stat-value">0</div>
                                    </div>
                                </div>
                                <div class="syllabus-stat lessons-count">
                                    <div class="stat-icon"><i class="fas fa-graduation-cap"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-label">Уроків</div>
                                        <div class="stat-value">0</div>
                                    </div>
                                </div>
                                <div class="syllabus-stat total-duration">
                                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                                    <div class="stat-info">
                                        <div class="stat-label">Тривалість</div>
                                        <div class="stat-value">0г 0хв</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="syllabus-content" class="syllabus-content">
                            <div class="loading-indicator">
                                <div class="spinner"></div>
                                <p>Завантаження навчального плану...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Вкладка з ресурсами курсу -->
                <div id="tab-resources" class="tab-pane">
                    <div class="course-resources">
                        <h3>Матеріали курсу</h3>
                        <p class="resources-description">Тут ви знайдете всі додаткові матеріали для навчання: презентації, документи, корисні посилання та інше.</p>
                        <div id="course-resources-list" class="resources-list">
                            <div class="loading-indicator">
                                <div class="spinner"></div>
                                <p>Завантаження ресурсів...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Вкладка з інформацією про курс -->
                <div id="tab-info" class="tab-pane">
                    <div class="course-info">
                        <h3>Деталі курсу</h3>
                        <div class="info-container">
                            <div class="info-section">
                                <h4>Опис курсу</h4>
                                <div class="course-full-description">
                                    <?php echo $course['full_description'] ?? $course['description']; ?>
                                </div>
                            </div>
                            
                            <div class="info-section">
                                <h4>Чому варто обрати цей курс</h4>
                                <ul class="course-features">
                                    <?php 
                                    $features = json_decode($course['features'] ?? '[]', true);
                                    if (is_array($features) && count($features) > 0) {
                                        foreach ($features as $feature) {
                                            echo '<li><i class="fas fa-check"></i> ' . htmlspecialchars($feature) . '</li>';
                                        }
                                    } else {
                                        echo '<li>Інформація про переваги курсу ще не додана</li>';
                                    }
                                    ?>
                                </ul>
                            </div>
                            
                            <div class="info-section">
                                <h4>Вимоги до курсу</h4>
                                <ul class="course-requirements">
                                    <?php 
                                    $requirements = json_decode($course['requirements'] ?? '[]', true);
                                    if (is_array($requirements) && count($requirements) > 0) {
                                        foreach ($requirements as $requirement) {
                                            echo '<li><i class="fas fa-info-circle"></i> ' . htmlspecialchars($requirement) . '</li>';
                                        }
                                    } else {
                                        echo '<li>Немає особливих вимог</li>';
                                    }
                                    ?>
                                </ul>
                            </div>
                            
                            <div class="info-section">
                                <h4>Для кого цей курс</h4>
                                <ul class="course-target-audience">
                                    <?php 
                                    $audience = json_decode($course['target_audience'] ?? '[]', true);
                                    if (is_array($audience) && count($audience) > 0) {
                                        foreach ($audience as $item) {
                                            echo '<li><i class="fas fa-user-graduate"></i> ' . htmlspecialchars($item) . '</li>';
                                        }
                                    } else {
                                        echo '<li>Інформація про цільову аудиторію ще не додана</li>';
                                    }
                                    ?>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Вкладка з відгуками -->
                <div id="tab-reviews" class="tab-pane">
                    <div class="course-reviews">
                        <h3>Відгуки студентів</h3>
                        <div class="reviews-summary">
                            <div class="average-rating">
                                <div class="rating-value"><?php echo number_format($course['rating'] ?? 0, 1); ?></div>
                                <div class="stars-container">
                                    <?php
                                    $rating = floatval($course['rating'] ?? 0);
                                    for ($i = 1; $i <= 5; $i++) {
                                        if ($i <= $rating) {
                                            echo '<i class="fas fa-star"></i>';
                                        } elseif ($i - 0.5 <= $rating) {
                                            echo '<i class="fas fa-star-half-alt"></i>';
                                        } else {
                                            echo '<i class="far fa-star"></i>';
                                        }
                                    }
                                    ?>
                                </div>
                                <div class="reviews-count"><?php echo intval($course['reviews_count'] ?? 0); ?> відгуків</div>
                            </div>
                        </div>
                        
                        <div id="reviews-list" class="reviews-list">
                            <?php
                            // Отримуємо відгуки (можна додати пагінацію)
                            $reviews_stmt = $conn->prepare("SELECT r.*, u.name, u.avatar FROM reviews r 
                                            JOIN users u ON r.user_id = u.id 
                                            WHERE r.course_id = ? 
                                            ORDER BY r.created_at DESC LIMIT 10");
                            $reviews_stmt->bind_param("i", $course_id);
                            $reviews_stmt->execute();
                            $reviews_result = $reviews_stmt->get_result();
                            
                            if ($reviews_result->num_rows > 0) {
                                while ($review = $reviews_result->fetch_assoc()) {
                                    ?>
                                    <div class="review-item">
                                        <div class="review-header">
                                            <div class="reviewer-info">
                                                <div class="reviewer-avatar">
                                                    <img src="<?php echo !empty($review['avatar']) ? htmlspecialchars($review['avatar']) : 'img/default-avatar.png'; ?>" alt="<?php echo htmlspecialchars($review['name']); ?>">
                                                </div>
                                                <div class="reviewer-details">
                                                    <div class="reviewer-name"><?php echo htmlspecialchars($review['name']); ?></div>
                                                    <div class="review-date"><?php echo date('d.m.Y', strtotime($review['created_at'])); ?></div>
                                                </div>
                                            </div>
                                            <div class="review-rating">
                                                <?php
                                                for ($i = 1; $i <= 5; $i++) {
                                                    if ($i <= $review['rating']) {
                                                        echo '<i class="fas fa-star"></i>';
                                                    } else {
                                                        echo '<i class="far fa-star"></i>';
                                                    }
                                                }
                                                ?>
                                            </div>
                                        </div>
                                        <div class="review-content">
                                            <?php echo htmlspecialchars($review['content']); ?>
                                        </div>
                                    </div>
                                    <?php
                                }
                            } else {
                                echo '<div class="no-reviews">Поки немає відгуків для цього курсу</div>';
                            }
                            ?>
                        </div>
                        
                        <?php if (isset($_SESSION['user_id'])): ?>
                            <div class="add-review-section">
                                <h4>Залишити відгук</h4>
                                <form id="review-form" class="review-form">
                                    <input type="hidden" name="course_id" value="<?php echo $course_id; ?>">
                                    
                                    <div class="rating-input">
                                        <label>Ваша оцінка:</label>
                                        <div class="rating-stars">
                                            <?php for ($i = 5; $i >= 1; $i--): ?>
                                                <input type="radio" id="star<?php echo $i; ?>" name="rating" value="<?php echo $i; ?>" <?php echo $i == 5 ? 'checked' : ''; ?>>
                                                <label for="star<?php echo $i; ?>"><i class="fas fa-star"></i></label>
                                            <?php endfor; ?>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="review-content">Ваш відгук:</label>
                                        <textarea id="review-content" name="content" rows="4" placeholder="Поділіться своїми враженнями про курс" required></textarea>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary">Відправити відгук</button>
                                </form>
                            </div>
                        <?php else: ?>
                            <div class="login-to-review">
                                <p>Щоб залишити відгук, будь ласка, <a href="login.php">увійдіть</a> в свій обліковий запис.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="course-sidebar">
            <div class="course-enrollment">
                <div class="course-price">
                    <?php
                    if ($course['price'] > 0) {
                        echo '<div class="price-current">' . number_format($course['price'], 0, '.', ' ') . ' грн</div>';
                        
                        if (!empty($course['original_price']) && $course['original_price'] > $course['price']) {
                            echo '<div class="price-original">' . number_format($course['original_price'], 0, '.', ' ') . ' грн</div>';
                            
                            // Розрахунок знижки
                            $discount = round(($course['original_price'] - $course['price']) / $course['original_price'] * 100);
                            echo '<div class="price-discount">-' . $discount . '%</div>';
                        }
                    } else {
                        echo '<div class="price-free">Безкоштовно</div>';
                    }
                    ?>
                </div>
                
                <button class="btn btn-primary btn-enroll">Записатись на курс</button>
                <button class="btn btn-outline btn-wishlist"><i class="far fa-heart"></i> У список бажань</button>
                
                <div class="course-guarantee">
                    <i class="fas fa-shield-alt"></i>
                    <span>30-денна гарантія повернення коштів</span>
                </div>
                
                <div class="course-includes">
                    <h4>Курс включає:</h4>
                    <ul>
                        <li><i class="fas fa-video"></i> <?php echo intval($course['video_hours'] ?? 0); ?> годин відео</li>
                        <li><i class="fas fa-file-alt"></i> <?php echo intval($course['articles_count'] ?? 0); ?> статей</li>
                        <li><i class="fas fa-download"></i> <?php echo intval($course['resources_count'] ?? 0); ?> ресурсів</li>
                        <li><i class="fas fa-infinity"></i> Довічний доступ</li>
                        <li><i class="fas fa-mobile-alt"></i> Доступ з мобільних пристроїв</li>
                        <li><i class="fas fa-certificate"></i> Сертифікат про завершення</li>
                    </ul>
                </div>
                
                <div class="course-share">
                    <h4>Поділитися курсом:</h4>
                    <div class="social-share">
                        <a href="#" class="social-btn facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="social-btn twitter"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-btn linkedin"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#" class="social-btn telegram"><i class="fab fa-telegram-plane"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="js/course.js"></script>

<?php require_once 'includes/footer.php'; ?> 