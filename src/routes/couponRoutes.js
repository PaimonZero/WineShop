const router = require('express').Router();
const ctrls = require('@controllers/couponController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Get a coupon
router.get('/check', ctrls.getCoupon);  
// [GET] Get all coupons
router.get('/', ctrls.getCoupons);
// [POST] Create new coupon
router.post('/', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.createNewCoupon);
// [PUT] Update coupon
router.put('/:cid', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.updateCoupon);
// [DELETE] Delete coupon
router.delete('/:cid', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.deleteCoupon);

module.exports = router;