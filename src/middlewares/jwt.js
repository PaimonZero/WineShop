const jwt = require('jsonwebtoken');
const env = require('@config/environment');
const asyncHandler = require('express-async-handler');

const generateAccessToken = (_id, role, firstName, avatar) => {
    console.log('Generating access token for user:', { _id, role, firstName, avatar });
    return jwt.sign({ _id, role, firstName, avatar }, env.JWT_SECRET, {
        expiresIn: '1h', // Token will expire in 60 minutes
    });
};

const generateRefreshToken = (_id) => {
    return jwt.sign({ _id }, env.JWT_SECRET, {
        expiresIn: '7d', // Token will expire in 7 days
    });
};

const verifyLogedin = asyncHandler(async (req, res, next) => {
    let token = null;
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Nếu không có, thử lấy từ cookie
    if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next();
        }
        req.user = decoded; // Attach user info to request object

        next(); // Proceed to the next middleware or route handler
    });
});

const verifyAccessToken = asyncHandler(async (req, res, next) => {
    let token = null;
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Nếu không có, thử lấy từ cookie
    if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        // Set notification vào session
        req.session.notification = {
            message: 'Ui! Bạn hãy đăng nhập để tiếp tục nhé!',
            type: 'danger',
        };

        const backURL = req.get('Referer') || '/';
        res.redirect(backURL);
    }
    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.render('customer/homepage', {
                notification: { message: 'Invalid access token!', type: 'danger' },
            });
        }
        req.user = decoded; // Attach user info to request object

        next(); // Proceed to the next middleware or route handler
    });
});

const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.render('customer/homepage', {
            notification: {
                message: 'Hãy đăng ký ADMIN để được cấp quyền truy cập nhé!',
                type: 'danger',
            },
        });
    }
    next();
};

const tokenUtils = {
    generateAccessToken,
    generateRefreshToken,
    verifyLogedin,
    verifyAccessToken,
    isAdmin,
};

module.exports = tokenUtils;
