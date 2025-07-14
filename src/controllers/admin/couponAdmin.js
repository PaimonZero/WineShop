const Coupon = require('@models/Coupon');
const asyncHandler = require('express-async-handler');

// [GET] /admin/coupons - Render coupon page
const renderCouponsPage = asyncHandler(async (req, res) => {
    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    const coupons = await Coupon.find().lean();

    if (coupons.length === 0) {
        return res.render('admin/coupons', {
            title: 'Manage Coupons',
            coupons: [],
            notification: { type: 'info', message: 'No coupons found.' },
            account: req.user || null,
        });
    }

    res.render('admin/coupons', {
        title: 'Manage Coupons',
        coupons,
        notification,
        account: req.user || null,
    });
});

// [POST] /admin/coupon-create
const createCoupon = asyncHandler(async (req, res) => {
    const { name, discount, expiry } = req.body;

    if (!name || !discount || !expiry) {
        return res.redirect('/admin/coupons?type=danger&message=Vui lòng điền đầy đủ thông tin!');
    }

    const exists = await Coupon.findOne({ name });
    if (exists) {
        return res.redirect('/admin/coupons?type=danger&message=Coupon đã tồn tại!');
    }

    await Coupon.create({
        name,
        discount,
        expiry: new Date(expiry),
    });

    return res.redirect('/admin/coupons?type=success&message=Đã tạo coupon thành công!');
});

// [PUT] /admin/coupon-update/:cid
const updateCoupon = asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const { name, discount, expiry } = req.body;

    const coupon = await Coupon.findById(cid);
    if (!coupon) {
        return res.redirect('/admin/coupons?type=danger&message=Coupon không tồn tại!');
    }

    coupon.name = name;
    coupon.discount = discount;
    coupon.expiry = new Date(expiry);
    await coupon.save();

    return res.redirect('/admin/coupons?type=success&message=Đã cập nhật coupon thành công!');
});

// [DELETE] /admin/coupon-delete/:cid
const deleteCoupon = asyncHandler(async (req, res) => {
    const { cid } = req.params;

    const coupon = await Coupon.findById(cid);
    if (!coupon) {
        return res.redirect('/admin/coupons?type=danger&message=Coupon không tồn tại!');
    }

    await Coupon.findByIdAndDelete(cid);

    return res.redirect('/admin/coupons?type=success&message=Đã xoá coupon thành công!');
});

module.exports = {
    renderCouponsPage,
    createCoupon,
    updateCoupon,
    deleteCoupon,
};
