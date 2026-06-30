const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const Worker = null; // Worker system removed
const { validationResult } = require('express-validator');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { createNotification } = require('../notificationControllers/notificationController');
const { sendNotificationToUser, sendNotificationToVendor, sendNotificationToWorker } = require('../../services/firebaseAdmin');

/**
 * Get vendor bookings with filters
 */
const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, q, page = 1, limit = 20 } = req.query;

    // ── Get vendor categories from req.user (set in auth middleware) ──
    let vendorCategories = req.user.categories || req.user.service || [];
    if (!vendorCategories.length) {
      const Vendor = require('../../models/Vendor');
      const v = await Vendor.findById(vendorId, 'service').lean();
      vendorCategories = v?.service || [];
    }

    const vId = new mongoose.Types.ObjectId(vendorId);

    // ── Build Base Query ──
    // This Or condition ensures vendors see their own jobs OR relevant unassigned alerts
    const query = {
      $or: [
        { vendorId: vId, status: { $ne: BOOKING_STATUS.AWAITING_PAYMENT } },
        {
          vendorId: null,
          status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING, BOOKING_STATUS.BIDDING] },
          serviceCategory: { $in: vendorCategories },
          'potentialVendors.vendorId': vId // Only show jobs where THIS vendor is within range
        }
      ]
    };

    // ── Apply Status Group Filters ──
    if (status && status !== 'all') {
      if (status === 'in_progress') {
        query.status = {
          $in: [
            BOOKING_STATUS.ACCEPTED,
            BOOKING_STATUS.ASSIGNED,
            BOOKING_STATUS.CONFIRMED,
            BOOKING_STATUS.JOURNEY_STARTED,
            BOOKING_STATUS.VISITED,
            BOOKING_STATUS.IN_PROGRESS,
            BOOKING_STATUS.WORK_DONE,
            'started', 'reached', 'on_the_way' // Supporting minor variants if they exist
          ]
        };
      } else if (status === 'completed') {
        query.status = {
          $in: [
            BOOKING_STATUS.COMPLETED,
            'worker_paid', 'settlement_pending', 'paid', 'closed'
          ]
        };
      } else if (status === 'assigned') {
        query.status = { $in: [BOOKING_STATUS.ASSIGNED, 'worker_accepted'] };
      } else {
        query.status = status;
      }
    }

    // ── Apply Search Filter (Simple regex on serviceName or bookingNumber) ──
    if (q) {
      query.$and = [
        {
          $or: [
            { serviceName: { $regex: q, $options: 'i' } },
            { bookingNumber: { $regex: q, $options: 'i' } }
          ]
        }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ── Single DB round-trip: list + total via $facet ──
    const [result] = await Booking.aggregate([
      { $match: query },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
              $project: {
                _id: 1,
                bookingNumber: 1,
                status: 1,
                paymentMethod: 1,
                finalAmount: 1,
                scheduledDate: 1,
                scheduledTime: 1,
                serviceName: 1,
                serviceCategory: 1,
                categoryIcon: 1,
                createdAt: 1,
                'address.addressLine1': 1,
                'address.city': 1,
                userId: 1,
                workerId: 1,
                serviceId: 1,
                acceptedAt: 1,
                assignedAt: 1,
                brandName: 1,
                brandIcon: 1,
                expiresAt: 1
              }
            }
          ],
          total: [{ $count: 'n' }]
        }
      }
    ]);

    const bookings = result.data || [];
    const total = result.total?.[0]?.n || 0;

    // ── Populate only required fields ──
    await Booking.populate(bookings, [
      { path: 'userId', select: 'name', options: { lean: true } },
      { path: 'workerId', select: 'name', options: { lean: true } },
      {
        path: 'serviceId',
        select: 'title iconUrl categoryId',
        populate: { path: 'categoryId', select: 'title' },
        options: { lean: true }
      }
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings. Please try again.'
    });
  }
};


/**
 * Get booking details by ID
 */
const getBookingById = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({
      _id: id,
      $or: [
        { vendorId },
        { vendorId: null, status: { $in: ['requested', 'searching', 'bidding'] } }
      ]
    })
      .populate('userId', 'name phone email profilePhoto')
      .populate('vendorId', 'name businessName phone email')
      .populate('serviceId', 'title description iconUrl images')
      .populate('categoryId', 'title slug')
      .populate('workerId', 'name phone rating totalJobs completedJobs');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if THIS vendor has already submitted a bid for this booking
    const Bid = require('../../models/Bid');
    const existingBid = await Bid.findOne({ bookingId: id, vendorId });

    const bookingData = booking.toObject();
    const phoneRevealedStatuses = ['visited', 'in_progress', 'work_done', 'final_settlement', 'completed'];
    const canSeePhone = phoneRevealedStatuses.includes(booking.status) && booking.vendorId && booking.vendorId._id.toString() === vendorId.toString();

    if (!canSeePhone) {
      if (bookingData.userId) {
        bookingData.userId.phone = undefined;
        bookingData.userId.email = undefined;
      }
      if (bookingData.workerId) {
        bookingData.workerId.phone = undefined;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...bookingData,
        hasSubmittedBid: !!existingBid,
        myBid: existingBid,
        isSelfJob: !!(booking.assignedAt && !booking.workerId)
      }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking. Please try again.'
    });
  }
};

