const router = require('express').Router();
const ctrls = require('@controllers/customer/productDetailController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Get product detail page for customer
router.get('/:pid/:slug', tokenUtils.verifyLogedin, ctrls.getProductDetailPage);

module.exports = router;
