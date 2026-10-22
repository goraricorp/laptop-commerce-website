// routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const getMulterMiddleware = require('../middleware/multer.js');
const avatarUpload = getMulterMiddleware(path.join(__dirname, '../../../client/public/assets/img/avatars'));
// const path = require('path');
const AccountController = require('../controllers/AccountController');
const AuthenticationMiddleware = require('../middleware/AuthenticationMiddleware');

// routes.use(express.static(path.join(__dirname, 'client/public')));

router.get('/get-info', AuthenticationMiddleware, AccountController.getAccountInfo);
router.put('/set-info', AuthenticationMiddleware, AccountController.setAccountInfo);

router.post('/upload-avatar', AuthenticationMiddleware, avatarUpload.single('avatar'), AccountController.UploadAvatar);
module.exports = router;
