const router = require('express').Router();
const ctrls = require('@controllers/customer/homePageController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Get customer home page
router.get('/', tokenUtils.verifyLogedin, ctrls.getCustomerHomePage);

module.exports = router;