function parseScheduledStartTime(scheduledDate, timeStr) {
  const date = new Date(scheduledDate);
  if (isNaN(date.getTime())) return new Date();

  let hours = 0;
  let minutes = 0;
  if (typeof timeStr === 'string') {
    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    let numericTime = cleanTime.replace(/[AP]M/, '').trim();
    const parts = numericTime.split(':');
    if (parts.length >= 1) {
      hours = parseInt(parts[0], 10) || 0;
    }
    if (parts.length >= 2) {
      minutes = parseInt(parts[1], 10) || 0;
    }
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Accept booking
 */
const acceptBooking = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const bookingCheck = await Booking.findById(id);
    if (!bookingCheck) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // ── Handle Bidding/Multi-Quote Flow ──
    if (bookingCheck.isBidding && bookingCheck.status === BOOKING_STATUS.BIDDING) {
      // Check if already bid
      const Bid = require('../../models/Bid');
      const existingBid = await Bid.findOne({ bookingId: id, vendorId });
      if (existingBid) {
        return res.status(400).json({ success: false, message: 'You have already submitted your response for this job.' });
      }

      // Create Bid (use finalAmount as default price for services)
      const bid = await Bid.create({
        bookingId: id,
        vendorId,
        price: bookingCheck.finalAmount || 0,
        status: 'pending'
      });

      // Update BookingRequest for this vendor
      const BookingRequest = require('../../models/BookingRequest');
      await BookingRequest.findOneAndUpdate(
        { bookingId: id, vendorId },
        { status: 'ACCEPTED', respondedAt: new Date() } // Mark as accepted but don't close booking
      );

      // Notify User via Socket
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${bookingCheck.userId.toString()}`).emit('new_bid_received', {
          bookingId: id,
          bidId: bid._id,
          price: bid.price,
          vendor: {
            id: vendorId,
            name: req.user.name,
            businessName: req.user.businessName,
            rating: req.user.rating || 4.8
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Your response has been sent to the customer. Please wait for their selection.',
        data: bid
      });
    }

    // ── Original Direct Acceptance Flow (For non-bidding or already assigned) ──
    const activeSelfJob = await Booking.findOne({
      vendorId: vendorId,
      isSelfJob: true,
      status: { $in: ['accepted', 'assigned', 'visited', 'in_progress', 'work_done', 'final_settlement'] }
    });

    if (activeSelfJob) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active self-job. Complete it before accepting another.'
      });
    }

    const isInstant = bookingCheck.bookingType === 'instant';
    const statusToSet = isInstant ? BOOKING_STATUS.CONFIRMED : BOOKING_STATUS.ACCEPTED;
    const isSelfJobToSet = isInstant ? true : false;

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: id,
        status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING] },
        vendorId: null // Crucial: Ensures another request didn't just take it
      },
      {
        $set: {
          vendorId: vendorId,
          acceptedAt: new Date(),
          status: statusToSet,
          isSelfJob: isSelfJobToSet
        }
      },
      { new: true } // Return updated doc
    );

    if (!updatedBooking) {
      // If update failed, check why (likely already taken)
      const existing = await Booking.findById(id);
      if (existing && existing.vendorId) {
        return res.status(409).json({ // 409 Conflict
          success: false,
          message: 'Sorry, this job has already been accepted by another vendor.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Booking is no longer available.'
      });
    }

    // Booking successfully accepted by THIS vendor
    const booking = updatedBooking;

    // Update vendor availability to ON_JOB / RESERVED depending on bookingType
    const Vendor = require('../../models/Vendor');
    if (booking.bookingType === 'instant') {
      await Vendor.findByIdAndUpdate(vendorId, {
        availability: 'ON_JOB',
        workStatus: 'busy',
        availabilityStatus: 'BUSY',
        reservedBookingId: booking._id,
        reservedFrom: new Date()
      });
    } else {
      // Scheduled booking availability logic
      const slotStart = parseScheduledStartTime(booking.scheduledDate, booking.timeSlot?.start || booking.scheduledTime);
      const reservedFrom = new Date(slotStart.getTime() - 60 * 60 * 1000); // 1 hour before slot starts

      await Vendor.findByIdAndUpdate(vendorId, {
        reservedFrom,
        reservedBookingId: booking._id,
        availabilityStatus: 'ONLINE',
        availability: 'AVAILABLE',
        workStatus: 'available'
      });
    }

    // Update BookingRequest statuses
    const BookingRequest = require('../../models/BookingRequest');

    // Mark this vendor's request as ACCEPTED
    await BookingRequest.findOneAndUpdate(
      { bookingId: id, vendorId },
      { status: 'ACCEPTED', respondedAt: new Date() }
    );

    // Mark all other vendors' requests as EXPIRED/CANCELLED
    await BookingRequest.updateMany(
      { bookingId: id, vendorId: { $ne: vendorId } },
      { status: 'EXPIRED', respondedAt: new Date() }
    );

    // Check payment status correction (if needed, though we set CONFIRMED above)
    if (booking.paymentMethod === 'plan_benefit' && booking.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      // already good
    }

    // NOTIFY OTHER VENDORS to remove this job
    // Use the stored notifiedVendors list
    const io = req.app.get('io');
    if (io && booking.notifiedVendors && booking.notifiedVendors.length > 0) {
      console.log(`[AcceptBooking] Notifying ${booking.notifiedVendors.length} other vendors that job ${booking._id} was taken`);
      booking.notifiedVendors.forEach(otherVendorId => {
        // Skip the current vendor
        if (otherVendorId.toString() !== vendorId.toString()) {
          const room = `vendor_${otherVendorId.toString()}`;
          console.log(`[AcceptBooking] Emitting booking_taken to room: ${room}`);
          io.to(room).emit('booking_taken', {
            bookingId: booking._id.toString(), // Ensure string for frontend comparison
            message: 'This job has been accepted by someone else.'
          });
        }
      });
    } else {
      console.log('[AcceptBooking] No other vendors to notify or io not available');
    }

    // Emit real-time updates to USER
    if (io) {
      const isAcceptedOnly = booking.status === BOOKING_STATUS.ACCEPTED;
      const message = isAcceptedOnly
        ? 'Vendor has accepted your request. Worker not assigned yet.'
        : 'Vendor has accepted your request. Your booking is confirmed!';

      io.to(`user_${booking.userId}`).emit('booking_accepted', {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        vendor: {
          id: vendorId,
          name: req.user.name,
          businessName: req.user.businessName
        },
        message
      });

      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: booking.status,
        message: isAcceptedOnly ? 'Vendor accepted, worker not assigned yet' : 'Vendor has accepted your request'
      });
    }

    // Send notification to user
    const isAcceptedOnly = booking.status === BOOKING_STATUS.ACCEPTED;
    const notificationMessage = isAcceptedOnly
      ? `Your booking ${booking.bookingNumber} is accepted! ${req.user.businessName || req.user.name} has accepted the job and will assign a worker soon.`
      : `Your booking ${booking.bookingNumber} is confirmed! ${req.user.businessName || req.user.name} will arrive at scheduled time.`;

    await createNotification({
      userId: booking.userId,
      type: 'booking_accepted',
      title: isAcceptedOnly ? 'Booking Accepted!' : 'Booking Confirmed!',
      message: notificationMessage,
      relatedId: booking._id,
      relatedType: 'booking',
      pushData: {
        type: 'booking_accepted',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
        // dataOnly: true // Ensure user sees this
      }
    });

    // Send Push Notification to user (handled by createNotification)

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      data: booking
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking. Please try again.'
    });
  }
};

/**
 * Reject booking
 * IMPORTANT: This only marks the vendor's rejection, NOT the booking itself.
 * Booking stays SEARCHING so other vendors can accept.
 */
const rejectBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    // Find booking
    const booking = await Booking.findOne({
      _id: id,
      $or: [
        { notifiedVendors: vendorId },
        { vendorId: null, status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING] } }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not available for rejection'
      });
    }

    const validStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING];
    if (!validStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject booking with status: ${booking.status}`
      });
    }

    // Update BookingRequest for this vendor
    const BookingRequest = require('../../models/BookingRequest');
    await BookingRequest.findOneAndUpdate(
      { bookingId: id, vendorId },
      {
        status: 'REJECTED',
        respondedAt: new Date(),
        rejectReason: reason || 'Rejected by vendor'
      }
    );

    // Remove vendor from notifiedVendors (they've responded)
    booking.notifiedVendors = booking.notifiedVendors.filter(
      v => v.toString() !== vendorId.toString()
    );

    // Remove from potentialVendors too
    booking.potentialVendors = booking.potentialVendors.filter(
      v => v.vendorId?.toString() !== vendorId.toString()
    );

    // Check if ALL vendors have rejected
    const pendingRequests = await BookingRequest.countDocuments({
      bookingId: id,
      status: { $in: ['PENDING', 'VIEWED'] }
    });

    const remainingPotential = booking.potentialVendors.length;

    if (pendingRequests === 0 && remainingPotential === 0) {
      // No vendors left - mark booking as failed
      booking.status = BOOKING_STATUS.NO_VENDORS;
      booking.cancelledAt = new Date();
      booking.cancelledBy = 'system';
      booking.cancellationReason = 'All vendors rejected the request';

      // Notify user that no vendors are available
      await createNotification({
        userId: booking.userId,
        type: 'booking_rejected',
        title: 'No Vendors Available',
        message: `Sorry, no vendors are available for booking ${booking.bookingNumber}. Please try again later.`,
        relatedId: booking._id,
        relatedType: 'booking',
        pushData: {
          type: 'booking_rejected',
          bookingId: booking._id.toString(),
          link: `/user/booking/${booking._id}`
        }
      });

      // --- ADD SOCKET NOTIFICATION FOR REAL-TIME UI UPDATE ---
      const io = req.app.get('io');
      if (io) {
        const userIdStr = booking.userId.toString();
        const bookingIdStr = booking._id.toString();

        console.log(`[RejectBooking] No vendors left for booking ${booking.bookingNumber}. Notifying rooms: user_${userIdStr}, booking_${bookingIdStr}`);

        const payload = {
          bookingId: bookingIdStr,
          status: BOOKING_STATUS.NO_VENDORS,
          message: 'All nearby vendors are currently unavailable for this request.'
        };

        // Emit to user room
        io.to(`user_${userIdStr}`).emit('booking_search_failed', payload);
        io.to(`user_${userIdStr}`).emit('booking_updated', payload);

        // Also emit to specific booking room (as fallback)
        io.to(`booking_${bookingIdStr}`).emit('booking_search_failed', payload);
        io.to(`booking_${bookingIdStr}`).emit('booking_updated', payload);
      }
    }
    // Otherwise, booking stays SEARCHING for other vendors

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: { bookingId: id }
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking. Please try again.'
    });
  }
};

