const express = require('express');
const router = express.Router();
const { register, login, getProfile, forgotPasswordSendOtp, forgotPasswordReset } = require('../../controllers/shopControllers/shopAuthController');
const { getDashboardDetails } = require('../../controllers/shopControllers/shopDashboardController');
const { addVendor } = require('../../controllers/shopControllers/shopVendorController');
const { authenticate } = require('../../middleware/authMiddleware');

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/auth/forgot-password/reset', forgotPasswordReset);
router.get('/auth/profile', authenticate, getProfile);

// Dashboard stats & Referred vendors
router.get('/dashboard', authenticate, getDashboardDetails);

// Add vendor
router.post('/vendors/add', authenticate, addVendor);

module.exports = router;
