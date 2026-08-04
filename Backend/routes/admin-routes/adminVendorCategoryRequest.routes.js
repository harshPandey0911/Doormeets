const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, hasPermission } = require('../../middleware/roleMiddleware');
const {
  getAllRequests,
  getPendingCount,
  updateRequestStatus
} = require('../../controllers/adminControllers/adminVendorCategoryRequestController');

// GET /api/admin/vendor-category-requests/count — pending count for sidebar badge
router.get('/vendor-category-requests/count', authenticate, isAdmin, hasPermission('view_vendor_requests'), getPendingCount);

// GET /api/admin/vendor-category-requests — all requests (filterable by status)
router.get('/vendor-category-requests', authenticate, isAdmin, hasPermission('view_vendor_requests'), getAllRequests);

// PATCH /api/admin/vendor-category-requests/:id — approve or reject
router.patch('/vendor-category-requests/:id', authenticate, isAdmin, hasPermission('view_vendor_requests'), updateRequestStatus);

module.exports = router;
