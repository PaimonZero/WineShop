const Invoice = require('@models/Invoice');
const User = require('@models/User');
const Product = require('@models/Product');
const Coupon = require('@models/Coupon');
const asyncHandler = require('express-async-handler');

// Render orders page
const renderOrdersPage = asyncHandler(async (req, res) => {
    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    // Lấy danh sách hóa đơn
    const invoices = await Invoice.find().lean(); // Sử dụng lean() để trả về đối tượng JavaScript thuần túy
    if (invoices.length === 0) {
        return res.render('admin/orders', {
            title: 'Manage Orders',
            invoices: [],
            notification: { type: 'info', message: 'No orders found.' },
        });
    }

    res.render('admin/orders', {
        title: 'Manage Orders',
        invoices,
        notification,
    });
});

// render order details page
const renderOrderDetailsPage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
        .populate('userId', 'email mobile lastName firstName')
        .populate('products.productId', 'title')
        .populate('coupon', 'name discount')
        .lean();

    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    if (!invoice) {
        return res.status(404).render('admin/404', {
            title: 'Order Not Found',
            notification: {
                type: 'danger',
                message: 'Order not found.',
            },
        });
    }

    res.render('admin/orderDetail', {
        title: `Order Details`,
        invoice,
        notification: notification || {
            type: 'info',
            message: `You are viewing order ${invoice._id} information!`,
        },
    });
});

// Update order status and payment status
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { deliveryStatus, paymentStatus } = req.body;

    if (!deliveryStatus || !paymentStatus) {
        return res.redirect(`/admin/order-details/${id}?type=danger&message=Missing status fields.`);
    }

    if (!['pending', 'shipped', 'completed', 'cancelled'].includes(deliveryStatus)) {
        return res.redirect(`/admin/order-details/${id}?type=danger&message=Invalid delivery status.`);
    }
    if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
        return res.redirect(`/admin/order-details/${id}?type=danger&message=Invalid payment status.`);
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
        id,
        { deliveryStatus, paymentStatus },
        { new: true }
    );

    if (!updatedInvoice) {
        return res.redirect(`/admin/order-details/${id}?type=danger&message=Order not found.`);
    }

    res.redirect(`/admin/order-details/${id}?type=success&message=Order status updated successfully.`);
});

module.exports = {
    renderOrdersPage,
    renderOrderDetailsPage,
    updateOrderStatus,
};
