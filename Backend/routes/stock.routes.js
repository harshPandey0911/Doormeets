const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const adminStockController = require('../controllers/stockControllers/adminStockController');

// Admin Routes
router.get('/admin/all', authenticate, isAdmin, adminStockController.getAllStockRequests);
router.put('/admin/:requestId/status', authenticate, isAdmin, adminStockController.updateStockRequestStatus);

module.exports = router;
