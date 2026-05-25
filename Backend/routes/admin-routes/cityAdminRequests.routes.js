const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, isSuperAdmin, hasPermission } = require('../../middleware/roleMiddleware');
const {
  createRequest,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getPendingCount
} = require('../../controllers/adminControllers/cityAdminRequestController');

// Any admin can view requests (filtered by role in controller)
router.get('/', authenticate, isAdmin, getAllRequests);

// Pending count — Super Admin only (for badge in sidebar)
router.get('/pending-count', authenticate, isSuperAdmin, getPendingCount);

// City Admin submits a proposal
router.post('/', authenticate, isAdmin, createRequest);

// Super Admin approves or rejects
router.post('/:id/approve', authenticate, isSuperAdmin, approveRequest);
router.post('/:id/reject', authenticate, isSuperAdmin, rejectRequest);

module.exports = router;
