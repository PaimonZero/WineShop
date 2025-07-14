const User = require('@models/User');
const Product = require('@models/Product');
const asyncHandler = require('express-async-handler');
const tokenUtils = require('@middlewares/jwt');
const jwt = require('jsonwebtoken');
const { mailResetPassword } = require('@src/templates/resetPasswordEmail');
const env = require('@config/environment');
const sendMail = require('@utils/sendMail');
const crypto = require('crypto');

// [POST] register user
const register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, mobile } = req.body;
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
            success: false,
            mes: 'Missing input!',
        });
    }
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({
            success: false,
            mes: 'User already exists!',
        });
    } else {
        // Create new user
        const newUser = await User.create({
            email,
            password,
            firstName,
            lastName,
            mobile,
        });
        return res.status(201).json({
            success: newUser ? true : false,
            mes: newUser ? 'User created successfully!' : 'Failed to create user!',
        });
    }
});

// [POST] login user
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            mes: 'Missing input!',
        });
    }
    // Check if user exists
    const userResponse = await User.findOne({ email });
    if (!userResponse) {
        return res.status(400).json({
            success: false,
            mes: 'User not found!',
        });
    }
    // Check password (có sử dụng async method isCorrectPassword)
    const isMatch = await userResponse.isCorrectPassword(password);
    if (!isMatch) {
        return res.status(400).json({
            success: false,
            mes: 'Invalid credentials!',
        });
    }
    // Token generation
    const accessToken = tokenUtils.generateAccessToken(userResponse._id, userResponse.role, userResponse.firstName, userResponse.avatar);
    const refreshToken = tokenUtils.generateRefreshToken(userResponse._id);
    // Save refresh token to user
    await User.findByIdAndUpdate(userResponse._id, { refreshToken }, { new: true });
    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 60 * 60 * 1000, // 1 hour
    });
    // Return user data (excluding password, role and refreshToken)
    const { password: _, role, refreshToken: _refresh, ...userData } = userResponse.toObject();
    return res.status(200).json({
        success: true,
        accessToken,
        userData,
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
            ? tokenUtils.generateAccessToken(response._id, response.role, response.firstName, response.avatar)
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
    return res.status(200).json({
        success: true,
        mes: 'Logout successful!',
    });
});

// [GET] forgot password
const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.query; // Lấy email từ query string
    if (!email) throw new Error('Email is required!');
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found!');
    // Create password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    const content = {
        subject: 'Forgot password notification from your Barrel&Vine account',
        html: mailResetPassword(resetToken),
        text: `You have requested to reset your password. Please use the following link: ${env.CLIENT_URL}/user/reset-password/${resetToken}`,
    };

    // Send email
    const rs = await sendMail(email, content);
    return res.status(200).json({
        success: true,
        mes: 'Reset password email sent successfully!',
        rs,
    });
});

// [PUT] reset password
const resetPassword = asyncHandler(async (req, res) => {
    const { password, token } = req.body;
    if (!token) throw new Error('Token is required!');
    if (!password) throw new Error('Password is required!');
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new Error('Invalid or expired reset token!');
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now().toString();
    await user.save();
    return res.status(200).json({
        success: user ? true : false,
        mes: user ? 'Password reset successfully!' : 'Failed to reset password!',
    });
});

// [GET] get all users (for admin)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password -refreshToken -role');
    return res.status(200).json({
        success: users ? true : false,
        users,
    });
});

// [DELETE] delete user (for admin)
const deleteUser = asyncHandler(async (req, res) => {
    const { _id } = req.query; // nằm sau ?
    if (!_id) throw new Error('User ID is required!');
    const response = await User.findByIdAndDelete(_id);
    return res.status(200).json({
        success: response ? true : false,
        deleteUser: response ? `User with email ${response.email} deleted` : 'User not found!',
    });
});

