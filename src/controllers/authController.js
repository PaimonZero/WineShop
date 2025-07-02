const User = require('@models/User');
const Product = require('@models/Product');
const asyncHandler = require('express-async-handler');
const tokenUtils = require('@middlewares/jwt');
const jwt = require('jsonwebtoken');
const { mailResetPassword } = require('@src/templates/resetPasswordEmail');
const env = require('@config/environment');
const sendMail = require('@utils/sendMail');
const crypto = require('crypto');

// [GET] auth/register Display register page
const displayRegister = asyncHandler(async (req, res) => {
    // // Check if user is already logged in
    // if (req.user) {
    //     return res.redirect('/'); // Redirect to home page if user is already logged in
    // }
    // // Check if user is an admin
    // const isAdmin = req.cookies?.accessToken ? tokenUtils.verifyAccessToken(req.cookies.accessToken).role === 'admin' : false;
    // if (isAdmin) {
    //     return res.redirect('/admin/dashboard'); // Redirect to admin dashboard if user is an admin
    // }
    // If not logged in, render the register page
    res.render('register', {
        title: 'Register Page',
        notification: null,
        account: null,
    });
});

// [POST] register user
const register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, mobile } = req.body;

    // Kiểm tra thiếu input
    if (!email || !password || !firstName || !lastName) {
        return res.render('register', {
            title: 'Register Page',
            notification: {
                message: 'Missing required fields!',
                type: 'danger',
            },
            formData: { email, firstName, lastName, mobile }, // giữ lại input
            account: null,
        });
    }

    // Kiểm tra người dùng đã tồn tại
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.render('register', {
            title: 'Register Page',
            notification: {
                message: 'User already exists!',
                type: 'danger',
            },
            formData: { email, firstName, lastName, mobile },
            account: null,
        });
    }

    // Tạo tài khoản mới
    const newUser = await User.create({
        email,
        password,
        firstName,
        lastName,
        mobile,
    });

    if (!newUser) {
        return res.render('register', {
            title: 'Register Page',
            notification: {
                message: 'Failed to create user!',
                type: 'danger',
            },
            formData: { email, firstName, lastName, mobile },
            account: null,
        });
    }

    // Đăng ký thành công
    return res.render('login', {
        title: 'Register Page',
        notification: {
            message: 'User created successfully!',
            type: 'success',
        },
        formData: null,
        account: null,
    });
});

// [GET] auth/login Display login page
const displayLogin = asyncHandler(async (req, res) => {
    // // Check if user is already logged in
    // if (req.user) {
    //     return res.redirect('/'); // Redirect to home page if user is already logged in
    // }
    // // Check if user is an admin
    // const isAdmin = req.cookies?.accessToken ? tokenUtils.verifyAccessToken(req.cookies.accessToken).role === 'admin' : false;
    // if (isAdmin) {
    //     return res.redirect('/admin/dashboard'); // Redirect to admin dashboard if user is an admin
    // }
    // If not logged in, render the login page
    res.render('login', {
        title: 'Login Page',
        notification: null,
        account: null,
    });
});

// [POST] auth/login Login user
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Thiếu input
    if (!email || !password) {
        return res.render('login', {
            title: 'Login Page',
            notification: { message: 'Missing email or password!', type: 'danger' },
            account: null,
        });
    }

    // 2. Kiểm tra user tồn tại
    const userResponse = await User.findOne({ email });
    if (!userResponse) {
        return res.render('login', {
            title: 'Login Page',
            notification: { message: 'User not found!', type: 'danger' },
            account: null,
        });
    }

    // 3. Kiểm tra mật khẩu
    const isMatch = await userResponse.isCorrectPassword(password);
    if (!isMatch) {
        return res.render('login', {
            title: 'Login Page',
            notification: { message: 'Invalid credentials!', type: 'danger' },
            account: null,
        });
    }

    // 4. Tạo token
    const accessToken = tokenUtils.generateAccessToken(userResponse._id, userResponse.role);
    const refreshToken = tokenUtils.generateRefreshToken(userResponse._id);

    // 5. Lưu refresh token vào DB
    await User.findByIdAndUpdate(userResponse._id, { refreshToken }, { new: true });

    // 6. Gửi cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1 * 60 * 60 * 1000, // 1 giờ
    });

    // 7. Trả về giao diện thành công
    return res.render('login', {
        title: 'Login Page',
        notification: { message: 'Login successful!', type: 'success' },
        account: {
            avatar: userResponse.avatar || '/images/all/default-avatar.jpg',
            role: userResponse.role,
            name: userResponse.lastName,
        },
    });
});

// [POST] refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Lấy refresh token từ cookie
    const cookie = req.cookies;
    // Kiểm tra xem cookie có chứa refresh token không
    if (!cookie?.refreshToken) throw new Error('No refresh token in cookies!');

    // Kiểm tra tính hợp lệ của refresh token
    const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET); // Nếu hết hạn sẽ tự động ném lỗi với hàm errorHandler
    const response = await User.findOne({ _id: rs._id, refreshToken: cookie.refreshToken });
    return res.status(200).json({
        success: response ? true : false,
        newAccessToken: response
            ? tokenUtils.generateAccessToken(response._id, response.role)
            : 'Refresh token is not valid!',
    });
});

