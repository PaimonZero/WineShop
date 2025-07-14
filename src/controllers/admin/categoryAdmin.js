const Category = require('@models/Category');
const Product = require('@models/Product');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

// Render categories page
const renderCategoriesPage = asyncHandler(async (req, res) => {
    // Dùng để truyền thông báo từ query string giữa các trang
    // Ví dụ:   const message = encodeURIComponent('Tạo sản phẩm thành công!');
    //          window.location.href = `/admin/products?type=success&message=${message}`;
    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    const categories = await Category.find().lean(); // Lấy danh sách danh mục
    if (categories.length === 0) {
        return res.render('admin/categories', {
            title: 'Manage Categories',
            categories: [],
            notification: { type: 'info', message: 'No categories found.' },
        });
    }

    // Thêm thông tin về số lượng sản phẩm trong mỗi danh mục và totalQuantity
    for (const category of categories) {
        const productCount = await Product.countDocuments({ category: category._id });
        category.productCount = productCount;

        // Tính tổng quantity của các sản phẩm trong danh mục này
        const result = await Product.aggregate([
            { $match: { category: category._id } },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: '$quantity' }
                }
            }
        ]);
        // Gán giá trị tổng (nếu có) vào category
        category.totalQuantity = result[0]?.totalQuantity || 0;
    }

    res.render('admin/categories', {
        title: 'Manage Categories',
        categories,
        notification,
    });
});

// [POST] /admin/category-create
const createCategory = asyncHandler(async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.redirect('/admin/categories?type=danger&message=Vui lòng nhập tên danh mục!');
    }

    const existing = await Category.findOne({ title });
    if (existing) {
        return res.redirect('/admin/categories?type=danger&message=Danh mục đã tồn tại!');
    }

    const newCategory = await Category.create({
        title,
        slug: slugify(title, { lower: true, strict: true }),
    });

    return res.redirect(`/admin/categories?type=success&message=Tạo danh mục thành công!`);
});

// [PUT] /admin/category-update/:cid
const updateCategory = asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const { title } = req.body;

    const category = await Category.findById(cid);
    if (!category) {
        return res.redirect('/admin/categories?type=danger&message=Danh mục không tồn tại!');
    }

    category.title = title;
    category.slug = slugify(title, { lower: true, strict: true });
    await category.save();

    return res.redirect(`/admin/categories?type=success&message=Cập nhật danh mục thành công!`);
});

// [DELETE] /admin/category-delete/:cid
const deleteCategory = asyncHandler(async (req, res) => {
    const { cid } = req.params;

    const category = await Category.findById(cid);
    if (!category) {
        return res.redirect('/admin/categories?type=danger&message=Danh mục không tồn tại!');
    }

    // Kiểm tra xem danh mục có sản phẩm nào không
    const productCount = await Product.countDocuments({ category: cid });
    if (productCount > 0) {
        return res.redirect('/admin/categories?type=danger&message=Không thể xoá danh mục vì có sản phẩm thuộc danh mục này!');
    }

    await Category.findByIdAndDelete(cid);

    return res.redirect(`/admin/categories?type=success&message=Xoá danh mục thành công!`);
});

module.exports = {
    renderCategoriesPage,
    createCategory,
    updateCategory,
    deleteCategory,
};
