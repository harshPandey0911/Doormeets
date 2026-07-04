const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const {
  getWallet,
  getTransactions,
  requestWithdrawal,
  getWithdrawals
} = require('../../controllers/workerControllers/workerWalletController');

const withdrawValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('bankDetails').optional().isObject().withMessage('Bank details must be an object'),
  body('notes').optional().trim()
];

// All routes are prepended with /api/workers
router.get('/wallet', authenticate, getWallet);
router.get('/wallet/transactions', authenticate, getTransactions);
router.post('/wallet/withdraw', authenticate, withdrawValidation, requestWithdrawal);
router.get('/wallet/withdrawals', authenticate, getWithdrawals);

module.exports = router;
