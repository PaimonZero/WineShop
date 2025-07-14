const Product = require('@models/Product');
const Invoice = require('@models/Invoice');
const asyncHandler = require('express-async-handler');

const getCustomerHomePage = asyncHandler(async (req, res) => {
    // get 4 featured products
    let featuredProducts;
    try {
        featuredProducts = await Product.find().sort({ price: -1 }).limit(4);
    } catch (error) {
        featuredProducts = [];
    }

    //get 3 attractive promotional productRoutes
    let promotionalProducts;
    try {
        promotionalProducts = await Product.find().sort({ price: 1 }).limit(3);
    } catch (error) {
        promotionalProducts = [];
    }

    //get 3 best selling products
    let sellingProducts;
    try {
        sellingProducts = await Invoice.aggregate([
            {
                $match: {
                    deliveryStatus: { $ne: 'cancelled' },
                },
            },
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.productId',
                    totalSold: { $sum: '$products.quantity' },
                    priceAtPurchase: { $avg: '$products.price' },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $replaceRoot: { newRoot: '$product' },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 3 },
        ]);
    } catch (error) {
        sellingProducts = [];
    }

    //get 3 best rated products
    let ratedProducts;
    try {
        ratedProducts = await Product.find().sort({ totalRating: -1 }).limit(3);
    } catch (error) {
        ratedProducts = [];
    }

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('customer/homepage', {
        title: 'WineShop Home Page',
        account: req.user || null,
        notification: notification || null,
        featuredProducts,
        promotionalProducts,
        sellingProducts,
        ratedProducts,
    });
});

module.exports = {
    getCustomerHomePage,
};
