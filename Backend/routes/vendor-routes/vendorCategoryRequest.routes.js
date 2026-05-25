const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const { submitCategoryRequest, getMyRequests } = require('../../controllers/vendorControllers/vendorCategoryRequestController');

const requestValidation = [
  body('categoryName')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be 2-100 characters'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must be under 500 characters')
];

// GET /api/vendors/category-requests — vendor's own requests
router.get('/', authenticate, isVendor, getMyRequests);

// POST /api/vendors/category-requests — submit new request
router.post('/', authenticate, isVendor, requestValidation, submitCategoryRequest);

module.exports = router;
