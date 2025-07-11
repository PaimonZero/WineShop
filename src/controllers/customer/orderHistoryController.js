const Invoice = require('@models/Invoice');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get order history page
 * @route   GET /order-history
 * @access  Private
 */
const getOrderHistoryPage = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const invoices = await Invoice.find({ userId })
        .populate({
            path: 'products.productId',
        })
        .populate({
            path: 'coupon',
        })
        .sort({ createdAt: -1 }); // Sort by creation date, newest first

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('customer/order-history', {
        title: 'Order History',
        account: req.user || null,
        notification: notification || null,
        invoices,
    });
});

module.exports = {
    getOrderHistoryPage,
};
