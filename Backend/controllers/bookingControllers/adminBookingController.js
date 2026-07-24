const Booking = require('../../models/Booking');
const { validationResult } = require('express-validator');
const { BOOKING_STATUS } = require('../../utils/constants');

/**
 * Get all bookings with filters and search
 */
const getAllBookings = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      userId,
      vendorId,
      workerId,
      startDate,
      endDate,
      search,
      manual,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};

    if (manual === 'true') {
      // Active queue only: pending_admin or sent-to-vendor (requested + assignedByAdmin)
      query.$or = [
        { status: 'pending_admin' },
        { status: 'requested', assignedByAdmin: true }
      ];
    } else if (manual === 'all') {
      // All bookings that ever went through admin assignment flow
      query.$or = [
        { status: 'pending_admin' },
        { status: 'no_vendors' },       // pending_admin cancelled by admin
        { assignedByAdmin: true }       // manually assigned by admin (any status)
      ];

    } else if (status) {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (userId) query.userId = userId;
    if (vendorId) query.vendorId = vendorId;
    if (workerId) query.workerId = workerId;

    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    // Search by booking number or service name
    if (search) {
      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Exclude heavy Base64 image fields that bloat document size (workPhotos/reachedPhotos
    // can be 1MB+ each). The admin list view doesn't need photo data.
    const heavyFieldsExclusion = '-workPhotos -reachedPhotos -serviceImages -reviewImages -potentialVendors -workDoneDetails';

    // Run bookings fetch and count in parallel for faster response
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .select(heavyFieldsExclusion)
        .populate('userId', 'name phone email')
        .populate('vendorId', 'name businessName phone')
        .populate('serviceId', 'title iconUrl')
        .populate('categoryId', 'title slug')
        .populate('workerId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(query)
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
    console.error('Get all bookings error:', error);
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
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('userId', 'name phone email addresses')
      .populate('vendorId', 'name businessName phone email address')
      .populate('serviceId', 'title description iconUrl images')
      .populate('categoryId', 'title slug')
      .populate('workerId', 'name phone rating totalJobs completedJobs');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking. Please try again.'
    });
  }
};

/**
 * Cancel booking (admin)
 */
const cancelBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Update booking
    const isPendingAdmin = booking.status === 'pending_admin';
    if (isPendingAdmin) {
      booking.status = BOOKING_STATUS.NO_VENDORS;
      booking.cancelledAt = new Date();
      booking.cancelledBy = 'admin';
      booking.cancellationReason = cancellationReason || 'Currently no vendor online (Declined by admin)';
    } else {
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancelledAt = new Date();
      booking.cancelledBy = 'admin';
      booking.cancellationReason = cancellationReason || 'Cancelled by admin';
    }

    // Refund Loyalty Points if any were redeemed
    if (booking.loyaltyPointsRedeemed > 0 && !booking.loyaltyPointsRefunded) {
      try {
        const User = require('../../models/User');
        const Transaction = require('../../models/Transaction');
        await User.findByIdAndUpdate(booking.userId, { $inc: { loyaltyPoints: booking.loyaltyPointsRedeemed } });
        
        await Transaction.create({
          userId: booking.userId,
          type: 'refund',
          amount: booking.loyaltyPointsRedeemed,
          status: 'completed',
          paymentMethod: 'system',
          description: `Refunded ${booking.loyaltyPointsRedeemed} Loyalty Points for booking #${booking.bookingNumber} (admin cancellation)`,
          bookingId: booking._id,
          metadata: { type: 'loyalty_points', pointsRefunded: booking.loyaltyPointsRedeemed }
        });
        booking.loyaltyPointsRefunded = true;
      } catch (refErr) {
        console.error('[AdminCancel] Error refunding loyalty points:', refErr);
      }
    }

    // Refund Wallet Amount if any was applied
    if (booking.walletAmountApplied > 0 && booking.walletAmountRefunded !== true) {
      try {
        const User = require('../../models/User');
        const Transaction = require('../../models/Transaction');
        await User.findByIdAndUpdate(booking.userId, { $inc: { 'wallet.balance': booking.walletAmountApplied } });

        await Transaction.create({
          userId: booking.userId,
          type: 'credit',
          amount: booking.walletAmountApplied,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Refund of ₹${booking.walletAmountApplied} wallet balance for booking #${booking.bookingNumber} (admin cancellation)`,
          bookingId: booking._id,
          balanceAfter: (await User.findById(booking.userId)).wallet?.balance || 0
        });
        booking.walletAmountRefunded = true;
      } catch (walletErr) {
        console.error('[AdminCancel] Error refunding wallet amount:', walletErr);
      }
    }
    // Refund upfront payment to user's wallet if payment was successful
    const isPaidRefund = ['success', 'paid', 'partially_paid'].includes(booking.paymentStatus?.toLowerCase());
    if (isPaidRefund) {
      try {
        const User = require('../../models/User');
        const Transaction = require('../../models/Transaction');
        
        const refundAmt = booking.paymentStatus?.toLowerCase() === 'partially_paid' ? (booking.codAdvanceAmount || 0) : booking.finalAmount;
        if (refundAmt > 0) {
          await User.findByIdAndUpdate(booking.userId, { $inc: { 'wallet.balance': refundAmt } });
          
          await Transaction.create({
            userId: booking.userId,
            type: 'refund',
            amount: refundAmt,
            status: 'completed',
            paymentMethod: 'wallet',
            description: `Refund of ₹${refundAmt} online payment for booking #${booking.bookingNumber} (${booking.serviceName || 'Service'}) (admin cancellation)`,
            bookingId: booking._id,
            balanceAfter: (await User.findById(booking.userId)).wallet?.balance || 0
          });
          
          booking.paymentStatus = 'refunded';
          console.log(`[AdminCancel] Refunded upfront payment of ₹${refundAmt} to user ${booking.userId} wallet.`);
        }
      } catch (refundErr) {
        console.error('[AdminCancel] Error refunding upfront payment to wallet:', refundErr);
      }
    }

    await booking.save();

    // Notify user of the status change via socket
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${booking.userId.toString()}`).emit('booking_updated', {
          bookingId: booking._id.toString(),
          status: booking.status,
          message: isPendingAdmin ? 'Currently no vendor online.' : 'Booking cancelled by admin.'
        });
      }
    } catch (socketErr) {
      console.error('[AdminCancel] Socket notification error:', socketErr);
    }

    // ── Update Vendor Performance Stats & Availability ──
    if (booking.vendorId) {
      try {
        const { updateVendorStats } = require('../../utils/vendorStatsHelper');
        updateVendorStats(booking.vendorId);

        // Also free up the vendor's availability so they appear online to new users
        const Vendor = require('../../models/Vendor');
        await Vendor.findByIdAndUpdate(booking.vendorId, {
          availability: 'AVAILABLE',
          workStatus: 'available',
          availabilityStatus: 'ONLINE',
          reservedFrom: null,
          reservedBookingId: null
        });
        await Vendor.updateWorkStatus(booking.vendorId);
      } catch (statsErr) {
        console.error('Error updating vendor stats after admin cancellation:', statsErr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel booking. Please try again.'
    });
  }
};

/**
 * Get booking analytics
 */
const getBookingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total bookings
    const totalBookings = await Booking.countDocuments(dateFilter);

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Bookings by payment status
    const bookingsByPaymentStatus = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Revenue analytics
    const revenueStats = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          paymentStatus: 'success'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$finalAmount' }
        }
      }
    ]);

    // Daily bookings trend (last 30 days)
    const dailyTrend = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        bookingsByPaymentStatus: bookingsByPaymentStatus.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount
          };
          return acc;
        }, {}),
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          totalBookings: 0,
          averageBookingValue: 0
        },
        dailyTrend
      }
    });
  } catch (error) {
    console.error('Get booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics. Please try again.'
    });
  }
};

/**
 * Assign vendor to booking (admin)
 */
const assignVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const Vendor = require('../../models/Vendor');
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update booking details
    booking.vendorId = vendor._id;
    booking.status = 'requested'; // Set to requested, so vendor gets accept/decline popup
    booking.assignedByAdmin = true;
    booking.notifiedVendors = [vendor._id];
    booking.assignedAt = new Date();
    booking.adminAssignExpiresAt = new Date(Date.now() + 60 * 1000); // 1 minute expiry

    await booking.save();

    // Create BookingRequest for vendor
    const BookingRequest = require('../../models/BookingRequest');
    await BookingRequest.deleteMany({ bookingId: booking._id }); // Clear old requests
    await BookingRequest.create({
      bookingId: booking._id,
      vendorId: vendor._id,
      status: 'PENDING',
      wave: 1,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 1000) // 1 minute
    });

    // Trigger socket notifications for vendor and user
    try {
      const io = req.app.get('io');
      if (io) {
        const User = require('../../models/User');
        const user = await User.findById(booking.userId).select('name phone').lean();

        // Emit new booking request popup to vendor
        io.to(`vendor_${vendor._id.toString()}`).emit('new_booking_request', {
          bookingId: booking._id,
          serviceName: booking.serviceName,
          customerName: user?.name || 'Customer',
          customerPhone: user?.phone || 'Phone hidden',
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          price: booking.finalAmount,
          address: booking.address,
          distance: 0,
          serviceCategory: booking.serviceCategory,
          brandName: booking.brandName,
          brandIcon: booking.brandIcon,
          categoryIcon: booking.categoryIcon,
          createdAt: new Date(), // Use current time for admin-assigned
          expiresAt: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minute
          status: booking.status,
          serviceType: booking.serviceType || 'service',
          assignedByAdmin: true,
          playSound: true,
          message: `Admin has manually assigned a booking request to you!`
        });

        // Emit status update to user
        io.to(`user_${booking.userId.toString()}`).emit('booking_updated', {
          bookingId: booking._id.toString(),
          status: 'requested'
        });
      }
    } catch (socketErr) {
      console.error('[AdminAssignVendor] Socket notification error:', socketErr);
    }

    // Trigger FCM push notification to vendor
    try {
      const { sendNotificationToVendor } = require('../../services/firebaseAdmin');
      if (vendor.fcmToken) {
        await sendNotificationToVendor(vendor._id.toString(), {
          title: '🎉 New Job Assigned by Admin!',
          body: `Admin has assigned you booking #${booking.bookingNumber}. Please respond within 1 minute.`,
          bookingId: booking._id.toString()
        });
      }
    } catch (fcmErr) {
      console.error('[AdminAssignVendor] FCM notification error:', fcmErr);
    }

    // Schedule auto-revert after 1 minute if vendor doesn't accept
    setTimeout(async () => {
      try {
        const freshBooking = await Booking.findById(booking._id);
        if (freshBooking && freshBooking.status === 'requested' && freshBooking.assignedByAdmin) {
          console.log(`[AdminAssign] Timer expired for booking ${freshBooking.bookingNumber}. Reverting to pending_admin.`);
          freshBooking.vendorId = null;
          freshBooking.status = 'pending_admin';
          freshBooking.assignedByAdmin = false;
          freshBooking.cancellationReason = `Vendor ${vendor.businessName || vendor.name} did not respond to admin assignment within 1 minute.`;
          await freshBooking.save();

          // Expire the BookingRequest
          await BookingRequest.updateMany(
            { bookingId: booking._id, vendorId: vendor._id, status: 'PENDING' },
            { status: 'EXPIRED', respondedAt: new Date() }
          );

          const io = req.app.get('io');
          if (io) {
            // Notify admin
            io.to('all_admins').emit('admin_booking_requested', {
              bookingId: booking._id.toString(),
              bookingNumber: freshBooking.bookingNumber,
              status: 'pending_admin',
              message: `Vendor ${vendor.businessName || vendor.name} did not respond. Please reassign.`
            });
            // Remove popup from vendor
            io.to(`vendor_${vendor._id.toString()}`).emit('booking_taken', {
              bookingId: booking._id.toString(),
              message: 'Admin assignment expired. You did not respond in time.'
            });
          }
        }
      } catch (err) {
        console.error('[AdminAssign] Timer revert error:', err);
      }
    }, 60 * 1000); // 1 minute

    res.status(200).json({
      success: true,
      message: 'Vendor assigned successfully. They have 1 minute to respond.',
      data: booking
    });
  } catch (error) {
    console.error('Assign vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign vendor. Please try again.'
    });
  }
};

const approveCancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.cancelRequestStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending cancellation request for this booking' });
    }

    const isPaid = ['success', 'completed', 'paid', 'partially_paid'].includes(booking.paymentStatus?.toLowerCase());
    if (isPaid) {
      try {
        const User = require('../../models/User');
        const Transaction = require('../../models/Transaction');
        
        const refundAmount = booking.paymentStatus?.toLowerCase() === 'partially_paid' ? (booking.codAdvanceAmount || 0) : booking.finalAmount;

        if (refundAmount > 0) {
          const userDoc = await User.findById(booking.userId);
          if (userDoc) {
            const balanceBefore = userDoc.wallet.balance || 0;
            userDoc.wallet.balance = balanceBefore + refundAmount;
            await userDoc.save();

            // Create refund transaction
            await Transaction.create({
              userId: booking.userId,
              type: 'refund',
              amount: refundAmount,
              status: 'completed',
              paymentMethod: 'system',
              description: `Refund of ₹${refundAmount} for cancelled booking #${booking.bookingNumber} (${booking.serviceName || 'Service'})`,
              bookingId: booking._id,
              referenceType: 'cancellation_refund',
              balanceBefore: balanceBefore,
              balanceAfter: userDoc.wallet.balance
            });
            
            booking.paymentStatus = 'refunded';
            booking.penalty = 0;
            console.log(`[AdminApproveCancel] Refunded ₹${refundAmount} to user ${booking.userId} wallet. Balance: ${balanceBefore} → ${userDoc.wallet.balance}`);
          }
        }
      } catch (refundErr) {
        console.error('[AdminApproveCancel] Error refunding upfront payment to wallet:', refundErr);
      }
    }

    // Process actual cancellation
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = `Approved Request: ${booking.cancelRequestReason}`;
    booking.cancelledBy = `admin (via ${booking.cancelRequestedBy} request)`;
    booking.cancelRequestStatus = 'approved';
    await booking.save();

    console.log(`[AdminCancel] Cancellation approved for booking ${booking.bookingNumber}`);

    // If vendor was assigned, notify vendor that it's cancelled and free up their availability!
    if (booking.vendorId) {
      const Vendor = require('../../models/Vendor');
      await Vendor.findByIdAndUpdate(booking.vendorId, {
        $set: {
          availabilityStatus: 'ONLINE',
          availability: 'AVAILABLE',
          reservedFrom: null,
          reservedBookingId: null
        }
      });
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(`vendor_${booking.vendorId.toString()}`).emit('booking_cancelled', {
            bookingId: booking._id.toString(),
            bookingNumber: booking.bookingNumber,
            message: 'Booking cancellation request has been approved by admin.'
          });
        }
      } catch (err) {}
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${booking.userId.toString()}`).emit('booking_cancelled', {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber
        });
      }
    } catch (err) {}

    res.status(200).json({
      success: true,
      message: 'Cancellation request approved and booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Approve cancel error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve cancellation request' });
  }
};

const rejectCancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.cancelRequestStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending cancellation request for this booking' });
    }

    booking.cancelRequestStatus = 'rejected';
    await booking.save();

    console.log(`[AdminCancel] Cancellation request rejected for booking ${booking.bookingNumber}`);

    try {
      const io = req.app.get('io');
      if (io) {
        if (booking.cancelRequestedBy === 'vendor' && booking.vendorId) {
          io.to(`vendor_${booking.vendorId.toString()}`).emit('booking_updated', {
            bookingId: booking._id.toString(),
            message: 'Your cancellation request was rejected by admin.'
          });
        } else {
          io.to(`user_${booking.userId.toString()}`).emit('booking_updated', {
            bookingId: booking._id.toString(),
            message: 'Your cancellation request was rejected by admin.'
          });
        }
      }
    } catch (err) {}

    res.status(200).json({
      success: true,
      message: 'Cancellation request rejected successfully',
      data: booking
    });
  } catch (error) {
    console.error('Reject cancel error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject cancellation request' });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  cancelBooking,
  getBookingAnalytics,
  assignVendor,
  approveCancelBooking,
  rejectCancelBooking
};

