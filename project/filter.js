document.addEventListener('DOMContentLoaded', () => {
    const filterCardButtons = document.querySelectorAll('.filter-card-button');

    filterCardButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterCard = button.closest('.filter-card');
            const filterInfo = filterCard ? filterCard.querySelector('.filter-info') : null;

            if (filterInfo) {
                filterInfo.classList.toggle('hidden');
                if (filterInfo.style.maxHeight) {
                    filterInfo.style.maxHeight = null;
                } else {
                    filterInfo.style.maxHeight = filterInfo.scrollHeight + 'px';
                }
                const img = button.querySelector('img');
                if (img) {
                    img.style.transform = filterInfo.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            }
        });
    });

    const seeMoreButtons = document.querySelectorAll('.see-more-button');

    seeMoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const parent = button.parentElement;
            const extraContent = parent.querySelectorAll('.check-box.hidden');

            if (extraContent.length > 0) {
                extraContent.forEach(item => item.classList.remove('hidden'));
                parent.style.maxHeight = parent.scrollHeight + 'px';
                button.querySelector('span').textContent = 'Згорнути';
                const img = button.querySelector('img');
                if (img) {
                    img.style.transform = 'rotate(180deg)';
                }
            } else {
                const visibleContent = parent.querySelectorAll('.check-box:not(.hidden)');
                visibleContent.forEach((item, index) => {
                    if (index >= 2) item.classList.add('hidden');
                });
                parent.style.maxHeight = parent.scrollHeight + 'px';
                button.querySelector('span').textContent = 'Переглянути більше';
                const img = button.querySelector('img');
                if (img) {
                    img.style.transform = 'rotate(0deg)';
                }
            }
        });
    });

    const secondFilterCard = document.querySelectorAll('.filter-card')[1];
    if (secondFilterCard) {
        const checkboxes = secondFilterCard.querySelectorAll('.check-box');
        checkboxes.forEach((checkbox, index) => {
            if (index >= 2) {
                checkbox.classList.add('hidden');
            }
        });
        const filterInfo = secondFilterCard.querySelector('.filter-info');
        if (filterInfo) {
            filterInfo.style.maxHeight = filterInfo.scrollHeight + 'px';
        }
    }

    const filterToggleButton = document.querySelector('.filter-button');
    const filterListWrapper = document.querySelector('.filter-list-wrapper');

    if (filterToggleButton && filterListWrapper) {
        filterToggleButton.addEventListener('click', () => {
            filterListWrapper.classList.toggle('hidden');
        });
    }

    const sortSelect = document.querySelector('.sort-select');

    if (sortSelect) {
        sortSelect.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            console.log(`Сортування за: ${selectedValue}`);
        });
    }
});
