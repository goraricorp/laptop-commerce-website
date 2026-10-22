const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const ProductController = require('../controllers/ProductController');

router.get('/get-user', AdminController.getUser);
router.get('/get-account', AdminController.getAccount);
router.get('/get-userid/:idaccount', AdminController.getUserId);
router.get('/get-accountid/:idaccount', AdminController.getAccountId);
router.post('/update-user/:idaccount', AdminController.updateUserData);
router.post('/update-account/:idaccount', AdminController.updateAccount);
router.post('/detele-user/:idaccount', AdminController.deleteUser);

router.get('/get-category', AdminController.getCategory);
router.delete('/delete-category/:idCategory', AdminController.deleteCategory);
router.post('/update-category/:idCategory', AdminController.updateCategory);
router.put('/create-category', AdminController.createCategory);
router.put('/abc', AdminController.createdejaptor);

router.get('/get-configration', AdminController.getConfiguration);
router.delete('/delete-configuration/:idConfiguration', AdminController.deleteConfiguration);
router.post('/update-configuration/:idConfiguration', AdminController.updateConfiguration);
router.put('/create-configuration', AdminController.createConfiguration);

router.get('/get-color', AdminController.getColor);
router.delete('/delete-color/:idColor', AdminController.deleteColor);
router.post('/update-color/:idColor', AdminController.updateColor);
router.put('/create-color', AdminController.createColor);

router.get('/get-description', AdminController.getDescription);
router.delete('/delete-description/:idDescription', AdminController.deleteDescription);
router.post('/update-description/:idDescription', AdminController.updateDescription);
router.put('/create-description', AdminController.createDescription);

router.get('/payhd', AdminController.payhd);

router.get('/get-voucher', AdminController.getVoucher);
router.get('/get-voucherid', AdminController.getVoucherName);
router.delete('/delete-voucher/:idVoucher', AdminController.deleteVoucher);
router.put('/update-voucher/:idVoucher', AdminController.updateVoucher);
router.post('/create-voucher', AdminController.createVoucher);
router.patch('/update-voucher-status/:idVoucher', AdminController.updateStatus);

router.get('/get-brand', AdminController.getBrand);
module.exports = router;