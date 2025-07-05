const router = require('express').Router();
const ctrls = require('@controllers/customer/checkOutController');
const tokenUtils = require('@middlewares/jwt');

// [POST] Get checkout page
router.post('/', tokenUtils.verifyAccessToken, ctrls.getCheckoutPage);

// [POST] Get checkout page
router.post('/create-invoice', tokenUtils.verifyAccessToken, ctrls.createInvoice);

module.exports = router;
