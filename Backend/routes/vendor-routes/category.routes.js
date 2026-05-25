const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const { getVendorCategories, getCategoryBrands, getBrandServicesAndPricing } = require('../../controllers/vendorControllers/vendorCategoryController');

// GET /api/vendors/categories — list all admin-managed service categories
router.get('/', authenticate, isVendor, getVendorCategories);

// GET /api/vendors/categories/:categoryId/brands — list brands under a category
router.get('/:categoryId/brands', authenticate, isVendor, getCategoryBrands);

// GET /api/vendors/categories/:categoryId/brands/:brandId/services — list services and pricing for a brand
router.get('/:categoryId/brands/:brandId/services', authenticate, isVendor, getBrandServicesAndPricing);

module.exports = router;
