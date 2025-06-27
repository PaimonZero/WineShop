const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

const createCategory = asyncHandler(async (req, res) => {
    if (Object.keys(req.body).length !== 0 && req.body?.title) {
        req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    } else {
        throw new Error('Category data is required!');
    }
    const { title, slug } = req.body;

    const newCategory = await Category.create({ title, slug });
    return res.status(201).json({
        success: newCategory ? true : false,
        category: newCategory ? newCategory : 'Create new category failed!',
    });
});

const getCategories = asyncHandler(async (req, res) => {
    const data = await Category.find(); //.select('_id title slug')
    return res.status(200).json({
        success: data ? true : false,
        categories: data ? data : 'No data in categories or Error!',
    });
});

const updateCategory = asyncHandler(async (req, res) => {
    const { cid } = req.params;
    if (req.body?.title) {
        req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    } else {
        throw new Error('Category data is required!');
    }
    const { title, slug } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
        cid,
        { title, slug },
        { new: true, runValidators: true }
    );
    return res.status(200).json({
        success: updatedCategory ? true : false,
        updatedCategory: updatedCategory ? updatedCategory : 'Update category failed!',
    });
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { cid } = req.params;
    const deleteCategory = await Category.findByIdAndDelete(cid, { new: true });
    return res.status(200).json({
        success: deleteCategory ? true : false,
        deleteCategory: deleteCategory ? deleteCategory : 'Delete category failed!',
    });
});

// Test view ejs
const testView = asyncHandler(async (req, res) => {
    //..............
    res.render('index', {
        title: 'Test EJS View',
        message: 'Hello, EJS!',
        account: {
            avatar: '/images/svg/delivery-car-tran.png',
            role: 'manager',
            name: 'Demo User',
        },
    });
});

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    testView,
    deleteCategory,
};
