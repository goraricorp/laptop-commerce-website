const express = require('express');
const router = express.Router();
const AuthenticationController = require('../controllers/AuthenticationController');
const AuthenticationMiddleware = require('../middleware/AuthenticationMiddleware');
const AdministratorMiddleware = require('../middleware/AdministratorMiddleware');

// routes.post('/login/authen', AuthenticationController.login.bind(AuthenticationController))
router.post('/login-google', AuthenticationController.google)

router.post('/login', AuthenticationController.login)

router.post('/register', AuthenticationController.register)

router.post('/logout', AuthenticationMiddleware, AuthenticationController.logout);

router.get('/check', AuthenticationMiddleware, AuthenticationController.check)

router.post('/deactivate', AuthenticationMiddleware, AuthenticationController.deactivate)

router.get('/verify-email', AuthenticationController.verifyEmail)

router.post('/forgot-password', AuthenticationController.forgotPassword);

router.post('/reset-password', AuthenticationController.resetPassword);
router.post('/change-password', AuthenticationController.changePassword);
module.exports = router