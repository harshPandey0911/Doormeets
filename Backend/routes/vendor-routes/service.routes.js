const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const {
    getMyServices,
    getVendorServices,
    updateServiceAvailability,
    getAvailableHierarchy,
    saveServiceSelections
} = require('../../controllers/vendorControllers/vendorServiceController');

// Validation rules
const updateAvailabilityValidation = [
    body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean')
];

const setPricingValidation = [
    body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('discountPrice').optional().isFloat({ min: 0 }).withMessage('Discount price must be a positive number')
];

// Routes
router.get('/my-services', authenticate, isVendor, getMyServices);
router.get('/services', authenticate, isVendor, getVendorServices);
router.put('/services/:serviceId/availability', authenticate, isVendor, updateAvailabilityValidation, updateServiceAvailability);

// New Dynamic Pricing / Catalog Selection Routes
router.get('/hierarchy', authenticate, isVendor, getAvailableHierarchy);
router.post('/selections', authenticate, isVendor, saveServiceSelections);

module.exports = router;


