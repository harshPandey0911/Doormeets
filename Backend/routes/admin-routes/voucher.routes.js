const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { createVoucher, getAllVouchers, updateVoucher, deleteVoucher } = require('../../controllers/adminControllers/voucherController');

// All voucher admin endpoints are protected by admin auth
router.use(authenticate, isAdmin);

router.post('/', createVoucher);
router.get('/', getAllVouchers);
router.put('/:id', updateVoucher);
router.delete('/:id', deleteVoucher);

module.exports = router;
