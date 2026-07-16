const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const { getProfile, updateProfile, updateAddress, updateLocation, updateStatus } = require('../../controllers/vendorControllers/vendorProfileController');
const { triggerVendorSOS } = require('../../controllers/userControllers/sosController');

// Validation rules
const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('businessName').optional().trim().isLength({ max: 100 }).withMessage('Business name must be less than 100 characters')
];

const updateAddressValidation = [
  body('fullAddress').notEmpty().trim().withMessage('Full address is required'),
  body('lat').notEmpty().isFloat().withMessage('Valid latitude is required'),
  body('lng').notEmpty().isFloat().withMessage('Valid longitude is required')
];

// Routes
router.get('/profile', authenticate, isVendor, getProfile);
router.put('/profile', authenticate, isVendor, updateProfileValidation, updateProfile);
router.put('/address', authenticate, isVendor, updateAddressValidation, updateAddress);
router.put('/profile/location', authenticate, isVendor, updateLocation);
router.put('/status', authenticate, isVendor, updateStatus);
router.post('/profile/sos', authenticate, isVendor, triggerVendorSOS);
const { deleteVendorAccount } = require('../../controllers/adminControllers/deletedAccountsController');
router.delete('/profile', authenticate, isVendor, deleteVendorAccount);

module.exports = router;


