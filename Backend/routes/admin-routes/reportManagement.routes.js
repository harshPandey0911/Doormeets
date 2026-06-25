const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getBookingReport,
  getVendorReport,
  getWorkerReport,
  getRevenueReport,
  getCustomerReport
} = require('../../controllers/adminControllers/adminReportController');
const { exportExcel, exportPDF } = require('../../controllers/adminControllers/adminExportController');

// All routes require authentication and admin role
router.use(authenticate, isAdmin);

// Export routes
router.get('/reports/export/excel', exportExcel);
router.get('/reports/export/pdf', exportPDF);

// Report routes
router.get('/reports/bookings', getBookingReport);
router.get('/reports/vendors', getVendorReport);
router.get('/reports/workers', getWorkerReport);
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/customers', getCustomerReport);

module.exports = router;
