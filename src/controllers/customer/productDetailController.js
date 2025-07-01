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
    const product = await Product.findById(pid).populate({
        path: 'category',
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
        .limit(4); // Get up to 4 related products

    console.log(relatedProducts);

    res.render('customer/product-detail', {
        title: product.title,
        product,
        returnTo: req.originalUrl,
        relatedProducts,
        account: req.user ? { role: req.user.role, ...req.user.toObject() } : null,
    });
});

module.exports = {
    getProductDetailPage,
};
