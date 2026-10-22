const express = require('express');
const router = express.Router();
const BillController = require('../controllers/BillController')
const AuthenticationMiddleware = require('../middleware/AuthenticationMiddleware');

router.get('/list-all', BillController.getAllBill);

router.get('/list-bill', AuthenticationMiddleware, BillController.getAllBillByAccount);

router.get('/get-bill/:id', AuthenticationMiddleware, BillController.getBillById);

router.post('/add-bill', AuthenticationMiddleware, BillController.createBill);

router.put('/add-billDetail', BillController.createBillDetail);

// routes.get('/list', AuthenticationMiddleware, BillController.getAllBillByAccount);

// routes.get('/read:id', BillController.getBillById);

module.exports = router;
