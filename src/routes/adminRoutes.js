const router = require('express').Router();
// const cateCtrls = require('@controllers/categoryController');
const tokenUtils = require('@middlewares/jwt');

// test controller
const asyncHandler = require('express-async-handler');
const testView = asyncHandler(async (req, res) => {
    //..............
    res.render('admin/dashboard', {
        title: 'Test EJS View',
        message: 'Hello, EJS!',
        account: {
            avatar: '/images/svg/delivery-car-tran.png',
            role: 'manager',
            name: 'Demo User',
        },
    });
});

// Set default layout for admin routes
router.use((req, res, next) => {
    res.locals.layout = 'layouts/admin';
    next();
});

// Test route to admin view
router.get('/test-view', testView);

module.exports = router;
