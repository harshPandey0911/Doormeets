const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const commissionController = require('../../controllers/adminControllers/commissionController');

// Admin only routes
router.use(authenticate);

// Admin summaries & lists
router.get('/admin/summary', isAdmin, commissionController.getAdminCollectionSummary);
router.get('/admin/report', isAdmin, commissionController.getCommissionReport);
router.get('/admin/pending-dues', isAdmin, commissionController.getPendingVendorDues);

// Vendor accessible summary (either self or specific params)
router.get('/vendor/summary', commissionController.getVendorCollectionSummary);
router.get('/vendor/summary/:vendorId', commissionController.getVendorCollectionSummary);

module.exports = router;
