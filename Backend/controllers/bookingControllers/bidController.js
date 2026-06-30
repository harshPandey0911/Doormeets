const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const Bid = require('../../models/Bid');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { getIO } = require('../../sockets');

/**
 * Submit a bid for a booking (Vendor)
 */
const submitBid = async (req, res) => {
  try {
    const { bookingId, price, note } = req.body;
    const vendorId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== BOOKING_STATUS.BIDDING) {
      return res.status(400).json({ success: false, message: 'Booking is not open for bidding' });
    }

    // Check if already bid
    const existingBid = await Bid.findOne({ bookingId, vendorId });
    if (existingBid) {
      return res.status(400).json({ success: false, message: 'You have already submitted a bid' });
    }

    const bid = await Bid.create({
      bookingId,
      vendorId,
      price,
      note
    });

    // Notify User via Socket
    const io = getIO();
    if (io) {
      io.to(`user_${booking.userId.toString()}`).emit('new_bid_received', {
        bookingId,
        bidId: bid._id,
        price,
        vendor: {
          id: vendorId,
          name: req.user.name,
          businessName: req.user.businessName,
          rating: req.user.rating || 4.8
        }
      });
    }

    res.status(201).json({ success: true, message: 'Bid submitted successfully', bid });
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit bid' });
  }
};

/**
 * Get all bids for a booking (User)
 */
const getBidsForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userId.toString() !== userId) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const bids = await Bid.find({ bookingId })
      .populate('vendorId', 'name businessName profilePicture rating')
      .sort({ price: 1 })
      .lean();

    const Settings = require('../../models/Settings');
    const globalSettings = await Settings.findOne({ type: 'global' }).lean();
    const showVendorNameToUser = globalSettings ? globalSettings.showVendorNameToUser !== false : true;

    if (!showVendorNameToUser) {
      bids.forEach(b => {
        if (b.vendorId) {
          b.vendorId.name = "Service Provider";
          b.vendorId.businessName = "Service Provider";
        }
      });
    }

    res.status(200).json({ success: true, bids });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bids' });
  }
};

/**
 * Accept a bid (User)
 */
const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user.id;

    const bid = await Bid.findById(bidId).populate('vendorId');
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const booking = await Booking.findById(bid.bookingId);
    if (!booking || booking.userId.toString() !== userId) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== BOOKING_STATUS.BIDDING) {
      return res.status(400).json({ success: false, message: 'Booking is no longer in bidding phase' });
    }

    // Update Booking
    booking.vendorId = bid.vendorId._id;
    booking.finalAmount = bid.price;
    booking.basePrice = Math.round(bid.price / 1.18);
    booking.tax = bid.price - booking.basePrice;
    booking.status = BOOKING_STATUS.ACCEPTED;
    booking.acceptedAt = new Date();
    await booking.save();

    // Update Bid status
    bid.status = 'accepted';
    await bid.save();

    // Reject other bids
    await Bid.updateMany(
      { bookingId: booking._id, _id: { $ne: bidId } },
      { $set: { status: 'rejected' } }
    );

    // Notify Vendor
    const io = getIO();
    if (io) {
      io.to(`vendor_${bid.vendorId._id.toString()}`).emit('bid_accepted', {
        bookingId: booking._id,
        bidId: bid._id
      });
    }

    res.status(200).json({ success: true, message: 'Bid accepted. Booking confirmed.', booking });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept bid' });
  }
};

/**
 * Reject a bid (User)
 */
const rejectBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user.id;

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const booking = await Booking.findById(bid.bookingId);
    if (!booking || booking.userId.toString() !== userId) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    bid.status = 'rejected';
    await bid.save();

    // Optional: Notify vendor about rejection
    const io = getIO();
    if (io) {
      io.to(`vendor_${bid.vendorId.toString()}`).emit('bid_rejected', {
        bookingId: booking._id,
        bidId: bid._id
      });
    }

    res.status(200).json({ success: true, message: 'Bid rejected' });
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject bid' });
  }
};

module.exports = {
  submitBid,
  getBidsForBooking,
  acceptBid,
  rejectBid
};
