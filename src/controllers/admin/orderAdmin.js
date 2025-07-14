const Invoice = require('@models/Invoice');
const User = require('@models/User');
const Product = require('@models/Product');
const Coupon = require('@models/Coupon');
const asyncHandler = require('express-async-handler');

// Render orders page
const renderOrdersPage = asyncHandler(async (req, res) => {
    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    // Lấy danh sách hóa đơn
    const invoices = await Invoice.find().lean(); // Sử dụng lean() để trả về đối tượng JavaScript thuần túy
    const products = await Product.find({}, '_id title price').lean();
    const coupons = await Coupon.find({}, '_id name').lean();

    if (invoices.length === 0) {
        return res.render('admin/orders', {
            title: 'Manage Orders',
            invoices: [],
            products,
            coupons,
            notification: { type: 'info', message: 'No orders found.' },
            account: req.user || null,
        });
    }

    res.render('admin/orders', {
        title: 'Manage Orders',
        invoices,
        notification,
        products,
        coupons,
        account: req.user || null,
    });
});

// render order details page
const renderOrderDetailsPage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
        .populate('userId', 'email mobile lastName firstName')
        .populate('products.productId', 'title')
        .populate('coupon', 'name discount')
        .lean();

    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    if (!invoice) {
        return res.status(404).render('admin/404', {
            title: 'Order Not Found',
            notification: {
                type: 'danger',
                message: 'Order not found.',
            },
            account: req.user || null,
        });
    }

    res.render('admin/orderDetail', {
        title: `Order Details`,
        invoice,
        notification: notification || {
            type: 'info',
            message: `You are viewing order ${invoice._id} information!`,
        },
        account: req.user || null,
    });
});

// Update order status and payment status
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { deliveryStatus, paymentStatus } = req.body;

    if (!deliveryStatus || !paymentStatus) {
        return res.redirect(
            `/admin/order-details/${id}?type=danger&message=Missing status fields.`
        );
    }

    if (!['pending', 'shipped', 'completed', 'cancelled'].includes(deliveryStatus)) {
        return res.redirect(
            `/admin/order-details/${id}?type=danger&message=Invalid delivery status.`
        );
    }
    if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
        return res.redirect(
            `/admin/order-details/${id}?type=danger&message=Invalid payment status.`
        );
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
        id,
        { deliveryStatus, paymentStatus },
        { new: true }
    );

    if (!updatedInvoice) {
        return res.redirect(`/admin/order-details/${id}?type=danger&message=Order not found.`);
    }

    res.redirect(
        `/admin/order-details/${id}?type=success&message=Order status updated successfully.`
    );
});

// Delete order
const deleteOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
        return res.status(404).render('admin/404', {
            title: 'Order Not Found',
            notification: {
                type: 'danger',
                message: 'Order not found.',
            },
            account: req.user || null,
        });
    }

    res.redirect('/admin/orders?type=success&message=Order deleted successfully.');
});

// Create new order
const createNewOrder = asyncHandler(async (req, res) => {
    const {
        productId,
        quantity,
        price,
        coupon,
        shippingName,
        shippingPhone,
        shippingAddress,
        paymentMethod,
    } = req.body;
    const userId = req?.user?._id; // 👈 Replace with req.user._id when auth is implemented

    if (!shippingAddress || !shippingName || !shippingPhone || !paymentMethod) {
        return res.redirect(
            '/admin/orders?type=danger&message=Shipping information is required to create an order.'
        );
    }

    // Validate product arrays are the same length
    if (
        !productId ||
        !quantity ||
        !price ||
        productId.length !== quantity.length ||
        quantity.length !== price.length
    ) {
        return res.redirect('/admin/orders?type=danger&message=Invalid product data.');
    }

    // Chuyển đổi dữ liệu sản phẩm thành array of objects
    const products = productId.map((id, i) => ({
        productId: id,
        quantity: Number(quantity[i]),
        price: Number(price[i]),
    }));

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).render('admin/404', {
            title: 'User Not Found',
            notification: {
                type: 'danger',
                message: 'User not found.',
            },
            account: req.user || null,
        });
    }

    // Tính tổng tiền
    let totalAmount = products.reduce((acc, item) => acc + item.price * item.quantity, 0);
    let discountAmount = 0;

    // Áp dụng mã giảm giá nếu có
    let couponData = null;
    if (coupon && coupon.trim() !== '') {
        couponData = await Coupon.findOne({ name: coupon.trim() });

        if (!couponData || couponData.expiry < new Date()) {
            return res.redirect('/admin/orders?type=danger&message=Invalid or expired coupon.');
        }

        discountAmount = couponData.discount;
        totalAmount = Math.round(totalAmount - discountAmount);
    }

    const newInvoice = new Invoice({
        userId,
        products,
        coupon: couponData ? couponData._id : null,
        shippingAddress: {
            name: shippingName,
            phone: shippingPhone,
            address: shippingAddress,
        },
        deliveryStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod,
        totalAmount,
    });

    await newInvoice.save();

    res.redirect(
        `/admin/order-details/${newInvoice._id}?type=success&message=Order created successfully.`
    );
});

module.exports = {
    renderOrdersPage,
    renderOrderDetailsPage,
    updateOrderStatus,
    deleteOrder,
    createNewOrder,
};
