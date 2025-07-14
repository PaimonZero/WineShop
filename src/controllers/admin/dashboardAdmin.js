const asyncHandler = require('express-async-handler');
const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const moment = require('moment');

const renderDashboard = asyncHandler(async (req, res) => {
    const notification =
        req.query.type && req.query.message
            ? { type: req.query.type, message: req.query.message }
            : null;

    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    const yesterdayStart = moment().subtract(1, 'day').startOf('day').toDate();
    const yesterdayEnd = moment().subtract(1, 'day').endOf('day').toDate();

    // Helper tính phần trăm thay đổi
    const calcPercentChange = (todayVal, yesterdayVal) => {
        if (yesterdayVal === 0) return todayVal > 0 ? 100 : 0;
        return ((todayVal - yesterdayVal) / yesterdayVal) * 100;
    };

    // -------------------------------
    // 1. Đơn hàng hôm nay & hôm qua
    const [ordersToday, ordersYesterday] = await Promise.all([
        Invoice.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
        Invoice.countDocuments({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
    ]);
    const ordersChange = calcPercentChange(ordersToday, ordersYesterday);

    // 2. Khách mới
    const [newCustomers, newCustomersYesterday] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
        User.countDocuments({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
    ]);
    const customersChange = calcPercentChange(newCustomers, newCustomersYesterday);

    // 3. Chai bán hôm nay & hôm qua
    const bottlesSoldTodayAgg = await Invoice.aggregate([
        {
            $match: {
                createdAt: { $gte: todayStart, $lte: todayEnd },
                paymentStatus: 'paid',
                deliveryStatus: { $ne: 'cancelled' },
            },
        },
        { $unwind: '$products' },
        { $group: { _id: null, total: { $sum: '$products.quantity' } } },
    ]);
    const bottlesSold = bottlesSoldTodayAgg[0]?.total || 0;

    const bottlesSoldYesterdayAgg = await Invoice.aggregate([
        {
            $match: {
                createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
                paymentStatus: 'paid',
                deliveryStatus: { $ne: 'cancelled' },
            },
        },
        { $unwind: '$products' },
        { $group: { _id: null, total: { $sum: '$products.quantity' } } },
    ]);
    const bottlesSoldYesterday = bottlesSoldYesterdayAgg[0]?.total || 0;
    const bottlesChange = calcPercentChange(bottlesSold, bottlesSoldYesterday);

    // 4. Doanh thu
    const revenueTodayAgg = await Invoice.aggregate([
        {
            $match: {
                createdAt: { $gte: todayStart, $lte: todayEnd },
                paymentStatus: 'paid',
                deliveryStatus: { $ne: 'cancelled' },
            },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueTodayAgg[0]?.total || 0;

    const revenueYesterdayAgg = await Invoice.aggregate([
        {
            $match: {
                createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
                paymentStatus: 'paid',
                deliveryStatus: { $ne: 'cancelled' },
            },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const revenueYesterday = revenueYesterdayAgg[0]?.total || 0;
    const revenueChange = calcPercentChange(totalRevenue, revenueYesterday);
    // -------------------------------

    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    // 5. Top 10 sản phẩm bán chạy nhất
    const topSellingProducts = await Invoice.aggregate([
        {
            $match: {
                // paymentStatus: 'paid',
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
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
            $addFields: {
                'product.totalSold': '$totalSold',
                'product.priceAtPurchase': '$priceAtPurchase',
            },
        },
        {
            $replaceRoot: { newRoot: '$product' },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
    ]);

    // 8. Tổng doanh thu từng tuần trong 12 tuần qua
    const invoices = await Invoice.find({
        createdAt: { $gte: moment().subtract(11, 'weeks').startOf('isoWeek').toDate() },
        paymentStatus: 'paid',
        deliveryStatus: { $ne: 'cancelled' },
    }).select('createdAt totalAmount');

    console.log('Invoices for last 12 weeks:', invoices);

    const weeks = [];
    for (let i = 11; i >= 0; i--) {
        const weekStart = moment().subtract(i, 'weeks').startOf('isoWeek');
        const label = weekStart.format('YYYY-[W]WW');
        weeks.push({ label, week: weekStart.isoWeek(), year: weekStart.isoWeekYear(), total: 0 });
    }

    invoices.forEach((invoice) => {
        const week = moment(invoice.createdAt).isoWeek();
        const year = moment(invoice.createdAt).isoWeekYear();
        const label = `${year}-W${String(week).padStart(2, '0')}`;

        const weekObj = weeks.find((w) => w.label === label);
        if (weekObj) {
            weekObj.total += invoice.totalAmount;
        }
    });

    // Render EJS
    res.render('admin/dashboard', {
        title: 'Dashboard',
        notification,
        stats: {
            ordersToday,
            ordersChange,
            newCustomers,
            customersChange,
            bottlesSold,
            bottlesChange,
            totalRevenue,
            revenueChange,
            topSellingProducts,
            weeklyRevenue: weeks
        },
        account: req.user || null,
    });
});

module.exports = {
    renderDashboard,
};
