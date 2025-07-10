const User = require('@models/User');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get account setting page for customer
 * @route   GET /account-setting
 * @access  Private
 */
const getAccountSettingPage = asyncHandler(async (req, res) => {
    const userDetails = await User.findById(req.user._id).select('-password -refreshToken -role');
    if (userDetails) {
        userDetails.fullName = userDetails.lastName + ' ' + userDetails.firstName;
    }

    res.render('customer/account-setting', {
        title: 'Account Setting',
        account: req.user ? { role: req.user.role } : null,
        userDetails,
    });
});

/**
 * @desc    Update account settings for customer
 * @route   POST /account-setting
 * @access  Private
 */
const updateAccountSettings = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { firstName, lastName, email, mobile, address } = req.body;

    // Bạn có thể thêm validation chi tiết hơn ở đây
    if (!firstName || !lastName || !mobile) {
        // Nếu có lỗi, render lại trang với thông báo
        const userDetails = await User.findById(_id).select('-password -refreshToken -role');
        userDetails.fullName = userDetails.lastName + ' ' + userDetails.firstName;
        return res.render('customer/account-setting', {
            title: 'Account Setting',
            account: req.user ? { role: req.user.role } : null,
            userDetails,
            errorMessage: 'Vui lòng điền đầy đủ các trường bắt buộc.',
        });
    }

    await User.findByIdAndUpdate(
        _id,
        { firstName, lastName, email, mobile, address },
        { new: true, runValidators: true }
    );

    // Redirect lại trang cài đặt tài khoản sau khi cập nhật thành công
    res.redirect('/account-setting');
});

/**
 * @desc    Update customer password
 * @route   POST /account-setting/change-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const userDetailsForRender = await User.findById(_id).select('-password -refreshToken -role');
    if (userDetailsForRender) {
        userDetailsForRender.fullName =
            userDetailsForRender.lastName + ' ' + userDetailsForRender.firstName;
    }

    const renderWithMsg = (key, message) => {
        res.render('customer/account-setting', {
            title: 'Account Setting',
            account: req.user ? { role: req.user.role } : null,
            userDetails: userDetailsForRender,
            [key]: message,
        });
    };

    if (!oldPassword || !newPassword || !confirmPassword) {
        return renderWithMsg('passwordErrorMessage', 'Vui lòng điền đầy đủ các trường mật khẩu.');
    }

    if (newPassword !== confirmPassword) {
        return renderWithMsg('passwordErrorMessage', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
    }

    const user = await User.findById(_id);
    const isMatch = await user.isCorrectPassword(oldPassword);

    if (!isMatch) {
        return renderWithMsg('passwordErrorMessage', 'Mật khẩu cũ không chính xác.');
    }

    user.password = newPassword;
    await user.save();

    return renderWithMsg('passwordSuccessMessage', 'Cập nhật mật khẩu thành công!');
});

module.exports = {
    getAccountSettingPage,
    updateAccountSettings,
    updatePassword,
};
