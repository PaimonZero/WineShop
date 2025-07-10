const router = require('express').Router();
const ctrls = require('@controllers/customer/contactController');
const tokenUtils = require('@middlewares/jwt');

// [GET] Get contact page
router.get('/', tokenUtils.verifyLogedin, ctrls.getContactPage);

module.exports = router;
