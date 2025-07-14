const router = require('express').Router();
const ctrls = require('@controllers/productController');
const tokenUtils = require('@middlewares/jwt');
const uploadCloud = require('@config/cloudinary.config');

// [POST] Create a new product
router.post('/', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.createProduct);
// [GET] Get all products
router.get('/', ctrls.getProducts);
// [PUT] Update/ Create new ratings for a product
router.post('/:pid/review', tokenUtils.verifyAccessToken, ctrls.ratings);

// [GET] Get a product by ID
router.get('/:pid', ctrls.getProduct);
// [PUT] Update a product by ID (admin only)
router.put('/:pid', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.updateProduct);
// [DELETE] Delete a product by ID (admin only)
router.delete('/:pid', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.deleteProduct);

// [PUT] Upload product's image to cloud (admin only) (max 10 images)
router.put('/uploadImage/:pid', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], uploadCloud.array('images', 10), ctrls.uploadImagesProduct);

module.exports = router;
