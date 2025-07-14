const Product = require('@models/Product');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get product detail page for customer
 * @route   GET /product/:pid/:slug
 * @access  Public
 */
const getProductDetailPage = asyncHandler(async (req, res) => {
    const { pid } = req.params;

    // Find the product by ID and populate the user info for ratings
    const product = await Product.findById(pid)
        .populate({
            path: 'category',
        })
        .populate({
            path: 'ratings.postedBy',
            model: 'User',
            select: 'firstName lastName avatar',
        });

    if (!product) {
        // If product not found, render a 404 page
        return res.status(404).render('error/404', { title: 'Page Not Found' });
    }

    // Find related products (e.g., in the same category, excluding the current one)
    const relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: pid }, // Exclude the current product
    })
        .populate({
            path: 'category',
        })
        .populate({
            path: 'ratings.postedBy',
            model: 'User',
            select: 'firstName lastName avatar',
        })
        .limit(4); // Get up to 4 related products

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('customer/product-detail', {
        title: product.title,
        notification: notification || null,
        product,
        returnTo: req.originalUrl,
        relatedProducts,
        account: req.user || null,
    });
});

module.exports = {
    getProductDetailPage,
};
