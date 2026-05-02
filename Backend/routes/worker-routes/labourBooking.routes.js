const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const {
  getOnlineLabours,
  bookLabour,
  acceptBooking,
  rejectBooking,
  getMyBookings,
  getMyActiveBooking,
  completeBooking,
  getUserLabourBookings
} = require('../../controllers/workerControllers/labourBookingController');

// Public: Get online labours (user + vendor can see)
router.get('/online', authenticate, getOnlineLabours);

// Book a labour (USER or VENDOR can book)
router.post('/book', authenticate, bookLabour);

// Labour actions (only WORKER role)
router.post('/accept/:bookingId', authenticate, acceptBooking);
router.post('/reject/:bookingId', authenticate, rejectBooking);
router.post('/complete/:bookingId', authenticate, completeBooking);

// Get bookings for labour dashboard
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/active', authenticate, getMyActiveBooking);

// Get labour bookings for User/Vendor
router.get('/user-bookings', authenticate, getUserLabourBookings);


module.exports = router;
