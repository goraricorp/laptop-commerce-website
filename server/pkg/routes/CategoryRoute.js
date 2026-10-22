const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const path = require('path');
const getMulterMiddleware = require('../middleware/multer.js');
const CategoryImageUpload = getMulterMiddleware(path.join(__dirname, '../../../client/public/assets/img/product'));

router.get('/get-category', CategoryController.getCategory);
router.delete('/delete-category/:id', CategoryController.deleteCategory);
router.put('/update-category/:id', CategoryImageUpload.single('product_image'), CategoryController.updateCategory);
router.post('/create-category', CategoryImageUpload.single('product_image'), CategoryController.createCategory);

module.exports = router;