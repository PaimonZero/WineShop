const router = require('express').Router();
const ctrls = require('@controllers/authController');
const tokenUtils = require('@middlewares/jwt');
const passport = require('passport');

// Valid types for messages
const validTypes = ['warning', 'error', 'success', 'info'];

// [GET] auth/register Display login page
router.get('/login', ctrls.displayLogin);
// [POST] auth/login Login user
router.post('/login', ctrls.login);
// [POST] auth/logout Logout user
router.post('/logout', tokenUtils.verifyAccessToken, ctrls.logout);

// [GET] auth/register Display register page
router.get('/register', ctrls.displayRegister);
// [POST] auth/register Register user
router.post('/register', ctrls.register);

// [GET] auth/forgot-password Display forgot password page
router.get('/forgot-password', ctrls.displayForgotPassword);
// [POST] auth/forgot-password Send reset password email
router.post('/forgot-password', ctrls.forgotPassword);

// [GET] auth/reset-password/:token Display reset password page
router.get('/reset-password/:token', ctrls.displayResetPassword);
// [POST] auth/reset-password/:token Reset user password
router.post('/reset-password/:token', ctrls.resetPassword);

// [GET] auth/google Redirect to Google for authentication
router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] }),
    ctrls.googleLogin
);

// [GET] auth/google/callback Handle Google authentication callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/login' }),
    ctrls.googleCallback
);

module.exports = router;
