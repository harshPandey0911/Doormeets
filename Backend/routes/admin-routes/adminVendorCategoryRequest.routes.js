const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getAllRequests,
  getPendingCount,
  updateRequestStatus
} = require('../../controllers/adminControllers/adminVendorCategoryRequestController');

// GET /api/admin/vendor-category-requests/count — pending count for sidebar badge
router.get('/vendor-category-requests/count', authenticate, isAdmin, getPendingCount);

// GET /api/admin/vendor-category-requests — all requests (filterable by status)
router.get('/vendor-category-requests', authenticate, isAdmin, getAllRequests);

// PATCH /api/admin/vendor-category-requests/:id — approve or reject
router.patch('/vendor-category-requests/:id', authenticate, isAdmin, updateRequestStatus);

module.exports = router;
