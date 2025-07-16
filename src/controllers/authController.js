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
    const notification = req.session.notification;
    delete req.session.notification;

    res.render('register', {
        title: 'Register Page',
        notification: notification || null,
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
                message:
                    'Hình như bạn đang nhập thiếu thông tin. Vui lòng kiểm tra: email, mật khẩu, họ tên cũng như số điện thoại nhé!',
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
                message: 'Email này đã được sử dụng mất rồi! Hãy chọn email khác nhé!',
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
                message:
                    'Xin lỗi vì sự bất tiện này! Bạn hãy thử đăng ký tài khoản lại sau ít phút nhé!',
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
            message: 'Chúc mừng bạn đã gia nhập với Barrel&Vine! Hãy đăng nhập để tiếp tục nhé!',
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

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('login', {
        title: 'Login Page',
        notification: notification || null,
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
            notification: { message: 'Email và mật khẩu không được để trống nhé!', type: 'danger' },
            account: null,
        });
    }

    // 2. Kiểm tra user tồn tại
    const userResponse = await User.findOne({ email });
    if (!userResponse) {
        return res.render('login', {
            title: 'Login Page',
            notification: { message: 'Email chưa được đăng ký chăng?', type: 'danger' },
            account: null,
        });
    }

    // 3. Kiểm tra mật khẩu
    const isMatch = await userResponse.isCorrectPassword(password);
    if (!isMatch) {
        return res.render('login', {
            title: 'Login Page',
            notification: { message: 'Ui! Nhập sai mật khẩu rồi nhé!', type: 'danger' },
            account: null,
        });
    }

    // 4. Tạo token
    const accessToken = tokenUtils.generateAccessToken(
        userResponse._id,
        userResponse.role,
        userResponse.firstName,
        userResponse.avatar
    );
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
    req.session.notification = {
        message:
            'Chào mừng bạn đến với Barrel&Vine! Hãy khám phá thế giới rượu vang cùng mình nhé!',
        type: 'success',
    };

    return res.redirect('/');
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
            ? tokenUtils.generateAccessToken(
                  response._id,
                  response.role,
                  response.firstName,
                  response.avatar
              )
            : 'Refresh token is not valid!',
    });
});

// [POST] logout user
const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) {
        req.session.notification = {
            message: 'Tài khoản đã được đăng xuất rồi nhé!',
            type: 'danger',
        };
        return res.redirect('/auth/login');
    }
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

    req.session.notification = { message: 'Đăng xuất tài khoản thành công!', type: 'success' };
    return res.redirect('/auth/login');
});

// [GET] auth/forgot-password Display forgot password page
const displayForgotPassword = asyncHandler(async (req, res) => {
    // // Check if user is already logged in
    // if (req.user) {
    //     return res.redirect('/'); // Redirect to home page if user is already logged in
    // }
    // If not logged in, render the forgot password page
    const notification = req.session.notification;
    delete req.session.notification;

    res.render('forgot-password', {
        title: 'Forgot Password Page',
        notification: notification || null,
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
            notification: { message: 'Bạn cần cung cấp email để tiếp tục nhé!', type: 'danger' },
            account: null,
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.render('forgot-password', {
            title: 'Forgot Password Page',
            notification: { message: 'Email chưa được đăng ký chăng?', type: 'danger' },
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
                message:
                    'Email xác thực đặt lại mật khẩu đã được gửi đến email của bạn. Hãy kiếm tra cẩn thận nhé!',
                type: 'success',
                messageForForgot: 'Please check your email for the reset link!',
            },
            account: null,
        });
    } catch (error) {
        return res.render('forgot-password', {
            title: 'Forgot Password Page',
            notification: {
                message:
                    'Xin lỗi vì sự bất tiện này, đặt lại mật khẩu không thành công. Vui lòng thử lại sau ít phút nhé!',
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
            notification: {
                message: 'Đường link không đúng! Hãy thử yêu cầu đặt mật khẩu lại nhé!',
                type: 'danger',
            },
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
                notification: {
                    message: 'Đã quá thời gian rồi, hãy thử yêu cầu đặt lại mật khẩu lại nhé!',
                    type: 'danger',
                },
                account: null,
                token: null,
            });
        }

        const notification = req.session.notification;
        delete req.session.notification;

        return res.render('reset-password', {
            title: 'Reset Password Page',
            notification: notification || null,
            account: null,
            token, // dùng trong form
        });
    } catch (error) {
        console.error('Render error:', error);
        return res.status(500).render('reset-password', {
            title: 'Reset Password Page',
            notification: {
                message:
                    'Xin lỗi vì sự bất tiện này, đặt lại mật khẩu không thành công. Vui lòng thử lại sau ít phút nhé!',
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
            notification: {
                message: 'Link bị hỏng rồi! Hãy thử yêu cầu đặt lại mật khẩu lại nhé!',
                type: 'danger',
            },
            token,
            account: null,
        });
    }

    // Kiểm tra thiếu password
    if (!password) {
        return res.render('reset-password', {
            title: 'Reset Password',
            notification: { message: 'Ủa bạn quên nhập mật khẩu mới rồi kìa!', type: 'danger' },
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
            notification: {
                message: 'Đã quá thời gian rồi, hãy thử yêu cầu đặt lại mật khẩu lại nhé!',
                type: 'danger',
            },
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
        notification: {
            message: 'Chúc mừng, bạn đã đặt lại mật khẩu thành công. Bây giờ hãy đăng nhập nhé!',
            type: 'success',
        },
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

// [GET] auth/google Initiate Google OAuth
const googleLogin = asyncHandler(async (req, res, next) => {
    // Được định tuyến ở router, nên Passport sẽ xử lý
    next(); // Chuyển tiếp cho passport.authenticate
});

// [GET] auth/google/callback Handle OAuth callback
const googleCallback = asyncHandler(async (req, res) => {
    // req.user được Passport gán sau khi xác thực thành công
    if (!req.user) {
        return res.redirect('/auth/login');
    }

    // 1. Tạo token
    const accessToken = tokenUtils.generateAccessToken(
        req.user._id,
        req.user.role,
        req.user.firstName,
        req.user.avatar
    );
    const refreshToken = tokenUtils.generateRefreshToken(req.user._id);

    // 2. Cập nhật refreshToken vào DB
    await User.findByIdAndUpdate(req.user._id, { refreshToken }, { new: true });

    // 3. Gửi cookie
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

    // 4. Chuyển hướng về trang chính hoặc dashboard
    req.session.notification = {
        message:
            'Chào mừng bạn đến với Barrel&Vine! Hãy khám phá thế giới rượu vang cùng mình nhé!',
        type: 'success',
    };

    return res.redirect('/');
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
    googleLogin,
    googleCallback,
};