/**
 * Cancel Accepted Booking (Vendor)
 * Only allowed within 3 minutes of acceptance
 */
const cancelAcceptedBooking = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not accepted by you'
      });
    }

    if (!booking.acceptedAt) {
      return res.status(400).json({
        success: false,
        message: 'Booking has no acceptance timestamp'
      });
    }

    const timeSinceAcceptanceMs = Date.now() - new Date(booking.acceptedAt).getTime();
    if (timeSinceAcceptanceMs > 3 * 60 * 1000) { // 3 minutes
      return res.status(400).json({
        success: false,
        message: 'You can only cancel an accepted booking within 3 minutes of accepting it.'
      });
    }

    // Reset booking to SEARCHING
    booking.vendorId = null;
    booking.workerId = null;
    booking.isSelfJob = false;
    booking.status = BOOKING_STATUS.SEARCHING;
    booking.acceptedAt = null;
    booking.assignedAt = null;
    booking.currentWave = 1; // Restart waves
    booking.waveStartedAt = new Date(); // Start wave timer now
    // Remove this vendor from potential vendors so they don't get pinged again
    booking.potentialVendors = booking.potentialVendors.filter(v => v.vendorId?.toString() !== vendorId.toString());

    // Also remove from notified vendors so they don't get the 'booking_taken' later
    booking.notifiedVendors = booking.notifiedVendors.filter(v => v.toString() !== vendorId.toString());

    await booking.save();

    // Reset Vendor availability
    const Vendor = require('../../models/Vendor');
    await Vendor.findByIdAndUpdate(vendorId, {
      workStatus: 'available',
      availabilityStatus: 'ONLINE',
      availability: 'AVAILABLE',
      reservedBookingId: null,
      reservedFrom: null
    });

    // Notify user
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId.toString()}`).emit('booking_updated', {
        bookingId: booking._id,
        status: BOOKING_STATUS.SEARCHING,
        message: 'Vendor had to cancel. We are searching for another vendor...'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully and returned to search pool.'
    });

  } catch (error) {
    console.error('Cancel accepted booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking. Please try again.'
    });
  }
};

/**
 * Assign worker to booking
 */
const assignWorker = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { id } = req.params;
    const { workerId } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Enforce 30 minutes before slot start validation
    if (booking.bookingType === 'scheduled') {
      const slotStart = parseScheduledStartTime(booking.scheduledDate, booking.timeSlot?.start || booking.scheduledTime);
      const now = new Date();
      const thirtyMinutesBefore = new Date(slotStart.getTime() - 30 * 60 * 1000);
      if (now < thirtyMinutesBefore) {
        return res.status(400).json({
          success: false,
          message: 'You can only assign a worker or yourself starting 30 minutes before the scheduled time slot.'
        });
      }
    }

    // Handle "Assign to Self"
    if (workerId === 'SELF') {
      if (!booking.isSelfJob) {
        const activeSelfJob = await Booking.findOne({
          vendorId: vendorId,
          isSelfJob: true,
          status: { $in: ['accepted', 'assigned', 'visited', 'in_progress', 'work_done', 'final_settlement'] }
        });

        if (activeSelfJob) {
          return res.status(400).json({
            success: false,
            message: 'You already have an active self-job. Complete it before assigning another to yourself.'
          });
        }
        booking.isSelfJob = true;
      }

      booking.workerId = null; // null means vendor itself
      booking.assignedAt = new Date();

      if (booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.ACCEPTED) {
        booking.status = BOOKING_STATUS.ASSIGNED;
      }

      await booking.save();

      const Vendor = require('../../models/Vendor');
      await Vendor.findByIdAndUpdate(vendorId, { workStatus: 'busy' });

      // Notify User
      await createNotification({
        userId: booking.userId,
        type: 'worker_assigned',
        title: 'Service Provider Assigned',
        message: `Vendor ${req.user.businessName || req.user.name} will handle your booking ${booking.bookingNumber} personally.`,
        relatedId: booking._id,
        relatedType: 'booking',
        pushData: {
          type: 'worker_assigned',
          bookingId: booking._id.toString(),
          link: `/user/booking/${booking._id}`
        }
      });

      // Emit socket event for real-time UI refresh
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${booking.userId}`).emit('booking_updated', {
          bookingId: booking._id,
          status: booking.status,
          message: 'Professional assigned to your booking'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Assigned to yourself successfully',
        data: booking
      });
    }

    // Verify worker belongs to vendor
    const worker = await Worker.findOne({ _id: workerId, vendorId });
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found or does not belong to your vendor account'
      });
    }

    // Check if worker is frozen
    if (worker.isFrozen) {
      return res.status(400).json({
        success: false,
        message: 'This worker account is currently frozen and cannot be assigned to new jobs.'
      });
    }

    // Check if worker is active
    const validStatuses = ['active', 'ONLINE', 'ACTIVE'];
    if (!validStatuses.includes(worker.status) && !validStatuses.includes(worker.currentAvailability)) {
      return res.status(400).json({
        success: false,
        message: `Worker is not available (Status: ${worker.status || worker.currentAvailability})`
      });
    }

    // Update booking
    booking.workerId = workerId;
    booking.assignedAt = new Date();
    booking.isSelfJob = false;

    // Set status to ASSIGNED immediately. 
    // If worker rejects, respondToJob logic reverts it to CONFIRMED.
    booking.status = BOOKING_STATUS.ASSIGNED;

    booking.workerResponse = 'PENDING';
    booking.workerAcceptedAt = undefined;

    await booking.save();

    const Vendor = require('../../models/Vendor');
    await Vendor.updateWorkStatus(vendorId);

    // Send notification to user
    await createNotification({
      userId: booking.userId,
      type: 'worker_assigned',
      title: 'Service Provider Assigned',
      message: `${worker.name} has been assigned to your booking. Check app for details.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high', // Ensure high priority delivery
      pushData: {
        type: 'worker_assigned',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
        // dataOnly: false // Explicitly false
      }
    });

    // Send notification to worker
    await createNotification({
      workerId,
      type: 'booking_created',
      title: 'New Job Assigned',
      message: `You have been assigned to booking ${booking.bookingNumber}.`,
      relatedId: booking._id,
      relatedType: 'booking',
      pushData: {
        type: 'job_assigned',
        bookingId: booking._id.toString(),
        link: `/worker/job/${booking._id}`
      }
    });

    // Send FCM push notification to worker
    // Manual push removed - auto handled by createNotification
    // sendNotificationToWorker(workerId, { ... });

    const io = req.app.get('io');
    if (io) {
      io.to(`worker_${workerId}`).emit('new_job_assigned', {
        bookingId: booking._id,
        serviceName: booking.serviceId?.title || booking.serviceName || 'Service',
        customerName: booking.userId?.name || 'Customer',
        customerPhone: booking.userId?.phone,
        address: booking.address,
        price: booking.finalAmount,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
      });

      // Notify User in real-time
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: booking.status,
        message: 'Professional assigned to your booking'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Worker assigned successfully',
      data: booking
    });
  } catch (error) {
    console.error('Assign worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign worker. Please try again.'
    });
  }
};

/**
 * Update booking status
 */
const updateBookingStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { id } = req.params;
    const { status, workerPaymentStatus, finalSettlementStatus } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Validate status transition if status is changing
    if (status && status !== booking.status) {
      // 2-minute cancellation limit for vendor after acceptance
      if (status === BOOKING_STATUS.CANCELLED || status === 'cancelled') {
        if (booking.acceptedAt) {
          const acceptedTime = new Date(booking.acceptedAt).getTime();
          const currentTime = Date.now();
          const timeDiffMinutes = (currentTime - acceptedTime) / (1000 * 60);
          if (timeDiffMinutes > 2) {
            return res.status(400).json({
              success: false,
              message: 'Cannot cancel booking after 2 minutes of acceptance.'
            });
          }
        }
      }

      const validTransitions = {
        [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED],
        [BOOKING_STATUS.AWAITING_PAYMENT]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED],
        [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
        [BOOKING_STATUS.ASSIGNED]: [BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.WORK_DONE, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
        [BOOKING_STATUS.VISITED]: [BOOKING_STATUS.WORK_DONE, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
        [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.WORK_DONE, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
        [BOOKING_STATUS.WORK_DONE]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED]
      };

      if (!validTransitions[booking.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${booking.status} to ${status}`
        });
      }

      // Update booking status
      booking.status = status;

      if (status === BOOKING_STATUS.IN_PROGRESS && !booking.startedAt) {
        booking.startedAt = new Date();
      }

      if (status === BOOKING_STATUS.WORK_DONE && !booking.completedAt) {
        // Work done timestamp? Maybe reuse/add field? For now leave it.
      }

      if (status === BOOKING_STATUS.COMPLETED) {
        booking.completedAt = new Date();
      }
    }

    // Update other fields
    if (workerPaymentStatus) {
      booking.workerPaymentStatus = workerPaymentStatus;
      if (workerPaymentStatus === 'PAID' || workerPaymentStatus === 'SUCCESS') {
        booking.isWorkerPaid = true;
        booking.workerPaidAt = booking.workerPaidAt || new Date();
      }
    }
    if (finalSettlementStatus) booking.finalSettlementStatus = finalSettlementStatus;

    await booking.save();

    // Send notification
    if (status === BOOKING_STATUS.COMPLETED) {
      await createNotification({
        userId: booking.userId,
        type: 'booking_completed',
        title: 'Booking Completed',
        message: `Your booking ${booking.bookingNumber} has been completed. Please rate your experience.`,
        relatedId: booking._id,
        relatedType: 'booking',
        pushData: {
          type: 'booking_completed',
          bookingId: booking._id.toString(),
          link: `/user/booking/${booking._id}`
        }
      });

      // Send FCM push notification to user
      // Manual push removed - auto handled by createNotification
      // sendNotificationToUser(booking.userId, { ... });

      // SEND INVOICE EMAILS
      try {
        const { sendBookingCompletionEmails } = require('../../services/emailService');
        const fullBooking = await Booking.findById(booking._id)
          .populate('userId')
          .populate('vendorId')
          .populate('serviceId');

        sendBookingCompletionEmails(fullBooking).catch(err => console.error(err));
      } catch (emailErr) {
        console.error('Failed to send completion emails:', emailErr);
      }
    }

    // Emit socket event for real-time UI refresh
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: booking.status,
        message: `Booking status updated to ${booking.status}`
      });
    }

    // ── Update Vendor Performance Stats & Availability ──
    if (status === BOOKING_STATUS.COMPLETED || status === BOOKING_STATUS.CANCELLED) {
      try {
        const { updateVendorStats } = require('../../utils/vendorStatsHelper');
        updateVendorStats(vendorId);

        // Also free up the vendor's availability so they appear online to new users
        const Vendor = require('../../models/Vendor');
        await Vendor.findByIdAndUpdate(vendorId, { availability: 'AVAILABLE' });
        await Vendor.updateWorkStatus(vendorId);
      } catch (statsErr) {
        console.error('Error updating vendor stats after status change:', statsErr);
      }
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated successfully`,
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status. Please try again.'
    });
  }
};

/**
 * Add vendor notes to booking
 */
const addVendorNotes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vendorId = req.user.id;
    const { id } = req.params;
    const { notes } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking
    booking.vendorNotes = notes;

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Notes added successfully',
      data: booking
    });
  } catch (error) {
    console.error('Add vendor notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add notes. Please try again.'
    });
  }
};

/**
 * Start Self Job (Vendor performing job)
 */
const startSelfJob = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure no worker is assigned (or self-assigned flag?) implementation assumes workerId null means unassigned or self?
    // User says: "if vendor didn't assignes to worker and do himself"
    // Usually means workerId is null.
    if (booking.workerId) {
      return res.status(400).json({ success: false, message: 'Worker is assigned to this booking. You cannot start it yourself unless you unassign worker.' });
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED && booking.status !== BOOKING_STATUS.ASSIGNED) {
      // Allow ASSIGNED if we consider "Self Assigned" as a state? 
      // If workerId is null, status usually CONFIRMED.
      // But lets allow generic flow.
    }

    // Status Check
    const allowed = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.AWAITING_PAYMENT];
    if (!allowed.includes(booking.status) && booking.status !== BOOKING_STATUS.ACCEPTED) { // flexible
      // check strict
    }

    // Generate Visit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Update booking
    booking.status = BOOKING_STATUS.JOURNEY_STARTED;
    booking.journeyStartedAt = new Date();
    booking.visitOtp = otp;
    booking.assignedAt = new Date(); // Implicitly assigned to self now

    await booking.save();

    const Vendor = require('../../models/Vendor');
    await Vendor.findByIdAndUpdate(vendorId, {
      availability: 'ON_JOB',
      workStatus: 'busy',
      availabilityStatus: 'BUSY'
    });

    // Notify user
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'worker_started',
      title: 'Vendor Started Journey',
      message: `Vendor is on the way! OTP for verification: ${otp}.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'journey_started',
        bookingId: booking._id.toString(),
        visitOtp: otp,
        link: `/user/booking/${booking._id}`
      }
    });

    // Send FCM push notification to user
    // Manual push removed - auto handled by createNotification
    // sendNotificationToUser(booking.userId, { ... });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: BOOKING_STATUS.JOURNEY_STARTED,
        visitOtp: otp
      });
      // Socket notification removed - createNotification already handles this
    }

    res.status(200).json({ success: true, message: 'Journey started, OTP sent', data: booking });
  } catch (error) {
    console.error('Start self job error:', error);
    res.status(500).json({ success: false, message: 'Failed to start job' });
  }
};

