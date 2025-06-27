const router = require('express').Router();
const ctrls = require('@controllers/categoryController');
const tokenUtils = require('@middlewares/jwt');

// [POST] Create new category
router.post('/', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.createCategory);
// [GET] Get all categories
router.get('/', ctrls.getCategories);
// [PUT] Update category
router.put('/:cid', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.updateCategory);
// [DELETE] Delete category
router.delete('/:cid', [tokenUtils.verifyAccessToken, tokenUtils.isAdmin], ctrls.deleteCategory);

// [GET] test view ejs
router.get('/test-view', ctrls.testView);

module.exports = router;
