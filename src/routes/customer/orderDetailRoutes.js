const router = require('express').Router();
const ctrls = require('@controllers/customer/orderDetailController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Get order detail page
router.get('/', tokenUtils.verifyAccessToken, ctrls.getOrderDetailPage);

module.exports = router;
