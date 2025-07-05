const router = require('express').Router();
const ctrls = require('@controllers/invoiceController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Get user invoices
router.get('/', tokenUtils.verifyAccessToken, ctrls.getUserInvoices);
// [GET] Get all invoices (admin only)
router.get('/admin', tokenUtils.verifyAccessToken, ctrls.getInvoices);
// [POST] Create a new order (all from cart)
router.post('/', tokenUtils.verifyAccessToken, ctrls.createOrder);
// [PUT] Update payment status
router.put(
    '/payment-status/:oid',
    [tokenUtils.verifyAccessToken, tokenUtils.isAdmin],
    ctrls.updatePaymentStatus
);
// [PUT] Cancel Invoice
router.put(
    '/cancel-invoice/:oid',
    tokenUtils.verifyAccessToken,
    ctrls.updateToCancelDeliveryStatus
);
// [PUT] Update delivery status
router.put(
    '/delivery-status/:oid',
    [tokenUtils.verifyAccessToken, tokenUtils.isAdmin],
    ctrls.updateDeliveryStatus
);

module.exports = router;
