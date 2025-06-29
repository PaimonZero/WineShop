const userRouter = require('@routes/userRoutes');
const productRouter = require('@routes/productRoutes');
const categoryRouter = require('@routes/categoryRoutes');
const couponRouter = require('@routes/couponRoutes');
const invoiceRouter = require('@routes/invoiceRoutes');
const adminRouter = require('@routes/adminRoutes');
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

    // handle 404 - This should be the last route
    app.use(notFound);
    app.use(errorHandler);
};

module.exports = initRoutes;
