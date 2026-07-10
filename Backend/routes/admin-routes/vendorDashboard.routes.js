const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getVendorDashboard,
  addBanner, updateBanner, deleteBanner,
  addAnnouncement, updateAnnouncement, deleteAnnouncement,
  addVideo, updateVideo, deleteVideo,
  addQuickLink, updateQuickLink, deleteQuickLink,
} = require('../../controllers/adminControllers/vendorDashboardController');

// GET full config
router.get('/', authenticate, isAdmin, getVendorDashboard);

// Banners
router.post('/banners', authenticate, isAdmin, addBanner);
router.put('/banners/:bannerId', authenticate, isAdmin, updateBanner);
router.delete('/banners/:bannerId', authenticate, isAdmin, deleteBanner);

// Announcements
router.post('/announcements', authenticate, isAdmin, addAnnouncement);
router.put('/announcements/:id', authenticate, isAdmin, updateAnnouncement);
router.delete('/announcements/:id', authenticate, isAdmin, deleteAnnouncement);

// Videos
router.post('/videos', authenticate, isAdmin, addVideo);
router.put('/videos/:id', authenticate, isAdmin, updateVideo);
router.delete('/videos/:id', authenticate, isAdmin, deleteVideo);

// Quick Links
router.post('/quick-links', authenticate, isAdmin, addQuickLink);
router.put('/quick-links/:id', authenticate, isAdmin, updateQuickLink);
router.delete('/quick-links/:id', authenticate, isAdmin, deleteQuickLink);

module.exports = router;
