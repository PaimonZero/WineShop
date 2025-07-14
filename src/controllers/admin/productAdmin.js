const Product = require('@models/Product');
const Category = require('@models/Category');
const Invoice = require('@models/Invoice');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const env = require('@config/environment');
const uploadCloud = require('@config/cloudinary.config');
const cloudinary = require('cloudinary').v2;

const renderProductList = asyncHandler(async (req, res) => {
    // Dùng để truyền thông báo từ query string giữa các trang
    // Ví dụ:   const message = encodeURIComponent('Tạo sản phẩm thành công!');
    //          window.location.href = `/admin/products?type=success&message=${message}`;
    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    const products = await Product.find().populate('category');

    res.render('admin/products', {
        title: 'Manage Products',
        notification,
        products,
        account: req.user || null,
    });
});

// Render trang tạo sản phẩm mới
const renderCreateProductPage = asyncHandler(async (req, res) => {
    const categories = await Category.find().lean(); // lấy danh mục

    res.render('admin/productCreate', {
        title: 'Create New Product',
        product: null, // không có sản phẩm cụ thể
        categories,
        notification: {
            type: 'info',
            message: 'Fill in product information to create a new one.',
        },
        account: req.user || null,
    });
});

// Xử lý tạo sản phẩm mới
const createProduct = asyncHandler(async (req, res) => {
    // B1: Lấy thông tin từ form
    const { title, description, brand, price, quantity, status, category } = req.body;

    // B2: Kiểm tra bắt buộc
    if (!title || !description || !price || !quantity || !brand) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin!' });
    }

    // B3: Tạo slug từ title
    const slug = slugify(title, { lower: true, strict: true });

    // B4: Lấy link ảnh sau khi Cloudinary upload
    const images = req.files?.map((file) => file.path) || [];

    if (images.length === 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 ảnh!' });
    }

    // B5: Tạo sản phẩm trong MongoDB
    const newProduct = await Product.create({
        title,
        slug,
        description,
        brand,
        price,
        quantity,
        status,
        category,
        images,
    });

    // B6: Trả về hoặc redirect
    return res.status(201).json({
        success: true,
        message: 'Tạo sản phẩm thành công!',
        product: newProduct, // Trả về thông tin sản phẩm mới tạo
        productId: newProduct._id, // Trả về ID sản phẩm mới tạo
        account: req.user || null,
    });
});

// [GET] /admin/product-update/:pid
const renderUpdateProductPage = asyncHandler(async (req, res) => {
    const { pid } = req.params;

    const product = await Product.findById(pid).populate('category');
    const categories = await Category.find();

    if (!product) {
        return res.status(404).render('admin/404', {
            title: 'Product Not Found',
            notification: { type: 'danger', message: 'Sản phẩm không tồn tại.' },
            account: req.user || null,
        });
    }

    //Nếu có thông báo từ query string thì hiển thị, nếu không thì hiển thị thông báo mặc định
    // Ví dụ: /admin/product-update/123?type=success&message=Update%20successful
    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : { type: 'info', message: 'Bạn đang chỉnh sửa thông tin sản phẩm.' };

    res.render('admin/productUpdate', {
        title: 'Update Product',
        product,
        categories,
        notification,
        account: req.user || null,
    });
});

// Xử lý cập nhật sản phẩm
const updateProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;

    // B1: Tìm sản phẩm trong DB
    const product = await Product.findById(pid);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });
    }

    // B2: Lấy dữ liệu từ form
    const { title, description, brand, price, quantity, status, category } = req.body;

    // B3: Kiểm tra dữ liệu bắt buộc
    if (!title || !description || !price || !quantity || !brand) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin!' });
    }

    // B4: Cập nhật thông tin sản phẩm
    product.title = title;
    product.slug = slugify(title, { lower: true, strict: true });
    product.description = description;
    product.brand = brand;
    product.price = price;
    product.quantity = quantity;
    product.status = status;
    product.category = category;

    // B5: Thêm ảnh mới vào danh sách ảnh cũ
    const newImages = req.files?.map((file) => file.path) || [];
    if (newImages.length > 0) {
        // Kiểm tra số lượng ảnh không vượt quá 10
        if (product.images.length + newImages.length > 10) {
            return res
                .status(400)
                .json({ success: false, message: 'Tối đa 10 ảnh cho mỗi sản phẩm!' });
        }
        // Nếu có ảnh mới, thêm vào mảng images
        product.images = [...product.images, ...newImages];
    }

    // B6: Lưu sản phẩm
    await product.save();

    // B7: Phản hồi
    return res.status(200).json({
        success: true,
        message: 'Cập nhật sản phẩm thành công!',
        product,
    });
});

// [DELETE] /admin/product-delete/:pid
const deleteProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;

    const product = await Product.findById(pid);
    if (!product) {
        return res.redirect('/admin/products?type=danger&message=' + encodeURIComponent('Sản phẩm không tồn tại!'));
    }

    // Nếu có ảnh → xoá trên Cloudinary (nếu dùng Cloudinary)
    if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
            const publicId = extractCloudinaryPublicId(imageUrl);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.warn(`Không thể xoá ảnh ${publicId} trên Cloudinary`);
                }
            }
        }
    }

    // Xoá sản phẩm khỏi MongoDB
    await Product.findByIdAndDelete(pid);

    // ✅ Redirect thay vì render lại
    return res.redirect('/admin/products?type=success&message=' + encodeURIComponent('Đã xoá sản phẩm thành công!'));
});

// Xoá ảnh sản phẩm khỏi Cloudinary và cập nhật sản phẩm trong MongoDB
const deleteProductImage = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const { imageUrl } = req.body;

    if (!pid || !imageUrl) {
        return res.status(400).json({ success: false, message: 'Missing product ID or image URL' });
    }

    const publicId = extractCloudinaryPublicId(imageUrl);
    if (!publicId) {
        return res.status(400).json({ success: false, message: 'Invalid Cloudinary image URL' });
    }

    try {
        // Xóa ảnh khỏi Cloudinary
        await cloudinary.uploader.destroy(publicId);

        // Cập nhật sản phẩm: loại bỏ ảnh khỏi mảng images
        const updatedProduct = await Product.findByIdAndUpdate(
            pid,
            { $pull: { images: imageUrl } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found!' });
        }

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully!',
            product: updatedProduct,
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting image',
        });
    }
});

// Helper để tách public_id từ URL Cloudinary
const extractCloudinaryPublicId = (url) => {
    try {
        const parts = url.split('/');
        const filename = parts[parts.length - 1]; // ví dụ: abcxyz.jpg
        const publicId = filename.substring(0, filename.lastIndexOf('.'));
        const folderPath = parts.slice(parts.indexOf('upload') + 1, parts.length - 1).join('/');
        return folderPath ? `${folderPath}/${publicId}` : publicId;
    } catch (err) {
        console.error('Error extracting publicId:', err);
        return null;
    }
};

module.exports = {
    deleteProductImage,
    renderProductList,
    renderCreateProductPage,
    createProduct,
    renderUpdateProductPage,
    updateProduct,
    deleteProduct,
};