// [PUT] update user (for all users)
// [], {} là truthy trong JavaScript → ![] và !{} đều là false => Ko thể dùng ! để kiểm tra rỗng
const updateUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (!_id || Object.keys(req.body).length === 0) {
        throw new Error('User ID and update data are required!');
    }

    // Loại bỏ trường "role" nếu người dùng cố gắng sửa
    if ('role' in req.body) {
        delete req.body.role;
    }

    const response = await User.findByIdAndUpdate(_id, req.body, {
        new: true,
        runValidators: true,
    }).select('-password -refreshToken -role');
    return res.status(200).json({
        success: !!response,
        updatedUser: response || 'User not found or update failed!',
    });
});

// [PUT] update user (for admin)
const updateUserByAdmin = asyncHandler(async (req, res) => {
    const { _id } = req.params;
    if (!_id || Object.keys(req.body).length === 0) {
        throw new Error('User ID and update data are required!');
    }
    const response = await User.findByIdAndUpdate(_id, req.body, {
        new: true,
        runValidators: true,
    }).select('-password -refreshToken -role');
    return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : 'User not found or update failed!',
    });
});

const updateUserAddress = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (!req.body.address) throw new Error('Address is required!');

    const user = await User.findById(_id);
    if (user) {
        // Kiểm tra xem địa chỉ đã tồn tại chưa
        const addressExists = user.address.some(
            (addr) => addr.toLowerCase().trim() === req.body.address.toLowerCase().trim()
        );
        if (addressExists) {
            return res.status(400).json({
                success: false,
                mes: 'Address already exists!',
            });
        }
    }

    const response = await User.findByIdAndUpdate(
        _id,
        { $push: { address: req.body.address } },
        { new: true }
    );
    res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : 'User not found or update address failed!',
    });
});

// [POST] update cart (add or update product in cart) ( cho button "Add to cart" trong trang sản phẩm )
const updateCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    const { productId, quantity, returnTo } = req.body;
    if (!productId || !quantity) throw new Error('ProductId and quantity are required!');
    const user = await User.findById(_id);
    const alreadyProduct = user.cart.find((item) => item.product.toString() === productId);
    const qty = parseInt(quantity); // Ép kiểu an toàn
    if (alreadyProduct) {
        // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
        alreadyProduct.quantity += qty;
        await user.save();
    } else {
        // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
        user.cart.push({ product: productId, quantity: qty });
        await user.save();
    }

    req.session.notification = {
        message: 'Đã thêm sản phẩm vào giỏ hàng thành công!',
        type: 'success',
    };
    res.redirect(returnTo);
});

// [PUT] update cart quantity ( cho button "Increase" và "Decrease" trong trang giỏ hàng )
// TODO: có ví dụ sử dụng ajax (js in ejs page) ko cần reload trang
const updateCartQuantity = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { productId, action } = req.body;
    if (!productId || !action) {
        throw new Error('ProductId and action are required!');
    }

    const user = await User.findById(_id);
    const cartItem = user.cart.find((item) => item.product.toString() === productId);
    if (!cartItem) {
        return res.status(400).json({ success: false, mes: 'Product not found in cart!' });
    }

    const productCurrent = await Product.findById(productId);
    if (action === 'increase') {
        if (cartItem.quantity >= productCurrent.quantity) {
            return res.status(400).json({
                success: false,
                mes: `Only ${productCurrent.quantity} in stock!`,
            });
        }
        cartItem.quantity += 1;
    } else if (action === 'decrease') {
        cartItem.quantity -= 1;
        if (cartItem.quantity < 1) {
            user.cart = user.cart.filter((item) => item.product.toString() !== productId);
        }
    } else {
        return res.status(400).json({ success: false, mes: 'Invalid action!' });
    }

    await user.save();
    return res.status(200).json({
        success: true,
        mes: 'Cart updated successfully!',
        cart: user.cart,
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
    getAllUsers,
    deleteUser,
    updateUser,
    updateUserByAdmin,
    updateUserAddress,
    updateCart,
    updateCartQuantity,
};
