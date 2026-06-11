const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const pricingController = require('../../controllers/adminControllers/pricingController');
const { body } = require('express-validator');

const pricingValidation = [
  body('categoryId').notEmpty().withMessage('Category ID is required'),
  body('subCategoryId').optional({ checkFalsy: true }).isMongoId().withMessage('Valid SubCategory ID is required'),
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('brandId').optional({ checkFalsy: true }).isMongoId().withMessage('Valid Brand ID is required'),
  body('customerPrice').isNumeric().withMessage('Customer Price is required and must be a number'),
  body('gstPercentage').isNumeric().withMessage('GST Percentage must be a number'),
  body('platformCommission').isNumeric().withMessage('Platform Commission percentage must be a number')
];

router.use(authenticate, isAdmin);

router.post('/', pricingValidation, pricingController.createPricing);
router.get('/', pricingController.getAllPricing);
router.put('/:id', pricingValidation, pricingController.updatePricing);
router.delete('/:id', pricingController.deletePricing);

module.exports = router;
