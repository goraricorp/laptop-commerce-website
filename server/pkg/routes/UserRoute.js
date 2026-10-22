const express = require('express');
const AuthenticationMiddleware = require('../middleware/AuthenticationMiddleware');
const AdministratorMiddleware = require('../middleware/AdministratorMiddleware');
const router = express.Router();

// Route mà chỉ người dùng đã đăng nhập có thể truy cập
router.get('/profile', AuthenticationMiddleware, (req, res) => {
    return res.json({ message: 'User profile', user: req.user });
});

// Route chỉ quản trị viên mới truy cập được
router.get('/admin', AuthenticationMiddleware, AdministratorMiddleware, (req, res) => {
    return res.json({ message: 'Welcome Admin', user: req.user });
});

module.exports = router;
