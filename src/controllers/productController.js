const Product = require('@models/Product');
const Invoice = require('@models/Invoice');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const env = require('@config/environment');

// [POST] create product
// [], {} là truthy trong JavaScript → ![] và !{} đều là false => Ko thể dùng ! để kiểm tra rỗng
const createProduct = asyncHandler(async (req, res) => {
    if (Object.keys(req.body).length === 0) throw new Error('Product data is required!');
    if (req.body && req.body.title) {
        req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    }
    const newProduct = await Product.create(req.body);
    return res.status(201).json({
        success: newProduct ? true : false,
        product: newProduct ? newProduct : 'Product creation failed!',
    });
});

// [GET] Get product by ID
const getProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const product = await Product.findById(pid); // .populate('category', 'name')
    return res.status(201).json({
        success: product ? true : false,
        productData: product ? product : 'Product not found!',
    });
});

// [GET] Get all products
// Filter, sort, pagination
const getProducts = asyncHandler(async (req, res) => {
    const queries = { ...req.query }; // Copy query to new object, đã cấu hình qs trong App.js

    // Tách các trường đặc biệt ra khỏi query
    const excludeFields = ['sort', 'page', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queries[el]); // queries chỉ còn lại các trường liên quan đến filters

    // Format lại các operation cho đúng cú pháp mongoose
    let queryString = JSON.stringify(queries);
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, (matchedEl) => `$${matchedEl}`);
    const formatQueryString = JSON.parse(queryString);
    // console.log(formatQueryString); // Log debug    // chính xác: { title: 'nếp', price: { '$gte': '1000' } }

    // Filtering
    // Nếu có lọc theo title, dùng regex (không phân biệt hoa thường)
    if (queries?.title) formatQueryString.title = { $regex: queries.title, $options: 'i' };
    let queryCommand = Product.find(formatQueryString);

    // Sorting
    // abc,efg => [abc,efg] => abc efg
    // Note:Khi truyền sort, thêm + or - trước các giá trị sort để tăng dần ỏ giảm dần
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        queryCommand = queryCommand.sort(sortBy);
    }

    // Fields limiting
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        queryCommand = queryCommand.select(fields);
    }

    // Pagination
    // limit: số object lấy về 1 lần gọi api
    // skip (offset): số bản ghi bỏ qua
    // +2 => 2 (chuyển đổi thành số)
    // +word => NaN
    const page = +req.query.page || 1;
    const limit = +req.query.limit || env.LIMIT_PRODUCT;
    const skip = (page - 1) * limit;
    queryCommand.skip(skip).limit(limit);

    // Thực thi truy vấn (Execute query)
    try {
        const response = await queryCommand;
        const counts = await Product.countDocuments(formatQueryString);
        return res.status(200).json({
            success: response ? true : false,
            countTotal: counts,
            page: page,
            products: response ? response : 'Cannot get products!',
        });
    } catch (error) {
        throw new Error(error.message);
    }
});

// [PUT] Update product by ID (admin only)
const updateProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    if (Object.keys(req.body).length === 0) throw new Error('Product data is required!');
    // Tạo slug nếu có title mới
    if (req.body.title) {
        req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    }
    const updated = await Product.findByIdAndUpdate(pid, req.body, {
        new: true,
        runValidators: true,
    });
    return res.status(200).json({
        success: updated ? true : false,
        productData: updated || 'Cannot update product!',
    });
});

// [DELETE] Delete product by ID (admin only)
const deleteProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const deleted = await Product.findByIdAndDelete(pid);
    return res.status(200).json({
        success: deleted ? true : false,
        mes: deleted ? `Product "${deleted.title}" was deleted!` : 'Cannot delete product!',
    });
});

// [POST] Ratings for product
const ratings = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { pid } = req.params;
    const { star, comment } = req.body;
    if (!star || !pid) throw new Error('Missing input!');

    // Tìm sản phẩm
    const ratingProduct = await Product.findById(pid);
    if (!ratingProduct) {
        req.session.notification = {
            message: 'Bạn cần mua sản phẩm này trước khi đánh giá nhé!',
            type: 'danger',
        };

        res.redirect(req.get('Referer') || '/');
    }

    // Kiểm tra đã mua hàng chưa và lấy invoice
    const invoice = await Invoice.findOne({
        userId: _id,
        deliveryStatus: 'completed',
        products: { $elemMatch: { productId: pid } },
    });
    if (!invoice) {
        req.session.notification = {
            message: 'Bạn cần mua sản phẩm này trước khi đánh giá!',
            type: 'danger',
        };

        res.redirect(req.get('Referer') || '/');
    }

    // Kiểm tra đã đánh giá chưa
    const alreadyRating = ratingProduct?.ratings?.some(
        (el) => el.postedBy.toString() === _id.toString()
    );

    let updatedProduct;
    if (alreadyRating) {
        // Update đánh giá cũ
        updatedProduct = await Product.findOneAndUpdate(
            { _id: pid, 'ratings.postedBy': _id },
            {
                $set: {
                    'ratings.$.star': star,
                    'ratings.$.comment': comment,
                    'ratings.$.createdAt': new Date(),
                },
            },
            { new: true, runValidators: true }
        );
    } else {
        // Thêm đánh giá mới
        updatedProduct = await Product.findByIdAndUpdate(
            pid,
            {
                $push: {
                    ratings: {
                        star,
                        comment,
                        postedBy: _id,
                        invoiceId: invoice._id,
                        createdAt: new Date(),
                    },
                },
            },
            { new: true, runValidators: true }
        );
    }

    // Cập nhật lại totalRating
    const totalRatings = updatedProduct.ratings.length;
    const ratingSum = updatedProduct.ratings.reduce((sum, r) => sum + r.star, 0);
    updatedProduct.totalRating = Math.round((ratingSum / totalRatings) * 10) / 10; // Làm tròn đến 1 chữ số thập phân xong dùng roud để thành N
    await updatedProduct.save();

    req.session.notification = {
        message: alreadyRating
            ? 'Cảm ơn bạn đã cập nhật đánh giá nhé!'
            : 'Cảm ơn bạn đã đánh giá sản phẩm! Chúc bạn có được trải nghiệm tuyệt vời!',
        type: updatedProduct ? 'success' : 'danger',
    };

    res.redirect(req.get('Referer') || '/');
});

// [PUT] Upload images for product (admin only) (max 10 images, config in routes)
const uploadImagesProduct = asyncHandler(async (req, res) => {
    // console.log(req.files);
    const { pid } = req.params;
    if (!req.files || req.files.length === 0) throw new Error('No files uploaded!');
    const response = await Product.findByIdAndUpdate(
        pid,
        { $push: { images: { $each: req.files.map((el) => el.path) } } },
        { new: true }
    ).select('-password -role -resetPasswordToken');
    return res.status(200).json({
        success: response ? true : false,
        message: response ? 'Files uploaded successfully' : 'File upload failed!',
        updateProduct: response ? response : 'Cannot update product!',
    });
});

module.exports = {
    createProduct,
    getProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    ratings,
    uploadImagesProduct,
};
