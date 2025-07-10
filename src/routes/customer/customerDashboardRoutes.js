const router = require('express').Router();
const customerDashboardController = require('@controllers/customer/customerDashboardController');
const tokenUtils = require('@middlewares/jwt');

// GET /customer-dashboard
// This route is protected, only logged-in users can access it.
router.get('/', tokenUtils.verifyAccessToken, customerDashboardController.getCustomerDashboard);

module.exports = router;
