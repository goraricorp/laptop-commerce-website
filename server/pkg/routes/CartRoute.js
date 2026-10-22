const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');
const AuthenticationMiddleware = require('../middleware/AuthenticationMiddleware');

// Route để lấy tất cả người dùng
// routes.get('/load-cart', cartController.loadCart);
// routes.get('/load-cart/:idCart', cartController.loadCartById);

router.get('/load-cart', AuthenticationMiddleware, cartController.loadCartPro);

router.get('/loadcart', AuthenticationMiddleware, cartController.loadCart);

router.get('/load-cartItem/:idCart', cartController.loadCartItem);

router.put('/add-cartitem', AuthenticationMiddleware, cartController.addCartItem);

router.put('/remove-cartitem', cartController.removeCartItem);

router.put('/update-cartitem', cartController.updateCartItemQuantity);

router.get('/get-voucher', cartController.loadVoucher);

module.exports = router;