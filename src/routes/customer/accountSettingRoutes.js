const router = require('express').Router();
const ctrls = require('@controllers/customer/accountSettingController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Lấy trang cài đặt tài khoản
router.get('/', tokenUtils.verifyAccessToken, ctrls.getAccountSettingPage);

// [POST] Cập nhật thông tin tài khoản
router.post('/', tokenUtils.verifyAccessToken, ctrls.updateAccountSettings);

// [POST] Cập nhật mật khẩu
router.post('/change-password', tokenUtils.verifyAccessToken, ctrls.updatePassword);

module.exports = router;
