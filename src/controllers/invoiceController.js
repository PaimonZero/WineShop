const Invoice = require('@models/Invoice');
const User = require('@models/User');
const Product = require('@models/Product');
const Coupon = require('@models/Coupon');
const asyncHandler = require('express-async-handler');

// [POST] Create a new order (all from cart)
const createOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { coupon, name, phone, address, paymentMethod } = req.body;
    if (!name || !phone || !address || !paymentMethod) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Lấy giỏ hàng người dùng
    const userCart = await User.findById(_id).populate('cart.product', 'title price');
    const products = userCart?.cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
    }));
    if (!products || products.length === 0) {
        return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // Tính tổng tiền
    let totalAmount = products.reduce((acc, item) => acc + item.price * item.quantity, 0);
    let discountAmount = 0;
    // Áp dụng mã giảm giá nếu có
    if (coupon) {
        const couponData = await Coupon.findOne({ name: coupon });
        if (!couponData || couponData.expiry < new Date()) {
            return res.status(404).json({ message: 'Coupon not found or expired.' });
        }
        discountAmount = Math.round(totalAmount * (couponData.discount / 100));
        totalAmount = Math.round(totalAmount - discountAmount);
    }

    // TODO: Chưa xử lý thanh toán
    // Tạo hóa đơn (Invoice)
    const newInvoice = await Invoice.create({
        userId: _id,
        products,
        coupon,
        totalAmount,
        paymentMethod,
        shippingAddress: { name, phone, address },
    });
    // Xóa giỏ hàng
    await User.findByIdAndUpdate(_id, { cart: [] }, { new: true });
    // Trả kết quả
    res.status(201).json({
        message: newInvoice ? 'Order created successfully!' : 'Failed to create order!',
        invoice: newInvoice,
        discountAmount,
    });
});

// [PUT] Update payment status
const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { paymentStatus } = req.body;
    if (!['pending', 'shipped', 'completed', 'cancelled'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status.' });
    }
    const response = await Invoice.findByIdAndUpdate(oid, { paymentStatus }, { new: true });
    res.status(200).json({
        message: response ? 'Payment status updated!' : 'Invoice not found.',
        invoice: response,
    });
});

// [PUT] Update to cancel invoice
const updateToCancelDeliveryStatus = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { deliveryStatus } = req.body;

    if ('cancelled' !== deliveryStatus) {
        return res.status(400).json({ message: 'Invalid delivery status.' });
    }
    const response = await Invoice.findByIdAndUpdate(
        oid,
        { deliveryStatus },
        { new: true }
    ).populate('products.productId');

    res.status(200).json({
        message: response ? 'Delivery status updated!' : 'Invoice not found.',
        invoice: response,
    });
});

// [PUT] Update delivery status
const updateDeliveryStatus = asyncHandler(async (req, res) => {
    const { oid } = req.params;
    const { deliveryStatus } = req.body;
    if (!['pending', 'shipped', 'completed', 'cancelled'].includes(deliveryStatus)) {
        return res.status(400).json({ message: 'Invalid delivery status.' });
    }
    const response = await Invoice.findByIdAndUpdate(oid, { deliveryStatus }, { new: true });

    res.status(200).json({
        message: response ? 'Delivery status updated!' : 'Invoice not found.',
        invoice: response,
    });
});

// [GET] Get all invoices of the user
const getUserInvoices = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const invoices = await Invoice.find({ userId: _id })
        .populate('products.productId', 'title price')
        .populate('coupon', 'name discount expiry')
        .sort({ createdAt: -1 });
    res.status(200).json({
        message: invoices.length > 0 ? 'Invoices retrieved successfully!' : 'No invoices found',
        invoices,
    });
});

// [GET] all invoices (admin only)
const getInvoices = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const invoices = await Invoice.find()
        .populate('products.productId', 'title price')
        .populate('coupon', 'name discount expiry')
        .sort({ createdAt: -1 });
    res.status(200).json({
        message: invoices.length > 0 ? 'Invoices retrieved successfully!' : 'No invoices found',
        invoices,
    });
});

module.exports = {
    createOrder,
    updatePaymentStatus,
    updateToCancelDeliveryStatus,
    updateDeliveryStatus,
    getUserInvoices,
    getInvoices,
};
