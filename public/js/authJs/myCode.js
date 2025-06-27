// Bấm lần đầu → mở ô tìm kiếm (toggle open)
// Bấm lại → nếu đang mở và có giá trị trong input, thì submit
// Bấm lại → nếu đang mở và chưa nhập gì, thì đóng lại
// Click ngoài vùng tìm kiếm → tự động đóng
document.addEventListener('DOMContentLoaded', function () {
    const searchBtn = document.querySelector('.search-btn');
    const searchBox = searchBtn?.parentElement;
    const searchInput = searchBox?.querySelector('input');

    if (searchBtn && searchBox && searchInput) {
        searchBtn.addEventListener('click', function (event) {
            if (!searchBox.classList.contains('open')) {
                // Mở ô tìm kiếm
                event.preventDefault();
                searchBox.classList.add('open');
                searchInput.focus();
            } else if (searchInput.value.trim() === '') {
                // Đang mở mà không có input → đóng lại
                event.preventDefault();
                searchBox.classList.remove('open');
            }
            // Nếu có input → để form submit tự nhiên
        });

        // Đóng ô tìm kiếm nếu click ra ngoài
        document.addEventListener('click', function (e) {
            if (!searchBox.contains(e.target) && searchBox.classList.contains('open')) {
                searchBox.classList.remove('open');
            }
        });
    }
});
