const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');
const { redeemVoucher } = require('../../controllers/adminControllers/voucherController');

// User route to redeem/claim wallet gift cards or discount vouchers
router.post('/redeem', authenticate, isUser, redeemVoucher);

module.exports = router;
