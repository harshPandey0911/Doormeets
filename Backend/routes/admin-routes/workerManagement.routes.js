const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, canApproveWorkers } = require('../../middleware/roleMiddleware');
const {
  getAllWorkers,
  getWorkerDetails,
  approveWorker,
  rejectWorker,
  suspendWorker,
  getWorkerJobs,
  getWorkerEarnings,
  payWorker,
  getAllWorkerJobs,
  getWorkerPaymentsSummary,
  toggleWorkerStatus,
  deleteWorker,
  createWorker
} = require('../../controllers/adminControllers/adminWorkerController');

// Validation rules
const rejectWorkerValidation = [
  body('reason').optional().trim()
];

const payWorkerValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('reference').optional().trim(),
  body('notes').optional().trim()
];

// Routes
router.get('/workers', authenticate, isAdmin, getAllWorkers);
router.post('/workers', authenticate, isAdmin, createWorker); // New
router.get('/workers/jobs', authenticate, isAdmin, getAllWorkerJobs);
router.get('/workers/payments', authenticate, isAdmin, getWorkerPaymentsSummary);
router.get('/workers/:id', authenticate, isAdmin, getWorkerDetails);
router.post('/workers/:id/approve', authenticate, isAdmin, canApproveWorkers, approveWorker);
router.post('/workers/:id/reject', authenticate, isAdmin, canApproveWorkers, rejectWorkerValidation, rejectWorker);
router.post('/workers/:id/suspend', authenticate, isAdmin, canApproveWorkers, suspendWorker);
router.post('/workers/:id/pay', authenticate, isAdmin, payWorkerValidation, payWorker);
router.patch('/workers/:id/status', authenticate, isAdmin, toggleWorkerStatus); // isActive toggle — allowed for any admin
router.delete('/workers/:id', authenticate, isAdmin, deleteWorker); // New
router.get('/workers/:id/jobs', authenticate, isAdmin, getWorkerJobs);
router.get('/workers/:id/earnings', authenticate, isAdmin, getWorkerEarnings);

module.exports = router;