/**
 * Vendor Reached Location
 * Notify user to share OTP
 */
const vendorReachedLocation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { reachedPhotos } = req.body;

    // Need visitOtp to resend it
    const booking = await Booking.findOne({ _id: id, vendorId }).select('+visitOtp');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== BOOKING_STATUS.JOURNEY_STARTED) {
      return res.status(400).json({ success: false, message: 'Journey not started yet' });
    }

    if (reachedPhotos) {
      booking.reachedPhotos = reachedPhotos;
      await booking.save();
    }

    const otp = booking.visitOtp;

    // Notify user
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'vendor_reached',
      title: 'Vendor has Reached!',
      message: `Vendor has reached your location. Please share this OTP: ${otp}`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'vendor_reached',
        bookingId: booking._id.toString(),
        visitOtp: otp,
        link: `/user/booking/${booking._id}`
      }
    });

    // Socket notification removed - createNotification already handles this

    res.status(200).json({ success: true, message: 'User notified that vendor reached' });
  } catch (error) {
    console.error('Vendor reached location error:', error);
    res.status(500).json({ success: false, message: 'Failed to notify user' });
  }
};

/**
 * Verify Self Visit
 */
const verifySelfVisit = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { otp, location } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId }).select('+visitOtp');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== BOOKING_STATUS.JOURNEY_STARTED) return res.status(400).json({ success: false, message: 'Journey not started' });

    // Allow master OTP 1234 for testing
    if (booking.visitOtp !== otp && otp !== '1234') return res.status(400).json({ success: false, message: 'Invalid OTP' });

    booking.status = BOOKING_STATUS.VISITED;
    booking.visitedAt = new Date();
    booking.startedAt = new Date();
    booking.visitOtp = undefined;
    if (location) {
      booking.visitLocation = { ...location, verifiedAt: new Date() };
    }

    await booking.save();

    // Notify user
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'visit_verified',
      title: 'Visit Verified',
      message: `The professional has arrived and verified the visit. Service is now in progress.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high', // Ensure high priority
      pushData: {
        type: 'visit_verified',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: BOOKING_STATUS.VISITED,
        message: 'Visit verified successful'
      });
      // Socket notification removed - createNotification already handles this
    }

    res.status(200).json({ success: true, message: 'Visit verified', data: booking });
  } catch (error) {
    console.error('Verify self visit error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify visit' });
  }
};

/**
 * Complete Self Job & Generate Bill
 * ──────────────────────────────────
 * Revenue Model:
 *   Vendor → 70% of total service BASE (excl GST)
 *   Vendor → 10% of total parts BASE  (excl GST)
 *   GST    → 100% retained by company
 *
 * CRITICAL: Vendor earnings are NOT written to Booking.
 *           VendorBill is the single source of truth.
 *           Earnings are only credited to wallet AFTER payment.
 */
const completeSelfJob = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { workPhotos, workDoneDetails, billDetails } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Status guard — allow work_done for idempotent re-trigger (e.g. vendor clicks again after partial failure)
    const alreadyDone = booking.status === BOOKING_STATUS.WORK_DONE;
    if (!alreadyDone && booking.status !== BOOKING_STATUS.VISITED && booking.status !== BOOKING_STATUS.IN_PROGRESS) {
      return res.status(400).json({ success: false, message: 'Cannot complete from current status' });
    }

    // Prevent duplicate bills - UPDATE: If bill exists (e.g. from Add-on modal), use it instead of failing!
    const VendorBill = require('../../models/VendorBill');
    let bill = await VendorBill.findOne({ bookingId: booking._id });
    let grandTotal;
    let allServices = [];
    let billParts = [];

    if (!bill) {
      // ── Fetch Settings & Vendor (frozen snapshot for this bill) ──
      const Settings = require('../../models/Settings');
      const Vendor = require('../../models/Vendor');
      const settings = await Settings.findOne({ type: 'global' });
      const vendor = await Vendor.findById(vendorId).select('commissionRate level');

      // Dynamic split based on vendor performance
      // If it's a cash job, we calculate commission now to add to DUES.
      // If it's an online job, we credit GROSS (100%) and deduct at withdrawal as requested.
      const isOnlineJob = booking.paymentMethod === 'online' || booking.paymentMethod === 'Qr online';

      // Get Dynamic Commission from Settings based on Vendor Level (DISABLED: Commission removed)
      const dynamicCommission = 0;

      const serviceSplitPct = isOnlineJob ? 100 : (100 - dynamicCommission);
      const partsSplitPct = settings?.partsPayoutPercentage ?? 10;
      const serviceGstPct = settings?.serviceGstPercentage ?? 18;
      const partsGstPct = settings?.partsGstPercentage ?? 18;

      // ═══════════════════════════════════════════
      // STEP 1: BUILD LINE ITEMS
      // ═══════════════════════════════════════════

      // -- Original booking service (from basePrice) --
      const originalBase = Number(booking.basePrice) || 0;
      // Use stored tax from booking to ensure 100% consistency with initial quote
      const originalGST = Number(booking.tax) || parseFloat(((originalBase * serviceGstPct) / 100).toFixed(2));

      // -- Vendor-added services --
      const billServices = (billDetails?.services || []).map(svc => {
        const price = Number(svc.price) || 0;
        const qty = Number(svc.quantity) || 1;
        const base = price * qty;
        const gst = parseFloat(((base * serviceGstPct) / 100).toFixed(2));
        return {
          catalogId: svc.catalogId || undefined,
          name: svc.name || 'Service',
          price,
          gstPercentage: serviceGstPct,
          quantity: qty,
          gstAmount: gst,
          total: parseFloat((base + gst).toFixed(2)),
          isOriginal: false
        };
      });

      // -- Parts --
      billParts = (billDetails?.parts || []).map(part => {
        const price = Number(part.price) || 0;
        const qty = Number(part.quantity) || 1;
        const pGstPct = (part.gstPercentage != null) ? Number(part.gstPercentage) : partsGstPct;
        const base = price * qty;
        const gst = parseFloat(((base * pGstPct) / 100).toFixed(2));
        return {
          catalogId: part.catalogId || undefined,
          name: part.name || 'Part',
          price,
          gstPercentage: pGstPct,
          quantity: qty,
          gstAmount: gst,
          total: parseFloat((base + gst).toFixed(2))
        };
      });

      // ═══════════════════════════════════════════
      // STEP 2: CALCULATE BASE TOTALS
      // ═══════════════════════════════════════════

      const vendorServiceBase = billServices.reduce((s, sv) => s + (sv.price * sv.quantity), 0);
      const totalServiceBase = parseFloat((originalBase + vendorServiceBase).toFixed(2));
      const totalPartsBase = parseFloat(billParts.reduce((s, p) => s + (p.price * p.quantity), 0).toFixed(2));

      // ═══════════════════════════════════════════
      // STEP 3: CALCULATE GST TOTALS
      // ═══════════════════════════════════════════

      const vendorServiceGST = parseFloat(billServices.reduce((s, sv) => s + sv.gstAmount, 0).toFixed(2));
      const partsGST = parseFloat(billParts.reduce((s, p) => s + p.gstAmount, 0).toFixed(2));
      const totalGST = parseFloat((originalGST + vendorServiceGST + partsGST).toFixed(2));

      // ═══════════════════════════════════════════
      // STEP 4: FINAL BILL (what user pays)
      // ═══════════════════════════════════════════

      const visitingCharges = Number(booking.visitingCharges) || 0;
      grandTotal = parseFloat((totalServiceBase + totalPartsBase + totalGST + visitingCharges).toFixed(2));

      // ═══════════════════════════════════════════
      // STEP 5: REVENUE SPLIT (internal only)
      // ═══════════════════════════════════════════
      // Vendor % is applied ONLY on base — never on GST
      // TODO:
      // New dual-invoice accounting logic will be implemented here.
      const vendorServiceEarning = 0;
      const vendorPartsEarning = 0;
      const vendorTotalEarning = 0;
      const companyRevenue = 0;

      // ═══════════════════════════════════════════
      // STEP 6: PERSIST BILL
      // ═══════════════════════════════════════════

      // Include original service as line item for completeness
      allServices = [
        {
          name: booking.serviceName || 'Original Service',
          price: originalBase,
          gstPercentage: serviceGstPct,
          quantity: 1,
          gstAmount: originalGST,
          total: parseFloat((originalBase + originalGST).toFixed(2)),
          isOriginal: true
        },
        ...billServices
      ];

      bill = await VendorBill.create({
        bookingId: booking._id,
        vendorId,

        // Line items
        services: allServices,
        parts: billParts,

        // Base totals
        originalServiceBase: originalBase,
        vendorServiceBase,
        totalServiceBase,
        totalPartsBase,
        visitingCharges,

        // GST totals
        originalGST,
        vendorServiceGST,
        partsGST,
        totalGST,

        // Bill total
        grandTotal,

        // Payout config snapshot
        payoutConfig: {
          serviceSplitPercentage: serviceSplitPct,
          partsSplitPercentage: partsSplitPct,
          serviceGstPercentage: serviceGstPct,
          partsGstPercentage: partsGstPct
        },

        // Revenue split
        vendorServiceEarning,
        vendorPartsEarning,
        vendorTotalEarning,
        companyRevenue,

        status: 'generated',
        generatedAt: new Date()
      });
    } else {
      grandTotal = bill.grandTotal;
      allServices = bill.services || [];
      billParts = bill.parts || [];
      // Also extract totals for the response (declared in else scope via the bill object)
      bill.status = 'generated';
      bill.generatedAt = new Date();
      await bill.save();
    }

    // Extract totals for response (from either new or existing bill)
    const totalGST = bill.totalGST ?? 0;
    const totalServiceBase = bill.totalServiceBase ?? 0;
    const totalPartsBase = bill.totalPartsBase ?? 0;

    // ═══════════════════════════════════════════
    // STEP 7: UPDATE BOOKING (no earnings!)
    // ═══════════════════════════════════════════

    booking.status = BOOKING_STATUS.WORK_DONE;
    booking.finalAmount = grandTotal;
    booking.userPayableAmount = grandTotal; // Ensure consistency
    booking.vendorBillId = bill._id;

    // Reuse existing Payment OTP for cash collection or generate new one
    const payOtp = booking.paymentOtp || Math.floor(1000 + Math.random() * 9000).toString();
    booking.paymentOtp = payOtp;

    if (workPhotos) booking.workPhotos = workPhotos;

    // Store bill summary in workDoneDetails for frontend display
    booking.workDoneDetails = {
      ...(typeof workDoneDetails === 'object' ? workDoneDetails : {}),
      billId: bill._id.toString(),
      items: [
        ...allServices.map(s => ({ title: s.name, qty: s.quantity, price: s.total })),
        ...billParts.map(p => ({ title: p.name, qty: p.quantity, price: p.total }))
      ]
    };
    booking.markModified('workDoneDetails');

    await booking.save();

    // ── Notify user ──
    const { createNotification } = require('../notificationControllers/notificationController');

    // 1. Notify user that work is completed
    await createNotification({
      userId: booking.userId,
      type: 'work_completed',
      title: 'Work Completed',
      message: `Work finished! Your bill is being prepared.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'work_completed',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
      }
    });

    // 2. Notify user with Final Bill and OTP (The missing piece)
    await createNotification({
      userId: booking.userId,
      type: 'work_done',
      title: 'Billing Ready',
      message: `Bill Generated: ₹${grandTotal}. Your verification OTP is ${payOtp}. Please share this with the professional to complete.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'work_done',
        bookingId: booking._id.toString(),
        paymentOtp: payOtp,
        link: `/user/booking/${booking._id}`
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: BOOKING_STATUS.WORK_DONE,
        finalAmount: grandTotal
      });
    }

    // Response: bill totals only, NO vendor earnings exposed
    res.status(200).json({
      success: true,
      message: 'Work done, bill generated',
      data: {
        booking,
        bill: {
          id: bill._id,
          grandTotal,
          totalGST,
          totalServiceBase,
          totalPartsBase
        }
      }
    });
  } catch (error) {
    console.error('Complete self job error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete job' });
  }
};

/**
 * Collect Self Cash
 * ─────────────────
 * Called after user confirms OTP for cash payment.
 *
 * Wallet logic:
 *   dues     += grandTotal          (vendor physically holds this cash)
 *   earnings += vendorTotalEarning  (vendor's rightful share)
 *   Net owed to platform = dues − earnings
 *
 * VendorBill is the ONLY source of truth for earnings.
 */
const collectSelfCash = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { otp } = req.body;

    const booking = await Booking.findOne({ _id: id, vendorId }).select('+paymentOtp');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== BOOKING_STATUS.WORK_DONE) return res.status(400).json({ success: false, message: 'Work not done yet' });
    if (booking.paymentOtp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // ── Fetch the VendorBill (single source of truth) ──
    const VendorBill = require('../../models/VendorBill');
    const bill = await VendorBill.findOne({ bookingId: booking._id });
    if (!bill) return res.status(500).json({ success: false, message: 'Bill not found — cannot process payment' });

    const grandTotal = Number(bill.grandTotal) || 0;

    // ── Generate Invoices (Dual-Invoice Flow with Safeguards) ──
    let vendorEarning = 0;
    let platformFeeAmount = 0;
    let vendorBaseAmount = 0;
    let transactionGroupId = `TXN-GRP-${booking.bookingNumber || booking._id}`;

    try {
      if (!booking.invoiceGenerated && booking.vendorId) {
        const { generateVendorInvoice, generatePlatformInvoice } = require('../../services/invoiceService');

        const totalBase = bill ? (bill.totalServiceBase + bill.totalPartsBase) : (booking.basePrice || (booking.finalAmount / 1.18));
        platformFeeAmount = parseFloat((totalBase * 0.20).toFixed(2));
        vendorBaseAmount = parseFloat((totalBase - platformFeeAmount).toFixed(2));

        const vendorInv = await generateVendorInvoice(booking._id, booking.vendorId, booking.userId, vendorBaseAmount, transactionGroupId);
        const platformInv = await generatePlatformInvoice(booking._id, booking.vendorId, booking.userId, platformFeeAmount, transactionGroupId);

        vendorEarning = vendorInv ? vendorInv.baseAmount : vendorBaseAmount;

        // Mark booking as invoice generated
        booking.invoiceGenerated = true;
      } else {
        const totalBase = bill ? (bill.totalServiceBase + bill.totalPartsBase) : (booking.basePrice || (booking.finalAmount / 1.18));
        platformFeeAmount = parseFloat((totalBase * 0.20).toFixed(2));
        vendorBaseAmount = parseFloat((totalBase - platformFeeAmount).toFixed(2));
        vendorEarning = vendorBaseAmount;
      }
    } catch (invoiceErr) {
      console.error('[INVOICE FLOW ERROR] Invoice generation failed during cash collection but booking completed:', invoiceErr);
      const totalBase = bill ? (bill.totalServiceBase + bill.totalPartsBase) : (booking.basePrice || (booking.finalAmount / 1.18));
      platformFeeAmount = parseFloat((totalBase * 0.20).toFixed(2));
      vendorBaseAmount = parseFloat((totalBase - platformFeeAmount).toFixed(2));
      vendorEarning = vendorBaseAmount;
    }

    // ── Update Booking status ──
    booking.status = BOOKING_STATUS.COMPLETED;
    booking.paymentMethod = 'cash collected'; // Standardized label
    booking.paymentStatus = PAYMENT_STATUS.COLLECTED_BY_VENDOR;
    booking.cashCollected = true;
    booking.cashCollectedBy = 'vendor';
    booking.cashCollectorId = vendorId;
    booking.cashCollectedAt = new Date();
    booking.completedAt = new Date();
    booking.paymentOtp = undefined;
    await booking.save();

    // Trigger Commission & Collection System
    const { processBookingCompletion } = require('../../services/commissionService');
    processBookingCompletion(booking._id).catch(err => console.error('[CommissionService] Background trigger failed:', err));

    // ── Update VendorBill status ──
    bill.vendorTotalEarning = vendorEarning;
    bill.companyRevenue = platformFeeAmount;
    bill.status = 'paid';
    bill.paidAt = new Date();
    await bill.save();

    // ── Update Vendor Wallet (Atomic with $inc) ──
    const Vendor = require('../../models/Vendor');
    const vendorDoc = await Vendor.findById(vendorId).select('wallet');

    if (vendorDoc) {
      const currentDues = (vendorDoc.wallet.dues || 0) + grandTotal;
      const cashLimit = vendorDoc.wallet.cashLimit || 10000;
      // Net owed = dues − earnings (vendor keeps their share from cash)
      const netOwed = currentDues - ((vendorDoc.wallet.earnings || 0) + vendorEarning);
      const isBlocked = netOwed > cashLimit;

      const updateQuery = {
        $inc: {
          'wallet.dues': grandTotal,
          'wallet.earnings': vendorEarning,
          'wallet.totalCashCollected': grandTotal
        }
      };

      if (isBlocked) {
        updateQuery.$set = {
          'wallet.isBlocked': true,
          'wallet.blockedAt': new Date(),
          'wallet.blockReason': `Cash limit exceeded. Net owed: ₹${netOwed.toFixed(2)}, Limit: ₹${cashLimit}`
        };
      }

      await Vendor.findByIdAndUpdate(vendorId, updateQuery);

      // ── Create Transaction Records ──
      const Transaction = require('../../models/Transaction');

      // Transaction 1: Cash Collected (Platform is owed this amount)
      await Transaction.create({
        vendorId,
        bookingId: booking._id,
        type: 'cash_collected',
        amount: grandTotal,
        status: 'completed',
        paymentMethod: 'cash collected', // Standardized label
        description: `Cash ₹${grandTotal} collected for booking #${booking.bookingNumber}. Dues increased.`,
        metadata: {
          type: 'dues_increase',
          collectedBy: 'vendor',
          billId: bill._id.toString(),
          grandTotal,
          vendorEarning,
          companyRevenue: platformFeeAmount,
          transactionGroupId
        }
      });

      // Transaction 2: Earnings Credit (Vendor's rightful share - base only)
      if (vendorEarning > 0) {
        await Transaction.create({
          vendorId,
          bookingId: booking._id,
          type: 'earnings_credit',
          amount: vendorEarning,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Earnings ₹${vendorEarning} credited (base only) for booking #${booking.bookingNumber}`,
          metadata: {
            type: 'earnings_increase',
            billId: bill._id.toString(),
            serviceEarning: vendorEarning,
            partsEarning: 0,
            transactionGroupId
          }
        });
      }
    }

    // ── Notify user ──
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'payment_received',
      title: 'Payment Received (Cash)',
      message: `Payment of ₹${grandTotal} received in cash for booking ${booking.bookingNumber}. Job Completed. Thanks!`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high'
    });

    // ── Update Vendor Performance Stats & Availability ──
    try {
      const { updateVendorStats } = require('../../utils/vendorStatsHelper');
      updateVendorStats(vendorId);

      // Also free up the vendor's availability status cleanly (checks active jobs and updates availabilityStatus to ONLINE/AVAILABLE)
      await Vendor.updateWorkStatus(vendorId);
    } catch (statsErr) {
      console.error('Error updating vendor stats after cash collection:', statsErr);
    }

    res.status(200).json({ success: true, message: 'Cash collected, job completed', data: booking });
  } catch (error) {
    console.error('Collect self cash error:', error);
    res.status(500).json({ success: false, message: 'Failed to process cash payment' });
  }
};

