document.addEventListener('DOMContentLoaded', () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const navMenu = document.querySelector('.nav-menu');
    burgerMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    const searchBtn = document.querySelector('.search-btn');
    const searchBar = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar-input');
    searchBtn.addEventListener('click', () => {
        searchBar.style.display = 'flex';
        searchBtn.style.display = 'none';
        searchInput.focus();
    });
    searchInput.addEventListener('blur', () => {
        searchBar.style.display = 'none';
        searchBtn.style.display = 'block';
    });

    const commentsContainer = document.querySelector('.comments-list');
    const leftButton = document.querySelector('.comments-button-left');
    const rightButton = document.querySelector('.comments-button-right');
    const card = document.querySelector('.comment-card');
    if (commentsContainer && leftButton && rightButton && card) {
        const scrollAmount = card.offsetWidth + 8;

        leftButton.addEventListener('click', () => {
            commentsContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        rightButton.addEventListener('click', () => {
            commentsContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }

    const courseList = document.querySelector('.courses-list');
    if (courseList) {
        function manageRowVisibility() {
            const courseList = document.querySelector('.courses-list');
            const cards = Array.from(courseList.children);
            const containerWidth = courseList.clientWidth;
            const cardStyle = getComputedStyle(cards[0]);
            const cardWidth = cards[0].offsetWidth + parseInt(cardStyle.marginRight) + parseInt(cardStyle.marginLeft);
            const cardsPerRow = Math.floor(containerWidth / cardWidth);
            cards.forEach((card, index) => {
                const rowNumber = Math.floor(index / cardsPerRow);
                if (rowNumber > 0) {
                    card.style.display = index >= cardsPerRow && index < cardsPerRow * 2 && cards.slice(cardsPerRow, cardsPerRow * 2).length < cardsPerRow
                        ? 'none'
                        : 'flex';
                }
            });
        }
        window.addEventListener('load', manageRowVisibility);
        window.addEventListener('resize', manageRowVisibility);
    }

    function goToLogin() {
        window.location.href = "login.html";
    }

    function goToSignup() {
        window.location.href = "signup.html";
    }

    function goToCategories() {
        window.location.href = "category.html";
    }

    document.getElementById("logInButton").addEventListener("click", goToLogin);
    document.getElementById("signUpButton").addEventListener("click", goToSignup);
    document.getElementById("sea-all-categories").addEventListener("click", goToCategories);
    document.getElementById("sea-all-curses").addEventListener("click", goToCategories);
    document.getElementById("sea-all-instructors").addEventListener("click", goToCategories);
});

