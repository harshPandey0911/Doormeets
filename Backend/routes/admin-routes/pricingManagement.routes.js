const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const pricingController = require('../../controllers/adminControllers/pricingController');
const { body } = require('express-validator');

const pricingValidation = [
  body('categoryId').notEmpty().withMessage('Category ID is required'),
  body('subCategoryId').optional({ nullable: true, checkFalsy: true }).custom(val => !val || typeof val === 'string'),
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('brandId').optional({ nullable: true, checkFalsy: true }).custom(val => !val || typeof val === 'string'),
  body('cityId').optional({ nullable: true, checkFalsy: true }).custom(val => !val || typeof val === 'string'),
  body('zoneId').optional({ nullable: true, checkFalsy: true }).custom(val => !val || typeof val === 'string'),
  body('variantId').optional({ nullable: true, checkFalsy: true }).custom(val => !val || typeof val === 'string'),
  body('customerPrice').isNumeric().withMessage('Customer Price is required and must be a number'),
  body('gstPercentage').optional().isNumeric().withMessage('GST Percentage must be a number'),
  body('platformCommission').optional().isNumeric().withMessage('Platform Commission percentage must be a number')
];

router.use(authenticate, isAdmin);

router.post('/', pricingValidation, pricingController.createPricing);
router.get('/', pricingController.getAllPricing);
router.put('/:id', pricingValidation, pricingController.updatePricing);
router.delete('/:id', pricingController.deletePricing);

module.exports = router;
