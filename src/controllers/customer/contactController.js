const asyncHandler = require('express-async-handler');

/**
 * @desc    Get contact page
 * @route   GET /contact
 * @access  Private
 */
const getContactPage = asyncHandler(async (req, res) => {
    res.render('customer/contact', {
        title: 'Contact',
        account: req.user ? { role: req.user.role } : null,
    });
});

module.exports = {
    getContactPage,
};
