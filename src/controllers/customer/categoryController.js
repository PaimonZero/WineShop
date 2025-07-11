const Product = require('@models/Product');
const Category = require('@models/Category');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get category page for customer
 * @route   GET /category
 * @access  Public
 */
const getCategoryPage = asyncHandler(async (req, res) => {
    const {
        category: categorySlug,
        sort,
        page: currentPage,
        s: searchQuery,
        minPrice,
        maxPrice,
    } = req.query;

    const page = +currentPage || 1;
    const limit = 9; // 9 products per page
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    // Filter by category slug
    if (categorySlug) {
        const category = await Category.findOne({ slug: categorySlug });
        if (category) {
            filter.category = category._id;
        }
    }

    // Filter by search query on product title
    if (searchQuery) {
        filter.title = { $regex: searchQuery, $options: 'i' };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) {
            filter.price.$gte = +minPrice;
        }
        if (maxPrice) {
            filter.price.$lte = +maxPrice;
        }
    }

    // Build sort options
    const sortOptions = {};
    switch (sort) {
        case 'price-asc':
            sortOptions.price = 1;
            break;
        case 'price-desc':
            sortOptions.price = -1;
            break;
        case 'name-asc':
            sortOptions.title = 1;
            break;
        case 'name-desc':
            sortOptions.title = -1;
            break;
        default:
            sortOptions.createdAt = -1; // Default sort by newest
    }

    // Execute queries to get products and total count
    const products = await Product.find(filter)
        .populate('category')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get all categories for the sidebar filter
    const allCategories = await Category.find().sort({ title: 1 });

    const notification = req.session.notification;
    delete req.session.notification;

    // Render the category page with data
    res.render('customer/category', {
        title: 'Danh mục sản phẩm',
        notification: notification || null,
        products,
        allCategories,
        totalPages,
        currentPage: page,
        totalProducts,
        selectedCategory: categorySlug,
        currentSort: sort,
        searchQuery,
        minPrice,
        maxPrice,
        account: req.user || null,
    });
});

module.exports = {
    getCategoryPage,
};
