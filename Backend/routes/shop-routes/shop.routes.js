const express = require('express');
const router = express.Router();
const { register, login, getProfile, forgotPasswordSendOtp, forgotPasswordReset } = require('../../controllers/shopControllers/shopAuthController');
const { deleteShopOwnerAccount } = require('../../controllers/adminControllers/deletedAccountsController');
const { getDashboardDetails, updateReferralCode, getCreditHistory } = require('../../controllers/shopControllers/shopDashboardController');
const { addVendor } = require('../../controllers/shopControllers/shopVendorController');
const { authenticate } = require('../../middleware/authMiddleware');

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/auth/forgot-password/reset', forgotPasswordReset);
router.get('/auth/profile', authenticate, getProfile);
router.delete('/auth/profile', authenticate, deleteShopOwnerAccount);

// Dashboard stats & Referred vendors
router.get('/dashboard', authenticate, getDashboardDetails);
router.put('/referral-code', authenticate, updateReferralCode);

// Credit/Wallet history
router.get('/credit-history', authenticate, getCreditHistory);

// Add vendor
router.post('/vendors/add', authenticate, addVendor);

module.exports = router;
