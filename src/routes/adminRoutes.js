const router = require('express').Router();
const tokenUtils = require('@middlewares/jwt');
const uploadCloud = require('@config/cloudinary.config');
const ctrlsProduct = require('@controllers/admin/productAdmin');
const ctrlsCategory = require('@controllers/admin/categoryAdmin');
const ctrlsCoupon = require('@controllers/admin/couponAdmin');
const ctrlsUser = require('@controllers/admin/userAdmin');
const ctrlsInvoice = require('@controllers/admin/orderAdmin');
const ctrlsDashboard = require('@controllers/admin/dashboardAdmin');
const asyncHandler = require('express-async-handler');

// test controller
const Product = require('@models/Product');
const Category = require('@models/Category');
const Coupon = require('@models/Coupon');
const Invoice = require('@models/Invoice');
const User = require('@models/User');

// Set default layout for admin routes
router.use((req, res, next) => {
    res.locals.layout = 'layouts/admin';
    next();
});

// Route to dashboard view
router.get('/dashboard', ctrlsDashboard.renderDashboard);

// ______ Product Management Routes ______
// Route to view products
router.get('/products', ctrlsProduct.renderProductList);
// Route to view create product
router.get('/product-create', ctrlsProduct.renderCreateProductPage);
// Route to create product
router.post('/product-create', uploadCloud.array('images', 10), ctrlsProduct.createProduct);
// Route to view edit product
router.get('/product-update/:pid', ctrlsProduct.renderUpdateProductPage);
// Route to update product
router.post('/product-update/:pid', uploadCloud.array('images', 10), ctrlsProduct.updateProduct);
// Route to delete product
router.post('/product-delete/:pid', ctrlsProduct.deleteProduct);
// Route to delete product image
router.delete('/product-delete-image/:pid', ctrlsProduct.deleteProductImage);

// ______ Category Management Routes ______
// Route to view categories
router.get('/categories', ctrlsCategory.renderCategoriesPage);
// Route to create category
router.post('/category-create', ctrlsCategory.createCategory);
// Route to update category
router.post('/category-update/:cid', ctrlsCategory.updateCategory);
// Route to delete category
router.post('/category-delete/:cid', ctrlsCategory.deleteCategory);

// ______ Coupon Management Routes ______
// Route to view coupons
router.get('/coupons', ctrlsCoupon.renderCouponsPage);
// Route to create coupon
router.post('/coupon-create', ctrlsCoupon.createCoupon);
// Route to update coupon
router.post('/coupon-update/:cid', ctrlsCoupon.updateCoupon);
// Route to delete coupon
router.post('/coupon-delete/:cid', ctrlsCoupon.deleteCoupon);

// ______ User Management Routes ______
// Route to view users
router.get('/users', ctrlsUser.renderUsersPage);
// Route to create user
router.post('/user-create', ctrlsUser.createUser);
// Route to update user
router.post('/user-update', ctrlsUser.updateUserInAdminPage);

//______ Order Management Routes ______
// Route to view orders
router.get('/orders', ctrlsInvoice.renderOrdersPage);
// Route to view order details
router.get('/order-details/:id', ctrlsInvoice.renderOrderDetailsPage);
// Route to update status
router.post('/order-update/status/:id', ctrlsInvoice.updateOrderStatus);
// Route to delete order
router.post('/order-delete/:id', ctrlsInvoice.deleteOrder);
// Route to create order
router.post('/order-create', ctrlsInvoice.createNewOrder);

module.exports = router;
