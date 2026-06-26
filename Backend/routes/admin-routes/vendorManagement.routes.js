const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, canApproveVendors } = require('../../middleware/roleMiddleware');
const {
  getAllVendors,
  getVendorDetails,
  approveVendor,
  rejectVendor,
  suspendVendor,
  getVendorBookings,
  getVendorEarnings,
  getAllVendorBookings,
  getVendorPaymentsSummary,
  toggleVendorStatus,
  deleteVendor,
  getVendorIncentiveStats,
  giveVendorIncentive,
  getIncentiveHistory
} = require('../../controllers/adminControllers/adminVendorController');

// Validation rules
const rejectVendorValidation = [
  body('reason').optional().trim()
];

// Routes
router.get('/vendors/incentives/stats', authenticate, isAdmin, getVendorIncentiveStats);
router.get('/vendors/incentives/history', authenticate, isAdmin, getIncentiveHistory);
router.post('/vendors/:id/incentive', authenticate, isAdmin, [ body('amount').isFloat({ min: 1 }) ], giveVendorIncentive);

router.get('/vendors', authenticate, isAdmin, getAllVendors);
router.get('/vendors/bookings', authenticate, isAdmin, getAllVendorBookings);
router.get('/vendors/payments', authenticate, isAdmin, getVendorPaymentsSummary);
router.get('/vendors/:id', authenticate, isAdmin, getVendorDetails);
router.post('/vendors/:id/approve', authenticate, isAdmin, canApproveVendors, approveVendor);
router.post('/vendors/:id/reject', authenticate, isAdmin, canApproveVendors, rejectVendorValidation, rejectVendor);
router.post('/vendors/:id/suspend', authenticate, isAdmin, canApproveVendors, suspendVendor);
router.patch('/vendors/:id/status', authenticate, isAdmin, toggleVendorStatus); // isActive toggle — allowed for any admin
router.delete('/vendors/:id', authenticate, isAdmin, deleteVendor); // New
router.get('/vendors/:id/bookings', authenticate, isAdmin, getVendorBookings);
router.get('/vendors/:id/earnings', authenticate, isAdmin, getVendorEarnings);
router.put('/vendors/:id', authenticate, isAdmin, require('../../controllers/adminControllers/adminVendorController').updateVendor);

module.exports = router;

