const router = require('express').Router();
const ctrls = require('@controllers/customer/checkOutController');
const tokenUtils = require('@middlewares/jwt');

// [POST] Get checkout page
router.post('/', tokenUtils.verifyAccessToken, ctrls.getCheckoutPage);

// [POST] Create a invoice  and return order-detail page
router.post('/create-invoice', tokenUtils.verifyAccessToken, ctrls.createInvoice);

// [GET] Get reponse from vnpay and return ui page
router.get('/vnpay_ipn', ctrls.handleVNPayIPN);

// [GET] Get reponse from vnpay and return ui page
router.get('/vnpay-return', ctrls.handleVNPayReturn);

module.exports = router;
