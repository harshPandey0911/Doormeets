const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { getHomeContent, updateHomeContent, getAvailableItems } = require('../../controllers/adminControllers/homeContentController');

// Get available brands/categories for featured sections dropdown
router.get('/home-content/available-items', authenticate, isAdmin, getAvailableItems);

// Get home content
router.get('/home-content', authenticate, isAdmin, getHomeContent);

// Update home content
router.put('/home-content', authenticate, isAdmin, updateHomeContent);

module.exports = router;

