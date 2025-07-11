const User = require('@models/User');
const Invoice = require('@models/Invoice');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get customer-dashboard page
 * @route   GET /customer-dashboard
 * @access  Private
 */
const getCustomerDashboard = asyncHandler(async (req, res) => {
    // Assuming user is authenticated and req.user is populated by a middleware
    if (!req.user) {
        return res.redirect('/login'); // Or handle unauthorized access
    }

    const userId = req.user._id;

    // Fetch user details and all their invoices concurrently
    const [user, invoices] = await Promise.all([
        User.findById(userId).select('-password -refreshToken -role').lean(),
        Invoice.find({ userId })
            .populate({
                path: 'products.productId',
            })
            .populate({
                path: 'coupon',
            })
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    if (!user) {
        // This case should ideally not happen if user is logged in
        req.session.notification = {
            message: 'Email của bạn chưa được đăng ký chăng?',
            type: 'danger',
        };

        const backURL = req.get('Referer') || '/';
        return res.redirect(backURL);
    }

    // Calculate total amount spent
    const totalSpent = invoices.reduce(
        (acc, order) => (order.deliveryStatus === 'cancelled' ? acc : acc + order.totalAmount),
        0
    );

    // Get recent orders (e.g., the latest 5)
    const recentOrders = invoices.slice(0, 5);

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('customer/customer-dashboard', {
        title: 'Bảng điều khiển',
        account: req.user || null,
        notification: notification || null,
        listInfo: user,
        listOrder: invoices,
        recentOrders: recentOrders,
        totalSpent: totalSpent,
    });
});

module.exports = {
    getCustomerDashboard,
};
