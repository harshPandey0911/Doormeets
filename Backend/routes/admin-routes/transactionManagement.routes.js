const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getAllTransactions,
  getTransactionStats,
  getEarningsBreakdown
} = require('../../controllers/adminControllers/adminTransactionController');

// All routes are protected and admin only
router.use(authenticate, isAdmin);

router.get('/transactions', getAllTransactions);
router.get('/transactions/stats', getTransactionStats);
router.get('/transactions/earnings-breakdown', getEarningsBreakdown);

module.exports = router;
