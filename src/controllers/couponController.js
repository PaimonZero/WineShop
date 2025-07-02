const Coupon = require('@models/Coupon');
const asyncHandler = require('express-async-handler');

// Create a new coupon
const createNewCoupon = asyncHandler(async (req, res) => {
    const { name, discount, expiry } = req.body;
    if (!name || !discount || !expiry) throw new Error('Missing input for coupon!');
    const existingCoupon = await Coupon.findOne({ name });
    if (existingCoupon) throw new Error('Coupon already exists!');
    const coupon = await Coupon.create({
        name,
        discount,
        expiry: new Date(Date.now() + expiry * 24 * 60 * 60 * 1000), // expiry in days
    });
    res.status(201).json({
        success: coupon ? true : false,
        message: coupon ? 'Coupon created successfully' : 'Failed to create coupon',
        coupon,
    });
});

// Get all coupons
const getCoupon = asyncHandler(async (req, res) => {
    const { code } = req.query;

    const coupon = await Coupon.findOne({ name: code });

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: 'Mã giảm giá không tồn tại',
        });
    }

    // ✅ Kiểm tra hạn sử dụng
    const now = new Date();
    if (coupon.expiry && coupon.expiry < now) {
        return res.status(400).json({
            success: false,
            message: 'Mã giảm giá đã hết hạn',
        });
    }

    res.status(200).json({
        success: true,
        message: 'Mã giảm giá hợp lệ',
        coupon,
    });
});

// Get all coupons
const getCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find();
    res.status(200).json({
        success: coupons ? true : false,
        message: coupons ? 'Coupons retrieved successfully' : 'Failed to get coupons',
        coupons,
    });
});

// Update coupon
const updateCoupon = asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const { name, discount, expiry } = req.body;
    if (!name || !discount || !expiry) throw new Error('Missing input for coupon!');
    const coupon = await Coupon.findByIdAndUpdate(
        cid,
        {
            name,
            discount,
            expiry: new Date() + +expiry * 24 * 60 * 60 * 1000, // expiry in days
        },
        { new: true }
    );
    res.status(200).json({
        success: coupon ? true : false,
        message: coupon ? 'Coupon updated successfully' : 'Failed to update coupon',
        coupon,
    });
});

// Delete coupon
const deleteCoupon = asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const coupon = await Coupon.findByIdAndDelete(cid);
    res.status(200).json({
        success: coupon ? true : false,
        message: coupon ? 'Coupon deleted successfully' : 'Failed to delete coupon',
        coupon,
    });
});

module.exports = {
    createNewCoupon,
    getCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon,
};