/**
 * Pay Worker (Manual Settlement)
 */
const payWorker = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, vendorId });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.workerId) {
      return res.status(400).json({ success: false, message: 'No worker assigned to this booking' });
    }

    if (booking.isWorkerPaid) {
      return res.status(400).json({ success: false, message: 'Worker already paid' });
    }

    // Update booking payment status
    booking.isWorkerPaid = true;
    booking.workerPaymentStatus = 'SUCCESS';
    booking.workerPaidAt = new Date();

    await booking.save();

    // Notify Worker
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      workerId: booking.workerId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `Vendor has paid you for booking ${booking.bookingNumber}.`,
      relatedId: booking._id,
      relatedType: 'booking'
    });

    // Send High Priority Push Notification to Worker
    const worker = await Worker.findById(booking.workerId);
    if (worker) {
      const fcmTokens = [
        ...(worker.fcmTokens || []),
        ...(worker.fcmTokenMobile || [])
      ];

      if (fcmTokens.length > 0) {
        const { sendPushNotification } = require('../../services/firebaseAdmin');
        await sendPushNotification(fcmTokens, {
          title: 'Payment Received! 💰',
          body: `Vendor has released your payment for booking #${booking.bookingNumber}. check wallet for details.`,
          data: {
            type: 'payment_received',
            bookingId: booking._id.toString(),
            url: '/worker/wallet'
          },
          highPriority: true
        });
      }
    }

    // Notify Vendor
    await createNotification({
      vendorId: vendorId,
      type: 'payment_success',
      title: 'Worker Paid',
      message: `You have successfully marked worker payment for booking ${booking.bookingNumber}.`,
      relatedId: booking._id,
      relatedType: 'booking'
    });

    res.status(200).json({
      success: true,
      message: 'Worker payment marked successfully',
      data: booking
    });

  } catch (error) {
    console.error('Pay worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to process worker payment' });
  }
};

