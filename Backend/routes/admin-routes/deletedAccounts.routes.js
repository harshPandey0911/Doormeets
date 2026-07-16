const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { getDeletedAccounts, getDeletedAccountHistory } = require('../../controllers/adminControllers/deletedAccountsController');

// Admin only routes
router.use(authenticate, isAdmin);

router.get('/deleted-accounts', getDeletedAccounts);
router.get('/deleted-accounts/:role/:id/history', getDeletedAccountHistory);

module.exports = router;
