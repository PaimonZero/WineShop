const User = require('@models/User');
const Invoice = require('@models/Invoice');
const Coupon = require('@models/Coupon');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get checkout page
 * @route   POST /checkout
 * @access  Private
 */
const getCheckoutPage = asyncHandler(async (req, res) => {
    const userDetails = await User.findById(req.user._id).select('-password -refreshToken -role');
    userDetails.fullName = userDetails.lastName + ' ' + userDetails.firstName;

    const cart = JSON.parse(req.body.cart);
    const discountCode = req.body.discountCode;

    let discount = 0;

    if (discountCode) {
        const coupon = await Coupon.findOne({ name: discountCode });

        if (coupon) {
            // ✅ Kiểm tra hạn sử dụng
            const now = new Date();

            if (coupon.expiry && coupon.expiry >= now) {
                discount = coupon.discount;
            }
        }
    }

    const total = cart.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
    }, 0);

    const finalTotal = total - discount > 0 ? total - discount : 0;

    res.render('customer/check-out', {
        title: 'Checkout',
        account: req.user ? { role: req.user.role } : null,
        userDetails,
        cart,
        total,
        discount,
        finalTotal,
        discountCode,
    });
});

const createInvoice = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { discountCode, fullName, phone, address, paymentMethod } = req.body;
    if (!fullName || !phone || !address || !paymentMethod) {
        res.render('error/error', {
            status: 400,
            message: 'Please provide all required fields.',
        });
    }

    const cart = JSON.parse(req.body.cart);

    let discount = 0;

    let coupon = null;
    if (discountCode) {
        const foundCoupon = await Coupon.findOne({ name: discountCode });
        if (foundCoupon && foundCoupon.expiry >= new Date()) {
            coupon = foundCoupon._id;
            discount = foundCoupon.discount;
        }
    }

    const total = cart.reduce((sum, item) => {
        if (item.isChecked) {
            return sum + item.product.price * item.quantity;
        }
        return sum;
    }, 0);

    const finalTotal = total - discount > 0 ? total - discount : 0;

    const products = cart.map((item) => {
        return {
            productId: item.product._id,
            price: item.product.price,
            quantity: item.quantity,
        };
    });

    // Tạo hóa đơn (Invoice)
    const newInvoice = await Invoice.create({
        userId: _id,
        products,
        coupon: coupon || null,
        totalAmount: finalTotal,
        paymentMethod,
        shippingAddress: { name: fullName, phone, address },
    });

    // Xóa sản phẩm khỏi giỏ hàng
    const user = await User.findById(_id);
    const originalLength = user.cart.length;

    const productIdsToRemove = cart.map((item) => item.product._id.toString());

    user.cart = user.cart.filter((item) => !productIdsToRemove.includes(item.product.toString()));

    // Nếu có thay đổi thì lưu
    if (user.cart.length !== originalLength) {
        await user.save();
    }
    // Trả kết quả

    res.redirect('/');
});

module.exports = {
    getCheckoutPage,
    createInvoice,
};
