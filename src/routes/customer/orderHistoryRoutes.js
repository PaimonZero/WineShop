const router = require('express').Router();
const ctrls = require('@controllers/customer/orderHistoryController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Get order history page
router.get('/', tokenUtils.verifyAccessToken, ctrls.getOrderHistoryPage);

module.exports = router;
