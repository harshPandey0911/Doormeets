const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const {
  getDashboardStats,
  getRevenueAnalytics,
  getWorkerPerformance,
  getServicePerformance,
  getActiveBanners
} = require('../../controllers/vendorControllers/vendorDashboardController');
const { checkSubscription } = require('../../middleware/roleMiddleware');

// Routes
router.get('/dashboard/stats', authenticate, isVendor, checkSubscription, getDashboardStats);
router.get('/dashboard/revenue', authenticate, isVendor, checkSubscription, getRevenueAnalytics);
router.get('/dashboard/workers', authenticate, isVendor, checkSubscription, getWorkerPerformance);
router.get('/dashboard/services', authenticate, isVendor, checkSubscription, getServicePerformance);
router.get('/dashboard/banners', authenticate, isVendor, checkSubscription, getActiveBanners);

module.exports = router;