/**
 * Get vendor ratings and reviews
 */
const getVendorRatings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch bookings where rating is not null
    const bookings = await Booking.find({ vendorId, rating: { $ne: null } })
      .populate('userId', 'name profilePhoto')
      .populate('serviceId', 'title iconUrl')
      .populate('workerId', 'name profilePhoto')
      .sort({ reviewedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({ vendorId, rating: { $ne: null } });

    // Calculate average rating
    const stats = await Booking.aggregate([
      { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), rating: { $ne: null } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      stats: stats[0] || { averageRating: 0, totalReviews: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
};

/**
 * Get pending booking requests for vendor (for reconnection)
 * Called when vendor app reconnects to fetch any missed alerts
 */
const getPendingBookings = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const BookingRequest = require('../../models/BookingRequest');

    // Get all pending booking requests for this vendor
    const pendingRequests = await BookingRequest.find({
      vendorId,
      status: { $in: ['PENDING', 'VIEWED'] }
    })
      .populate({
        path: 'bookingId',
        match: { status: BOOKING_STATUS.SEARCHING, vendorId: null },
        populate: [
          { path: 'userId', select: 'name' },
          {
            path: 'serviceId',
            select: 'title iconUrl categoryId',
            populate: { path: 'categoryId', select: 'title' }
          }
        ]
      })
      .sort({ sentAt: -1 })
      .limit(20);

    // Filter out null bookings (already accepted by others)
    const validRequests = pendingRequests.filter(r => r.bookingId !== null);

    // Format response
    const bookings = validRequests.map(req => ({
      requestId: req._id,
      bookingId: req.bookingId._id,
      bookingNumber: req.bookingId.bookingNumber,
      serviceName: req.bookingId.serviceId?.title || req.bookingId.serviceName,
      customerName: req.bookingId.userId?.name,
      scheduledDate: req.bookingId.scheduledDate,
      scheduledTime: req.bookingId.scheduledTime,
      address: req.bookingId.address,
      price: req.bookingId.finalAmount,
      distance: req.distance,
      wave: req.wave,
      sentAt: req.sentAt,
      status: req.status,
      serviceCategory: req.bookingId.serviceCategory,
      brandName: req.bookingId.brandName,
      brandIcon: req.bookingId.brandIcon,
      categoryIcon: req.bookingId.categoryIcon,
      createdAt: req.bookingId.createdAt,
      expiresAt: req.bookingId.expiresAt
    }));

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending bookings'
    });
  }
};

