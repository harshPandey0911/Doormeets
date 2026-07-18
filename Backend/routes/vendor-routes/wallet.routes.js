const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const { getWallet, getTransactions, getWalletSummary, getEarningsAnalytics } = require('../../controllers/vendorControllers/vendorWalletController');

// Legacy Routes (keeping backward compatibility)
router.get('/wallet', authenticate, isVendor, getWallet);
router.get('/transactions', authenticate, isVendor, getTransactions);
router.get('/summary', authenticate, isVendor, getWalletSummary);

const { getActivePackages } = require('../../controllers/adminControllers/creditPackageController');
const { 
  purchaseCredits, 
  verifyCreditsPurchase, 
  getCreditHistory 
} = require('../../controllers/vendorControllers/vendorWalletController');

// Earnings Analytics Route
router.get('/earnings/analytics', authenticate, isVendor, getEarningsAnalytics);

// Credit Routes
router.get('/credits/packages', authenticate, isVendor, getActivePackages);
router.post('/credits/purchase', authenticate, isVendor, purchaseCredits);
router.post('/credits/verify', authenticate, isVendor, verifyCreditsPurchase);
router.get('/credits/history', authenticate, isVendor, getCreditHistory);

module.exports = router;
