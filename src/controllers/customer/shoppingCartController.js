const User = require('@models/User');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get shopping cart page
 * @route   GET /cart
 * @access  Public
 */
const getShoppingCartPage = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'cart.product',
    });

    const cart = user.cart;

    // Calculate subtotal
    let subTotal = 0;
    if (cart) {
        subTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('customer/shopping-cart', {
        title: 'Shopping Cart',
        account: req.user || null,
        notification: notification || null,
        cart,
        subTotal,
    });
});

/**
 * @desc    Delete a product from shopping cart
 * @route   DELETE /shopping-cart/delete-product
 * @access  Private
 */
const deleteProductFromCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { pid } = req.params;

    const user = await User.findById(_id).populate({
        path: 'cart.product',
    });
    const originalLength = user.cart.length;

    // Lọc ra các sản phẩm không khớp để giữ lại
    user.cart = user.cart.filter((item) => item.product._id.toString() !== pid);

    // Nếu có thay đổi thì lưu
    if (user.cart.length !== originalLength) {
        await user.save();
    }

    // Hoặc nếu gọi bằng AJAX:
    res.status(200).json({
        success: true,
        message: 'Sản phẩm đã được xoá khỏi giỏ hàng',
        cart: user.cart,
    });
});

module.exports = {
    getShoppingCartPage,
    deleteProductFromCart,
};
