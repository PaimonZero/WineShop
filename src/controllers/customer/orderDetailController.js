const Invoice = require('@models/Invoice');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get order detail page
 * @route   GET /order-detail
 * @access  Private
 */
const getOrderDetailPage = asyncHandler(async (req, res) => {
    const { invoiceId } = req.query;
    const { _id } = req.user;

    if (!invoiceId) {
        return res.redirect('/order-history');
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, userId: _id }).populate(
        'products.productId'
    );

    if (!invoice) {
        return res.render('customer/404', {
            title: 'Không tìm thấy đơn hàng',
        });
    }

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('customer/order-detail', {
        title: `Chi tiết đơn hàng`,
        account: req.user || null,
        notification: notification || null,
        invoice,
    });
});

module.exports = {
    getOrderDetailPage,
};
