const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, hasPermission } = require('../../middleware/roleMiddleware');
const {
  getVendorBalances,
  getVendorLedger,
  getPendingSettlements,
  approveSettlement,
  rejectSettlement,
  getSettlementHistory,
  getSettlementDashboard,
  blockVendor,
  unblockVendor,
  updateCashLimit,
  // Withdrawals
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal
} = require('../../controllers/adminControllers/settlementController');

// All routes require authentication, admin role and settlement permission
router.use(authenticate, isAdmin, hasPermission('view_settlements'));

// Dashboard summary
router.get('/dashboard', getSettlementDashboard);

// Get all vendors with balances
router.get('/vendors', getVendorBalances);

// Get specific vendor's ledger
router.get('/vendors/:vendorId/ledger', getVendorLedger);

// Vendor management (blocking and limits)
router.post('/vendors/:vendorId/block', blockVendor);
router.post('/vendors/:vendorId/unblock', unblockVendor);
router.post('/vendors/:vendorId/cash-limit', updateCashLimit);

// Get all pending settlements
router.get('/pending', getPendingSettlements);

// Get settlement history
router.get('/history', getSettlementHistory);

// Approve settlement
router.post(
  '/:settlementId/approve',
  [body('adminNotes').optional().isString()],
  approveSettlement
);

// Reject settlement
router.post(
  '/:settlementId/reject',
  [body('rejectionReason').notEmpty().withMessage('Rejection reason is required')],
  rejectSettlement
);

// Withdrawals
router.get('/withdrawals', getWithdrawalRequests);
router.post('/withdrawals/:withdrawalId/approve', approveWithdrawal);
router.post('/withdrawals/:withdrawalId/reject', rejectWithdrawal);

module.exports = router;
