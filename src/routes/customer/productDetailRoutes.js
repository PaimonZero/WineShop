const router = require('express').Router();
const ctrls = require('@controllers/customer/productDetailController');

// [GET] Get product detail page for customer
router.get('/:pid/:slug', ctrls.getProductDetailPage);

module.exports = router;
