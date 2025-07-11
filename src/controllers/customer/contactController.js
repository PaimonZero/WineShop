const asyncHandler = require('express-async-handler');

/**
 * @desc    Get contact page
 * @route   GET /contact
 * @access  Private
 */
const getContactPage = asyncHandler(async (req, res) => {

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('customer/contact', {
        title: 'Contact',
        account: req.user || null,
        notification: notification || null,
    });
});

module.exports = {
    getContactPage,
};
