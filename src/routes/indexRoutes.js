const userRouter = require('@routes/userRoutes');
const productRouter = require('@routes/productRoutes');
const categoryRouter = require('@routes/categoryRoutes');
const couponRouter = require('@routes/couponRoutes');
const invoiceRouter = require('@routes/invoiceRoutes');
const adminRouter = require('@routes/adminRoutes');

const customerHomePageRouter = require('@routes/customer/homePageRoutes');
const customerProductDetailRouter = require('@routes/customer/productDetailRoutes');
const customerShoppingCartRouter = require('@routes/customer/shoppingCartRoutes');
const customerCheckOutRouter = require('@routes/customer/checkOutRoutes');
const customerOrderHistoryRouter = require('@routes/customer/orderHistoryRoutes');
const customerCategoryRouter = require('@routes/customer/categoryRoutes');
const customerOrderDetailRouter = require('@routes/customer/orderDetailRoutes');
const customerAccountSettingRouter = require('@routes/customer/accountSettingRoutes');
const customerContactRouter = require('@routes/customer/contactRoutes');
const customerDashboardRouter = require('@routes/customer/customerDashboardRoutes');

const authRouter = require('@routes/authRoutes');
const { notFound, errorHandler } = require('@middlewares/errorHandler');
const tokenUtils = require('@middlewares/jwt');

const initRoutes = (app) => {
    // page user
    app.use('/api/user', userRouter);
    // page product
    app.use('/api/product', productRouter);
    // page category
    app.use('/api/category', categoryRouter);
    //page coupon
    app.use('/api/coupon', couponRouter);
    // page invoice
    app.use('/api/invoice', invoiceRouter);
    // page admin
    app.use('/api/admin', adminRouter);

    // page UI
    app.use('/', customerHomePageRouter);
    app.use('/product', customerProductDetailRouter);
    app.use('/shopping-cart', customerShoppingCartRouter);
    // app.use('/shopping-cart', tokenUtils.verifyAccessToken, customerShoppingCartRouter);
    app.use('/category', customerCategoryRouter);
    app.use('/check-out', customerCheckOutRouter);
    app.use('/order-history', customerOrderHistoryRouter);
    app.use('/order-detail', customerOrderDetailRouter);
    app.use('/account-setting', customerAccountSettingRouter);
    app.use('/contact', customerContactRouter);
    app.use('/customer-dashboard', customerDashboardRouter);
    // page auth
    app.use('/auth', authRouter);

    // handle 404 - This should be the last route
    app.use(notFound);
    app.use(errorHandler);
};

module.exports = initRoutes;