const reconfirmBooking = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { action } = req.body; // 'CONFIRM' or 'DECLINE'

    if (!['CONFIRM', 'DECLINE'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be CONFIRM or DECLINE.' });
    }

    const booking = await Booking.findById(id).populate('vendorId', 'name businessName');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.vendorId || booking.vendorId._id.toString() !== vendorId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to reconfirm this booking' });
    }

    const Vendor = require('../../models/Vendor');

    if (action === 'CONFIRM') {
      booking.reconfirmationStatus = 'CONFIRMED';
      booking.reconfirmedAt = new Date();
      booking.bookingRiskStatus = 'NORMAL';
      await booking.save();

      // Update vendor reserved status
      await Vendor.findByIdAndUpdate(vendorId, {
        availabilityStatus: 'RESERVED',
        availability: 'ON_JOB',
        workStatus: 'busy'
      });

      res.status(200).json({
        success: true,
        message: 'Booking reconfirmed successfully',
        data: booking
      });
    } else {
      // DECLINE Action
      booking.reconfirmationStatus = 'DECLINED';
      booking.bookingRiskStatus = 'HIGH';
      await booking.save();

      // Clear vendor reservation fields since they declined
      await Vendor.findByIdAndUpdate(vendorId, {
        availabilityStatus: 'ONLINE',
        availability: 'AVAILABLE',
        workStatus: 'available',
        reservedFrom: null,
        reservedBookingId: null
      });

      // Escalation Alert
      const vendorName = booking.vendorId?.businessName || booking.vendorId?.name || 'Vendor';
      const city = booking.address?.city || '';
      const message = `Vendor ${vendorName} DECLINED scheduled booking #${booking.bookingNumber}. Slot: ${booking.scheduledTime || `${booking.timeSlot?.start} - ${booking.timeSlot?.end}`}. Manual intervention required.`;

      // Find City Admins
      const Admin = require('../../models/Admin');
      const City = require('../../models/City');

      const cityDoc = await City.findOne({ name: new RegExp(`^${city}$`, 'i') });
      let adminQuery = { role: 'admin' };
      if (cityDoc) {
        adminQuery = {
          $or: [
            { role: 'admin' },
            { role: 'CITY_ADMIN', assignedCities: cityDoc._id }
          ]
        };
      }

      const admins = await Admin.find(adminQuery);
      const { createNotification } = require('../notificationControllers/notificationController');

      const io = req.app.get('io');
      for (const admin of admins) {
        await createNotification({
          adminId: admin._id,
          type: 'booking_escalation',
          title: 'Booking Declined (High Risk)',
          message,
          relatedId: booking._id,
          relatedType: 'booking',
          pushData: {
            type: 'booking_escalation',
            bookingId: booking._id.toString(),
            link: `/admin/bookings/${booking._id}`
          }
        });

        if (io) {
          io.to(`admin_${admin._id.toString()}`).emit('booking_escalation', {
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            message,
            severity: 'HIGH'
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Booking declined. Escalation sent to support.',
        data: booking
      });
    }
  } catch (error) {
    console.error('Reconfirm booking error:', error);
    res.status(500).json({ success: false, message: 'Server error during reconfirmation' });
  }
};

