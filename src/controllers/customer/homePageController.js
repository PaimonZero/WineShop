const Product = require('@models/Product');
const asyncHandler = require('express-async-handler');

const getCustomerHomePage = asyncHandler(async (req, res) => {
    // get 4 featured products
    let featuredProducts;
    try {
        featuredProducts = await Product.find().limit(4);
    } catch (error) {
        featuredProducts = [];
    }

    //get 3 attractive promotional productRoutes
    let promotionalProducts;
    try {
        promotionalProducts = await Product.find().limit(3);
    } catch (error) {
        promotionalProducts = [];
    }

    //get 3 best selling products
    let sellingProducts;
    try {
        sellingProducts = await Product.find().limit(3);
    } catch (error) {
        sellingProducts = [];
    }

    //get 3 best rated products
    let ratedProducts;
    try {
        ratedProducts = await Product.find().limit(3);
    } catch (error) {
        ratedProducts = [];
    }

    res.render('customer/homepage', {
        title: 'WineShop Home Page',
        account: req.user ? { role: req.user.role } : null,
        featuredProducts,
        promotionalProducts,
        sellingProducts,
        ratedProducts,
    });
});

module.exports = {
    getCustomerHomePage,
};
