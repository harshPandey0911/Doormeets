const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const {
  getVendorBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  assignWorker,
  updateBookingStatus,
  addVendorNotes,
  startSelfJob,
  vendorReachedLocation,
  verifySelfVisit,
  completeSelfJob,
  collectSelfCash,
  collectAddonCash,
  payWorker,
  getVendorRatings,
  getPendingBookings,
  reconfirmBooking,
  cancelAcceptedBooking,
  requestCancelBooking,
  acceptReschedule,
  rejectReschedule
} = require('../../controllers/bookingControllers/vendorBookingController');

// Validation rules
const rejectBookingValidation = [
  body('reason').optional().trim()
];

const assignWorkerValidation = [
  body('workerId').custom((value) => {
    if (value === 'SELF') return true;
    if (mongoose.Types.ObjectId.isValid(value)) return true;
    throw new Error('Valid worker ID or "SELF" is required');
  })
];

const updateStatusValidation = [
  body('status').isIn(['pending', 'confirmed', 'assigned', 'visited', 'in_progress', 'work_done', 'completed', 'cancelled', 'rejected'])
    .withMessage('Invalid status')
];

const addNotesValidation = [
  body('notes').trim().notEmpty().withMessage('Notes are required')
];

// Routes
router.get('/pending', authenticate, isVendor, getPendingBookings); // Fetch missed alerts on reconnect
router.get('/ratings', authenticate, isVendor, getVendorRatings);
router.get('/', authenticate, isVendor, getVendorBookings);
router.get('/:id', authenticate, isVendor, getBookingById);
router.post('/:id/accept', authenticate, isVendor, acceptBooking);
router.post('/:id/reject', authenticate, isVendor, rejectBookingValidation, rejectBooking);
router.post('/:id/cancel-accepted', authenticate, isVendor, cancelAcceptedBooking);
router.post('/:id/request-cancel', authenticate, isVendor, requestCancelBooking);
router.post('/:id/reschedule/accept', authenticate, isVendor, acceptReschedule);
router.post('/:id/reschedule/reject', authenticate, isVendor, rejectReschedule);
router.post('/:id/assign-worker', authenticate, isVendor, assignWorkerValidation, assignWorker);
router.put('/:id/status', authenticate, isVendor, updateStatusValidation, updateBookingStatus);
router.post('/:id/notes', authenticate, isVendor, addNotesValidation, addVendorNotes);

// Self-Job Routes
router.post('/:id/self/start', authenticate, isVendor, startSelfJob);
router.post('/:id/self/reached', authenticate, isVendor, vendorReachedLocation);
router.post('/:id/self/visit/verify', authenticate, isVendor, verifySelfVisit);
router.post('/:id/self/complete', authenticate, isVendor, completeSelfJob);
router.post('/:id/self/payment/collect', authenticate, isVendor, collectSelfCash);
router.post('/:id/self/addon-payment/collect-cash', authenticate, isVendor, collectAddonCash);

// Payment Route
router.post('/:id/pay-worker', authenticate, isVendor, payWorker);

// Reconfirmation Route
router.put('/:id/reconfirm', authenticate, isVendor, reconfirmBooking);

module.exports = router;