const requestCancelBooking = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const booking = await Booking.findOne({ _id: id, vendorId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot request cancellation for a booking that is already ${booking.status}` 
      });
    }

    booking.cancelRequestStatus = 'pending';
    booking.cancelRequestedBy = 'vendor';
    booking.cancelRequestReason = reason;
    booking.cancelRequestAt = new Date();
    await booking.save();

    console.log(`[CancelRequest] Vendor ${vendorId} requested cancellation for booking ${booking.bookingNumber}`);

    // Send notifications to admins
    try {
      const Admin = require('../../models/Admin');
      const City = require('../../models/City');
      const { createNotification } = require('../notificationControllers/notificationController');

      const city = booking.address?.city || '';
      const cityDoc = await City.findOne({ name: new RegExp(`^${city}$`, 'i') });
      let adminQuery = { role: { $in: ['admin', 'super_admin', 'super-admin'] } };
      if (cityDoc) {
        adminQuery = {
          $or: [
            { role: { $in: ['admin', 'super_admin', 'super-admin'] } },
            { role: 'CITY_ADMIN', assignedCities: cityDoc._id }
          ]
        };
      }

      const admins = await Admin.find(adminQuery);
      const io = req.app.get('io');
      const msg = `Vendor has requested cancellation for Booking #${booking.bookingNumber}. Reason: ${reason}`;

      for (const admin of admins) {
        await createNotification({
          adminId: admin._id,
          type: 'booking_escalation',
          title: 'Cancellation Request (Vendor)',
          message: msg,
          relatedId: booking._id,
          relatedType: 'booking',
          pushData: {
            type: 'booking_escalation',
            bookingId: booking._id.toString(),
            link: `/admin/bookings/${booking._id}`
          }
        });

        if (io) {
          io.to(`admin_${admin._id.toString()}`).emit('booking_escalation', {
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            message: msg,
            severity: 'MEDIUM'
          });
        }
      }
    } catch (notifErr) {
      console.error('Error notifying admins about vendor cancellation request:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Cancellation request submitted to admin successfully',
      data: booking
    });
  } catch (error) {
    console.error('Vendor request cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit cancellation request' });
  }
};

module.exports = {
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
  payWorker,
  getVendorRatings,
  getPendingBookings,
  reconfirmBooking,
  cancelAcceptedBooking,
  requestCancelBooking
};