// [POST] logout user
const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error('No refresh token in cookies!');
    await User.findOneAndUpdate(
        { refreshToken: cookie.refreshToken },
        { refreshToken: '' },
        { new: true }
    );
    // Xóa cookie refresh token
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
    });
    // Xóa cookie access token
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: true,
    });
    // return res.status(200).json({
    //     success: true,
    //     mes: 'Logout successful!',
    // });
    return res.render('login', {
        title: 'Login Page',
        notification: { message: 'Logout successful!', type: 'success' },
        account: null,
    });
});

// [GET] auth/forgot-password Display forgot password page
const displayForgotPassword = asyncHandler(async (req, res) => {
    // // Check if user is already logged in
    // if (req.user) {
    //     return res.redirect('/'); // Redirect to home page if user is already logged in
    // }
    // If not logged in, render the forgot password page
    res.render('forgot-password', {
        title: 'Forgot Password Page',
        notification: null,
        account: null,
    });
});

// Lưu ý chỉnh lại file env tại CLIENT_URL
// [POST] auth/forgot-password forgot password
const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.render('forgot-password', {
            title: 'Forgot Password Page',
            notification: { message: 'Email is required!', type: 'danger' },
            account: null,
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.render('forgot-password', {
            title: 'Forgot Password Page',
            notification: { message: 'User not found with that email.', type: 'danger' },
            account: null,
        });
    }

    try {
        // Create reset token
        const resetToken = user.createPasswordResetToken();
        await user.save();

        const content = {
            subject: 'Forgot password notification from your Barrel&Vine account',
            html: mailResetPassword(resetToken),
            text: `You have requested to reset your password. Please use the following link: ${env.CLIENT_URL}/auth/reset-password/${resetToken}`,
        };

        await sendMail(email, content);

        return res.render('forgot-password', {
            title: 'Forgot Password Page',
            notification: {
                message: 'Reset password email sent successfully!',
                type: 'success',
                messageForForgot: 'Please check your email for the reset link!',
            },
            account: null,
        });
    } catch (error) {
        return res.render('forgot-password', {
            title: 'Forgot Password Page',
            notification: {
                message: 'Something went wrong. Please try again later.',
                type: 'danger',
            },
            account: null,
        });
    }
});

// [GET] auth/reset-password/:token Display reset password page
const displayResetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.render('reset-password', {
            title: 'Reset Password Page',
            notification: { message: 'Token is required!', type: 'danger' },
            account: null,
            token: null,
        });
    }

    try {
        const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            passwordResetToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.render('reset-password', {
                title: 'Reset Password Page',
                notification: { message: 'Invalid or expired reset token!', type: 'danger' },
                account: null,
                token: null,
            });
        }

        return res.render('reset-password', {
            title: 'Reset Password Page',
            notification: null,
            account: null,
            token, // dùng trong form
        });
    } catch (error) {
        console.error('Render error:', error);
        return res.status(500).render('reset-password', {
            title: 'Reset Password Page',
            notification: {
                message: 'Something went wrong. Please try again later.',
                type: 'danger',
            },
            account: null,
            token: null,
            account: null,
        });
    }
});

// Lưu ý chỉnh lại file env tại CLIENT_URL
// {PUT} [POST] auth/reset-password/:token reset password
const resetPassword = asyncHandler(async (req, res) => {
    const { password, token } = req.body;

    // Kiểm tra thiếu token
    if (!token) {
        return res.render('reset-password', {
            title: 'Reset Password',
            notification: { message: 'Token is required!', type: 'danger' },
            token,
            account: null,
        });
    }

    // Kiểm tra thiếu password
    if (!password) {
        return res.render('reset-password', {
            title: 'Reset Password',
            notification: { message: 'Password is required!', type: 'danger' },
            token,
            account: null,
        });
    }

    // Băm token để tìm user
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

    // Tìm người dùng theo token và thời hạn còn hiệu lực
    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    // Không tìm thấy hoặc token hết hạn
    if (!user) {
        return res.render('reset-password', {
            title: 'Reset Password',
            notification: { message: 'Invalid or expired reset token!', type: 'danger' },
            token: null,
            account: null,
        });
    }

    // Cập nhật mật khẩu mới
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now().toString();
    await user.save();

    // Trả về thông báo thành công
    return res.render('login', {
        title: 'Reset Password',
        notification: { message: 'Password reset successfully!', type: 'success' },
        token: null,
        account: null,
    });
});

// [GET] get user info
const getCurrentUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    // Fetch user details from database
    const userDetails = await User.findById(_id).select('-password -refreshToken -role');
    // console.log(userDetails);
    return res.status(200).json({
        success: userDetails ? true : false,
        mes: userDetails ? 'User details fetched successfully!' : 'Failed to fetch user details!',
        response: userDetails ? userDetails : 'User not found!',
    });
});

module.exports = {
    register,
    login,
    getCurrentUser,
    refreshAccessToken,
    logout,
    forgotPassword,
    resetPassword,
    displayLogin,
    displayRegister,
    displayForgotPassword,
    displayResetPassword,
};
