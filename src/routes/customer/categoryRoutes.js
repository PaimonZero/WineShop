const router = require('express').Router();
const categoryCtrl = require('@controllers/customer/categoryController');
const tokenUtils = require('@middlewares/jwt');


// Route to display the category page with products
// It can handle queries like /category?category=vang-do&sort=price-asc&page=2
router.get('/', tokenUtils.verifyLogedin, categoryCtrl.getCategoryPage);

module.exports = router;
