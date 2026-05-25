const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const subCategoryController = require('../../controllers/adminControllers/subCategoryController');
const { body } = require('express-validator');

const createValidation = [
  body('categoryId').notEmpty().withMessage('Category ID is required'),
  body('title').notEmpty().withMessage('Title is required')
];

router.use(authenticate, isAdmin);

router.post('/', createValidation, subCategoryController.createSubCategory);
router.get('/', subCategoryController.getAllSubCategories);
router.get('/:id', subCategoryController.getSubCategoryById);
router.put('/:id', createValidation, subCategoryController.updateSubCategory);
router.delete('/:id', subCategoryController.deleteSubCategory);

module.exports = router;
