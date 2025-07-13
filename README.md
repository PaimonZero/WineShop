---

## ✅ 1. HTML Loader Overlay (đặt ngay sau `<body>`)

```html
<!-- Fullscreen Loader -->
<div id="loader-overlay" style="display: none;">
    <div class="loader-backdrop"></div>
    <div class="loader-spinner">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div class="mt-2 text-white fw-semibold">Đang xử lý...</div>
    </div>
</div>
```

---

## ✅ 2. CSS đi kèm (đặt vào file CSS chính hoặc trong `<style>`)

```css
#loader-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loader-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
}

.loader-spinner {
    z-index: 1;
    text-align: center;
}
```

> ✅ Sử dụng `backdrop-filter` để làm mờ nền + `spinner-border` của Bootstrap để xoay.

---

## ✅ 3. JS sử dụng loader

Khai báo đầu script:

```js
const loader = document.getElementById('loader-overlay');
```

Trong form submit:

```js
if (loader) loader.style.display = 'flex';
await new Promise(requestAnimationFrame);
```

Ẩn sau xử lý:

```js
if (loader) loader.style.display = 'none';
```

---

## ✅ Kết quả bạn đạt được:

| Tính năng                  | Có |
| -------------------------- | -- |
| Che toàn bộ trang          | ✅  |
| Chặn thao tác người dùng   | ✅  |
| Có hiệu ứng mờ nền         | ✅  |
| Spinner Bootstrap đẹp      | ✅  |
| Thêm dòng chữ "Đang xử lý" | ✅  |

---