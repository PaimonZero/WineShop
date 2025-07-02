const router = require('express').Router();
const ctrls = require('@controllers/customer/shoppingCartController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Get shopping cart page
router.get('/', tokenUtils.verifyAccessToken, ctrls.getShoppingCartPage);
router.delete('/delete-product/:pid', tokenUtils.verifyAccessToken, ctrls.deleteProductFromCart);


module.exports = router;
