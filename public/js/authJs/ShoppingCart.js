function changeQuantity(productId, change) {
    const item = cart.find((i) => i.product._id === productId);

    if (!item) return;

    const min = 1;
    const max = item.product.quantity; // tồn kho

    const newQuantity = item.quantity + change;

    if (newQuantity >= min && newQuantity <= max) {
        item.quantity = newQuantity;
        renderCartList();
        renderTotalAmount();
    }
}

function setCheck(productId, checked) {
    const item = cart.find((i) => i.product._id === productId);
    if (item) {
        item.isChecked = checked;
        renderTotalAmount();
    }
}

function renderCartList() {
    const tbody = document.getElementById('cart-list');
    tbody.innerHTML = ''; // Xoá cũ nếu có

    if (!cart || cart.length === 0) {
        tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center pt-3 text-danger">
            <p>Giỏ hàng của bạn đang trống.</p>
          </td>
        </tr>
      `;
        return;
    }

    cart.forEach((item) => {
        const p = item.product;
        const quantity = item.quantity;
        const totalPrice = (p.price * quantity).toLocaleString('vi-VN');

        const isOutOfStock = p.status === 'outOfStock' || p.quantity === 0;

        const row = document.createElement('tr');
        row.className = 'product';

        row.innerHTML = `
        <td>
          <input
            type="checkbox"
            class="form-check-input me-2 align-middle"
            data-product-id="${p._id}"
            ${item.isChecked ? 'checked' : ''}
            onchange="setCheck('${p._id}', this.checked)"
          >
          <img src="${p.images[0]}" alt="product-img" title="${
            p.title
        }" class="rounded me-3" height="64" />
          <p class="m-0 d-inline-block align-middle font-16 product-name">
            <a href="#">${p.title}</a>
          </p>
        </td>
        <td>
          <div class="item-price">${p.price.toLocaleString('vi-VN')} đ</div>
        </td>
        <td class="text-center d-flex">
          <div class="item-quantity d-flex justify-content-center w-100">
            ${
                isOutOfStock
                    ? `
              <div class="qty-container w-100 d-none">
                <button type="button" class="qty-btn-minus btn-light" disabled>-</button>
                <input type="number" class="input-qty" value="0" readonly style="width: 55px;" />
                <button type="button" class="qty-btn-plus btn-light" disabled>+</button>
              </div>
              <div class="alert alert-danger p-1" style="font-size: 13px;" role="alert">
                <i class="bi bi-exclamation-triangle-fill"></i> Sản phẩm này tạm thời hết hàng
              </div>
            `
                    : `
              <div class="qty-container">
                <button type="button" class="qty-btn-minus btn-light" onclick="changeQuantity('${p._id}', -1, this, ${p.quantity})">-</button>
                <input type="number" name="quantity" class="input-qty" style="width: 55px;" value="${quantity}" min="1" max="${p.quantity}" readonly />
                <button type="button" class="qty-btn-plus btn-light" onclick="changeQuantity('${p._id}', 1, this, ${p.quantity})">+</button>
              </div>
            `
            }
          </div>
        </td>
        <td>
          <div class="item-total-price">${totalPrice} đ</div>
        </td>
        <td>
          <a class="action-icon" onclick="deleteProduct('${p._id}')" style="cursor: pointer;">
            <i class="far fa-trash-alt me-2"></i>
          </a>
        </td>
      `;

        tbody.appendChild(row);
    });
}

function renderTotalAmount() {
    let total = cart.reduce((sum, item) => {
        if (item.isChecked) {
            return sum + item.product.price * item.quantity;
        }
        return sum;
    }, 0);

    let finalTotal = total - discount > 0 ? total - discount : 0;

    // Gán tổng giá ra UI
    const totalEl = document.getElementById('total-amount');
    if (totalEl) {
        totalEl.innerText = total.toLocaleString('vi-VN') + ' đ';
    }
    // Gán discount amount UI
    const discountEl = document.getElementById('discount-amount');
    if (discountEl) {
        discountEl.innerText = '- ' + discount.toLocaleString('vi-VN') + ' đ';
    }
    // Gán final total UI
    const finalTotalEl = document.getElementById('final-total');
    if (finalTotalEl) {
        finalTotalEl.innerText = finalTotal.toLocaleString('vi-VN') + ' đ';
    }

    // Bật/tắt nút thanh toán
    const payBtn = document.getElementById('btn-pay');
    if (payBtn) {
        if (total > 0) {
            payBtn.disabled = false;
            payBtn.classList.remove('disabled'); // optional
        } else {
            payBtn.disabled = true;
            payBtn.classList.add('disabled'); // optional
        }
    }
}

async function getCoupon(event) {
    event.preventDefault(); // Ngăn form reload trang

    const code = document.getElementById('coupon-code').value.trim();

    if (!code) {
        alert('Vui lòng nhập mã giảm giá!');
        return;
    }

    try {
        const res = await fetch(`/api/coupon/check?code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Lỗi khi áp dụng mã giảm giá');
        }

        // ✅ Thành công
        alert(`Áp dụng thành công: ${data.coupon.discount.toLocaleString('vi-VN')}đ giảm giá`);

        console.log(data);

        discount = data.coupon.discount;
        renderTotalAmount();

        // TODO: Lưu vào biến, áp dụng vào tổng tiền, v.v.
        // applyCoupon(data);
    } catch (err) {
        discount = 0;
        renderTotalAmount();
        alert(err.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc muốn xoá sản phẩm này khỏi giỏ hàng?')) return;

    try {
        const res = await fetch(`/shopping-cart/delete-product/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || 'Không thể xoá sản phẩm');
        }

        alert(data.message);

        // ✅ Thành công
        cart = data.cart;
        renderCartList();
    } catch (err) {
        console.error('❌ Lỗi xoá sản phẩm:', err);
        alert(data.message || 'Không thể xoá sản phẩm');
    }
}

function submitFormPay() {
    const form = document.getElementById('form-pay');
    form.innerHTML = ''; // clear old data

    const input1 = document.createElement('input');
    input1.type = 'hidden';
    input1.name = 'cart';
    input1.value = JSON.stringify(cart.filter((item) => item.isChecked));

    const input2 = document.createElement('input');
    input2.type = 'hidden';
    input2.name = 'discountCode';
    input2.value = document.getElementById('coupon-code').value.trim();

    form.appendChild(input1);
    form.appendChild(input2);

    form.submit();
}

renderTotalAmount();

renderCartList();
