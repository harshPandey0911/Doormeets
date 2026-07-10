const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getVendorDashboard,
  addBanner,
  updateBanner,
  deleteBanner,
} = require('../../controllers/adminControllers/vendorDashboardController');

// GET full config
router.get('/', authenticate, isAdmin, getVendorDashboard);

// Banners/Media
router.post('/banners', authenticate, isAdmin, addBanner);
router.put('/banners/:bannerId', authenticate, isAdmin, updateBanner);
router.delete('/banners/:bannerId', authenticate, isAdmin, deleteBanner);

module.exports = router;
