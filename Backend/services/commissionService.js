const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const Transaction = require('../models/Transaction');

/**
 * Centrally processes booking completion, computes commission & records transaction ledger entries.
 * @param {string} bookingId - Mongoose Booking ID.
 */
async function processBookingCompletion(bookingId) {
  try {
    console.log(`[CommissionService] Processing booking completion for: ${bookingId}`);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error(`[CommissionService] Booking not found: ${bookingId}`);
      return { success: false, message: 'Booking not found' };
    }

    // 1. Load System Commission Rate from settings
    const settings = await Settings.findOne({ type: 'global' });
    const commissionPct = settings && settings.commissionPercentage !== undefined ? settings.commissionPercentage : 20;

    // 2. Determine base amount to calculate commission on (finalAmount / Grand Total)
    const amount = Number(booking.finalAmount || booking.basePrice || 0);

    // 3. Compute Splits
    const adminCommission = parseFloat(((amount * commissionPct) / 100).toFixed(2));
    const vendorShare = parseFloat((amount - adminCommission).toFixed(2));

    booking.totalAmount = amount;
    booking.adminCommission = adminCommission;
    booking.vendorShare = vendorShare;

    // 4. Map paymentMethod and set status values
    const originalMethod = (booking.paymentMethod || '').toLowerCase();
    const isCash = ['cash', 'pay_at_home', 'cash collected', 'hand_to_hand'].includes(originalMethod);

    if (isCash) {
      booking.paymentMethod = 'cash';
      booking.paymentStatus = 'completed';
      booking.commissionStatus = 'pending';
    } else {
      booking.paymentMethod = 'online';
      booking.paymentStatus = 'completed';
      booking.commissionStatus = 'received';
    }

    await booking.save();

    // 5. Create Ledger Transaction entry
    const vendorId = booking.vendorId || null;
    const type = isCash ? 'cash_collection' : 'online_collection';

    await Transaction.create({
      userId: booking.userId || null,
      vendorId: vendorId,
      bookingId: booking._id,
      amount: amount,
      type: type,
      status: 'completed',
      paymentMethod: isCash ? 'cash' : 'online',
      description: `${isCash ? 'Cash' : 'Online'} payment collection of ₹${amount} recorded for booking #${booking.bookingNumber}`,
      metadata: {
        adminCommission,
        vendorShare,
        commissionPercentage: commissionPct
      }
    });

    console.log(`[CommissionService] Booking #${booking.bookingNumber} completed successfully. Cash=${isCash}, Commission=${adminCommission}, VendorShare=${vendorShare}`);
    return { success: true, booking };
  } catch (error) {
    console.error('[CommissionService] Completion processing failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  processBookingCompletion
};
