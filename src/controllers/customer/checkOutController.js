const User = require('@models/User');
const Invoice = require('@models/Invoice');
const Coupon = require('@models/Coupon');
const asyncHandler = require('express-async-handler');
const moment = require('moment');
const { createVNPayPaymentUrl, sortObject } = require('@utils/vnpay');

/**
 * @desc    Get checkout page
 * @route   POST /check-out
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
            } else {
                req.session.notification = {
                    message: 'Mã giảm giá đã hết hạn.',
                    type: 'danger',
                };
            }
        }
    }

    const total = cart.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
    }, 0);

    const finalTotal = total - discount > 0 ? total - discount : 0;

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('customer/check-out', {
        title: 'Checkout',
        account: req.user || null,
        notification: notification || null,
        userDetails,
        cart,
        total,
        discount,
        finalTotal,
        discountCode,
    });
});

/**
 * @desc    Create a invoice  and return order-detail page
 * @route   POST /check-out/create-invoice
 * @access  Private
 */
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
        } else {
            req.session.notification = {
                message: 'Mã giảm giá đã hết hạn.',
                type: 'danger',
            };
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

    const orderId = moment().format('DDHHmmss') + Math.floor(Math.random() * 10000);

    // Tạo hóa đơn (Invoice)
    const newInvoice = await Invoice.create({
        userId: _id,
        products,
        coupon: coupon || null,
        totalAmount: finalTotal,
        paymentMethod,
        shippingAddress: { name: fullName, phone, address },
        vnpTxnRef: paymentMethod === 'bankTransfer' ? orderId : null,
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

    // Nếu là thanh toán ngân hàng thì chuyển hướng sang VNPay
    if (paymentMethod === 'bankTransfer') {
        const vnpUrl = createVNPayPaymentUrl(req, finalTotal, orderId);
        return res.redirect(vnpUrl);
    }

    // Trả kết quả
    req.session.notification = {
        message: 'Đã đặt hàng thành công! Hãy nhớ thường xuyên theo dõi trạng thái đơn hàng nhé!',
        type: 'success',
    };

    res.redirect(`/order-detail?invoiceId=${newInvoice._id}`);
});

/**
 * @desc    VNPay IPN callback to update payment status
 * @route   GET /check-out/vnpay_ipn
 * @access  Public
 */
const handleVNPayIPN = asyncHandler(async (req, res) => {
    console.log('Handling VNPay IPN...');

    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    const orderId = vnp_Params['vnp_TxnRef'];
    const rspCode = vnp_Params['vnp_ResponseCode'];
    const vnpAmount = Number(vnp_Params['vnp_Amount']) / 100;

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const signed = crypto
        .createHmac('sha512', process.env.VNP_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

    if (secureHash !== signed) {
        return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }

    const invoice = await Invoice.findOne({ vnpTxnRef: orderId });

    if (!invoice) {
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    if (invoice.totalAmount !== vnpAmount) {
        return res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
    }

    if (['paid', 'failed'].includes(invoice.paymentStatus)) {
        return res.status(200).json({ RspCode: '02', Message: 'Order already updated' });
    }

    invoice.paymentStatus = rspCode === '00' ? 'paid' : 'failed';
    await invoice.save();

    return res.status(200).json({ RspCode: '00', Message: 'Payment status updated' });
});

/**
 * @desc    VNPay return URL to show payment result to user
 * @route   GET /check-out/vnpay_return
 * @access  Public
 */
const handleVNPayReturn = asyncHandler(async (req, res) => {
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    const orderId = vnp_Params['vnp_TxnRef'];
    const rspCode = vnp_Params['vnp_ResponseCode'];
    const vnpAmount = Number(vnp_Params['vnp_Amount']) / 100;

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = sortObject(vnp_Params);
    let qs = require('qs');
    const signData = qs.stringify(sortedParams, { encode: false });
    let crypto = require('crypto');
    const signed = crypto
        .createHmac('sha512', process.env.VNP_HASH_SECRET)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

    if (secureHash !== signed) {
        req.session.notification = {
            message: 'Checksum không hợp lệ.',
            type: 'danger',
        };
        return res.redirect(`http://localhost:5000/`);
    }

    const invoice = await Invoice.findOne({ vnpTxnRef: orderId });

    if (!invoice) {
        req.session.notification = {
            message: 'Không tìm thấy đơn hàng tương ứng.',
            type: 'danger',
        };
        return res.redirect(`http://localhost:5000/`);
    }

    if (invoice.totalAmount !== vnpAmount) {
        req.session.notification = {
            message: 'Tổng số tiền không hợp lệ.',
            type: 'danger',
        };
        return res.redirect(`http://localhost:5000/`);
    }

    if (['paid', 'failed'].includes(invoice.paymentStatus)) {
        req.session.notification = {
            message: 'Đơn hàng đã được cập nhật',
            type: 'danger',
        };
        return res.redirect(`http://localhost:5000/`);
    }

    const success = rspCode === '00';

    invoice.paymentStatus = success ? 'paid' : 'failed';
    if (!success) invoice.deliveryStatus = 'cancelled';

    await invoice.save();

    req.session.notification = {
        message: success
            ? 'Đã đặt hàng thành công! Hãy nhớ thường xuyên theo dõi trạng thái đơn hàng nhé!'
            : 'Thanh toán thất bại hoặc bị hủy.',
        type: success ? 'success' : 'danger',
    };

    return res.redirect(`http://localhost:5000/`);
});

module.exports = {
    getCheckoutPage,
    createInvoice,
    handleVNPayIPN,
    handleVNPayReturn,
};
