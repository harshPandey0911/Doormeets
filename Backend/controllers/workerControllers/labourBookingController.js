const Worker = require('../../models/Worker');
const LabourBooking = require('../../models/LabourBooking');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');

/**
 * GET /api/labour/online
 * Returns all online (ONLINE status) labours
 */
const getOnlineLabours = async (req, res) => {
  try {
    const labours = await Worker.find({ status: 'ONLINE', isActive: true })
      .select('name phone profilePhoto serviceCategories rating totalJobs status')
      .sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: labours.length,
      labours: labours.map(l => ({
        id: l._id,
        name: l.name,
        phone: l.phone,
        profilePhoto: l.profilePhoto,
        serviceCategories: l.serviceCategories,
        rating: l.rating,
        totalJobs: l.totalJobs,
        status: l.status
      }))
    });
  } catch (error) {
    console.error('[Labour] Error fetching online labours:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch labours' });
  }
};

/**
 * POST /api/labour/book
 * User/Vendor books a labour → emits socket event to labour
 */
const bookLabour = async (req, res) => {
  try {
    const { labourId, note } = req.body;
    const bookerId = req.user.id;
    const bookerRole = (req.userRole || req.user.role || '').toUpperCase(); // 'USER' or 'VENDOR'

    if (!labourId) {
      return res.status(400).json({ success: false, message: 'Labour ID is required' });
    }

    // Check if labour is online and available
    const labour = await Worker.findById(labourId);
    if (!labour) {
      return res.status(404).json({ success: false, message: 'Labour not found' });
    }
    if (labour.status !== 'ONLINE') {
      return res.status(400).json({ success: false, message: 'Labour is not available right now' });
    }

    // Check if labour already has a pending booking
    const existingPending = await LabourBooking.findOne({ labourId, status: 'pending' });
    if (existingPending) {
      return res.status(400).json({ success: false, message: 'Labour is already handling another booking request' });
    }

    // Get booker info
    let bookerName = '';
    let bookerPhone = '';
    const mongoRole = bookerRole === 'USER' ? 'User' : 'Vendor';
    
    if (bookerRole === 'USER') {
      const user = await User.findById(bookerId).select('name phone');
      bookerName = user?.name || 'User';
      bookerPhone = user?.phone || '';
    } else if (bookerRole === 'VENDOR') {
      const vendor = await Vendor.findById(bookerId).select('name phone businessName');
      bookerName = vendor?.businessName || vendor?.name || 'Vendor';
      bookerPhone = vendor?.phone || '';
    }

    // Create booking
    const booking = await LabourBooking.create({
      labourId,
      bookedById: bookerId,
      bookedByRole: mongoRole,
      bookedByName: bookerName,
      bookedByPhone: bookerPhone,
      note: note || '',
      status: 'pending'
    });

    // Emit socket event to labour
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`worker_${labourId.toString()}`).emit('labour_booking_request', {
          bookingId: booking._id,
          bookerName,
          bookerPhone,
          bookerRole: mongoRole,
          note: note || '',
          createdAt: booking.createdAt
        });
        console.log(`[Labour] Socket event sent to worker_${labourId}`);
      }
    } catch (socketError) {
      console.error('[Labour] Socket emit error:', socketError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking request sent to labour',
      bookingId: booking._id
    });
  } catch (error) {
    console.error('[Labour] Error booking labour:', error);
    res.status(500).json({ success: false, message: 'Failed to book labour' });
  }
};

/**
 * POST /api/labour/accept/:bookingId
 * Labour accepts a booking request
 */
const acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const labourId = req.user.id;

    const booking = await LabourBooking.findOne({ _id: bookingId, labourId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking already processed' });
    }

    booking.status = 'accepted';
    booking.acceptedAt = new Date();
    await booking.save();

    // Removed updating to BUSY so they stay ONLINE

    // Notify the booker via socket
    try {
      const io = req.app.get('io');
      if (io) {
        const labour = await Worker.findById(labourId).select('name phone profilePhoto');
        const roomKey = booking.bookedByRole === 'User' 
          ? `user_${booking.bookedById}` 
          : `vendor_${booking.bookedById}`;
        
        io.to(roomKey).emit('labour_booking_accepted', {
          bookingId: booking._id,
          labourId,
          labourName: labour?.name,
          labourPhone: labour?.phone,
          labourPhoto: labour?.profilePhoto
        });
      }
    } catch (socketError) {
      console.error('[Labour] Socket emit error on accept:', socketError);
    }

    res.status(200).json({ success: true, message: 'Booking accepted successfully' });
  } catch (error) {
    console.error('[Labour] Error accepting booking:', error);
    res.status(500).json({ success: false, message: 'Failed to accept booking' });
  }
};

/**
 * POST /api/labour/reject/:bookingId
 * Labour rejects a booking request
 */
const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const labourId = req.user.id;

    const booking = await LabourBooking.findOne({ _id: bookingId, labourId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'rejected';
    booking.rejectedAt = new Date();
    await booking.save();

    // Notify booker
    try {
      const io = req.app.get('io');
      if (io) {
        const roomKey = booking.bookedByRole === 'User'
          ? `user_${booking.bookedById}`
          : `vendor_${booking.bookedById}`;
        io.to(roomKey).emit('labour_booking_rejected', { bookingId: booking._id });
      }
    } catch (socketError) {
      console.error('[Labour] Socket emit error on reject:', socketError);
    }

    res.status(200).json({ success: true, message: 'Booking rejected' });
  } catch (error) {
    console.error('[Labour] Error rejecting booking:', error);
    res.status(500).json({ success: false, message: 'Failed to reject booking' });
  }
};

/**
 * POST /api/labour/complete/:bookingId
 * Mark booking as completed, set labour back to ONLINE
 */
const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const labourId = req.user.id;

    const booking = await LabourBooking.findOne({ _id: bookingId, labourId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Set labour back to ONLINE and increment job count
    await Worker.findByIdAndUpdate(labourId, {
      status: 'ONLINE',
      $inc: { totalJobs: 1, completedJobs: 1 }
    });

    res.status(200).json({ success: true, message: 'Booking completed' });
  } catch (error) {
    console.error('[Labour] Error completing booking:', error);
    res.status(500).json({ success: false, message: 'Failed to complete booking' });
  }
};

/**
 * GET /api/labour/my-bookings
 * Get booking history for labour
 */
const getMyBookings = async (req, res) => {
  try {
    const labourId = req.user.id;
    const bookings = await LabourBooking.find({ labourId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

/**
 * GET /api/labour/user-bookings
 * Get labour bookings made by the current User or Vendor
 */
const getUserLabourBookings = async (req, res) => {
  try {
    const bookerId = req.user.id;
    const bookings = await LabourBooking.find({ bookedById: bookerId })
      .populate('labourId', 'name phone profilePhoto serviceCategories')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user labour bookings' });
  }
};

/**
 * GET /api/labour/active
 * Get current active booking for labour
 */
const getMyActiveBooking = async (req, res) => {
  try {
    const labourId = req.user.id;
    const booking = await LabourBooking.findOne({
      labourId,
      status: { $in: ['pending', 'accepted'] }
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active booking' });
  }
};

module.exports = {
  getOnlineLabours,
  bookLabour,
  acceptBooking,
  rejectBooking,
  completeBooking,
  getMyBookings,
  getMyActiveBooking,
  getUserLabourBookings
};
