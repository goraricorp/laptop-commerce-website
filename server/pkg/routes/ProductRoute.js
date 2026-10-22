const express = require('express');
const router = express.Router();
const AuthenticationMiddleware = require('../middleware/AuthenticationMiddleware');
const productController = require('../controllers/ProductController');
const path = require('path');
const getMulterMiddleware = require('../middleware/multer.js');
const ImageUpload = getMulterMiddleware(path.join(__dirname, '../../../client/public/assets/img/product'));
// Route để lấy tất cả người dùng

router.get('/load-product', productController.loadProduct);
router.get('/get-product', productController.loadAllProduct);
router.get('/load-brand', productController.loadBrands);

router.get('/load-properties/:idproduct', productController.loadProperties);
router.get('/load-spotlight', productController.loadSpotlight);
router.get('/load-top-spotlight', productController.loadTopSpotlight);
router.get('/load-similarity/:idproduct', productController.loadSimilarity);

router.post('/load-rating', AuthenticationMiddleware, productController.loadRatingMiddleware);
router.post('/create-rating', AuthenticationMiddleware, productController.createRatingMiddleware);
router.put('/change-rating/:id', AuthenticationMiddleware, productController.changeRatingMiddleware);
router.delete('/remove-rating/:id', AuthenticationMiddleware, productController.removeRatingMiddleware);

router.patch('/update-status/:idproduct', productController.updateStatus);

router.get('/search/:search', productController.searchProduct);
router.get('/load-product-condition', productController.loadProductWithCondition);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/load-productid/:idProduct', productController.loadProductWithID);
router.get('/load-description/:idProduct', productController.loadDescription);
router.get('/load-configuration/:idProduct', productController.loadConfiguration);
router.get('/load-rating/:idproduct', productController.loadRating);

router.get('/load-color/:idProduct', productController.loadColor);
router.get('/load-idconfiguration/:idConfiguration', productController.loadConfigurationByID);
// router.get('/load-product-condition/:CPU', productController.loadProductWithCondition);
router.get('/load-product-brand/:Brand', productController.loadProductWithBrand);
router.get('/load-product-name/:Name', productController.loadProductWithName);

router.post('/update-productname/:idProduct', ImageUpload.single('product_image'), productController.updateProductName);
router.delete('/delete-productname/:idProduct', productController.deleteProductName);
router.put('/create-productname', ImageUpload.single('product_image'), productController.createProductName);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/upload-image', ImageUpload.single('product_image'), productController.UploadProductImage);
module.exports = router;