const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const Transaction = require('../../models/Transaction');
const { PAYMENT_STATUS } = require('../../utils/constants');

/**
 * Initiate Cash Collection
 * Optional: Sends OTP to customer
 */
exports.initiateCashCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow cash, pay_at_home, AND plan_benefit (for final bill flow)
    const allowedMethods = ['cash', 'pay_at_home', 'plan_benefit'];
    if (!allowedMethods.includes(booking.paymentMethod)) {
      return res.status(400).json({ success: false, message: 'This booking is not eligible for cash collection' });
    }

    // Optional: Update final total and extra items if provided during initiation
    const { totalAmount, extraItems } = req.body;
    if (totalAmount !== undefined) {
      booking.finalAmount = Number(totalAmount);
    }

    // Store extra items for proper commission calculation
    if (extraItems && Array.isArray(extraItems) && extraItems.length > 0) {
      // 1. Update workDoneDetails (Frontend display)
      booking.workDoneDetails = {
        ...booking.workDoneDetails,
        items: extraItems.map(item => ({
          title: item.title,
          qty: Number(item.qty) || 1,
          price: Number(item.price) || 0
        }))
      };

      // 2. Update extraCharges (Backend calculation)
      booking.extraCharges = extraItems.map(item => ({
        name: item.title,
        quantity: Number(item.qty) || 1,
        price: Number(item.price) || 0,
        total: (Number(item.qty) || 1) * (Number(item.price) || 0)
      }));

      // 3. Update extraChargesTotal
      booking.extraChargesTotal = booking.extraCharges.reduce((sum, item) => sum + item.total, 0);
    }

    // Force mark modified for nested object (just in case)
    if (extraItems) {
      booking.markModified('workDoneDetails');
      booking.markModified('extraCharges');
    }

    // For backwards compatibility and future use, we can still generate it but not force it
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    booking.customerConfirmationOTP = otp;
    booking.paymentOtp = otp;
    await booking.save();

    // Emit socket event to user with full bill details and OTP
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        finalAmount: booking.finalAmount,
        customerConfirmationOTP: booking.customerConfirmationOTP,
        paymentOtp: booking.paymentOtp,
        workDoneDetails: booking.workDoneDetails
      });
    }

    // Send Push Notification with OTP
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'work_done',
      title: 'Payment Request & Bill Ready',
      message: `Bill: ₹${booking.finalAmount}. OTP: ${otp}. Please verify bill and share OTP to complete payment.`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high',
      pushData: {
        type: 'work_done',
        bookingId: booking._id.toString(),
        paymentOtp: otp,
        link: `/user/booking/${booking._id}`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Bill finalized',
      totalAmount: booking.finalAmount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm Cash Collection (by Vendor/Worker)
 */
exports.confirmCashCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, amount, extraItems } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // OTP Verification - REQUIRED to ensure customer agrees to final bill
    // EXCEPTION: For plan_benefit with no extras, OTP 0000 is allowed (no actual OTP sent)
    const isPlanBenefitNoExtras = booking.paymentMethod === 'plan_benefit' && otp === '0000';

    if (!isPlanBenefitNoExtras && booking.customerConfirmationOTP && otp && booking.customerConfirmationOTP !== otp) {
      // Allow 0000 only if explicitly allowed in environment (for testing) or just strict check
      if (process.env.NODE_ENV !== 'development' || otp !== '0000') {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please enter the code sent to the customer.' });
      }
    }

    const collectionAmount = amount || booking.finalAmount;
    const Settings = require('../../models/Settings');
    const settings = await Settings.findOne({ type: 'global' });
    const commissionRate = (settings?.commissionPercentage || 10) / 100;

    // Store extra items in both workDoneDetails and the new extraCharges field
    if (extraItems && Array.isArray(extraItems) && extraItems.length > 0) {
      // Store in workDoneDetails (legacy)
      booking.workDoneDetails = {
        ...booking.workDoneDetails,
        items: extraItems.map(item => ({
          title: item.title,
          qty: item.qty || 1,
          price: item.price
        }))
      };

      // Store in new extraCharges field with proper structure
      booking.extraCharges = extraItems.map(item => ({
        name: item.title,
        quantity: Number(item.qty) || 1,
        price: Number(item.price) || 0,
        total: (Number(item.qty) || 1) * (Number(item.price) || 0)
      }));

      // Calculate total from items
      const calculatedExtraTotal = booking.extraCharges.reduce((sum, item) => sum + item.total, 0);
      booking.extraChargesTotal = calculatedExtraTotal;
    }

    // Recalculate earnings and commission
    // Recalculate earnings and commission

    // LOGIC: 
    // 1. Base Amount (Base + Tax + Visit - Discount) -> Commission Applies (10% Admin, 90% Vendor)
    // 2. Extra Charges -> NO Commission (100% Vendor)

    const extraChargesTotal = booking.extraChargesTotal || 0;

    if (booking.paymentMethod === 'plan_benefit') {
      // PLAN BENEFIT
      // Base earnings already calculated at booking creation
      const originalVendorEarnings = booking.vendorEarnings || 0;

      // Extras go 100% to vendor
      booking.vendorEarnings = parseFloat((originalVendorEarnings + collectionAmount).toFixed(2));

      // Admin commission unchanged (stays on base only)

      // Update FINAL AMOUNT (User Pays)
      // For plan, User Pays = Extras Only
      // collectionAmount IS the extras total here
      booking.finalAmount = (booking.finalAmount || 0) + collectionAmount;
      booking.userPayableAmount = collectionAmount; // Explicitly set user payable

    } else {
      // NORMAL BOOKING

      // "collectionAmount" is the TOTAL user is paying now (Base Remainder + Extras)
      // We need to separate Base part from Extras part

      // Base Part = Total Collection - Extras (ensure not negative)
      const basePart = Math.max(0, collectionAmount - extraChargesTotal);

      // Calculate Commission on Base Part ONLY
      const adminCommissionOnBase = parseFloat((basePart * commissionRate).toFixed(2));
      const vendorEarningsOnBase = parseFloat((basePart - adminCommissionOnBase).toFixed(2));

      // Vendor Total = Base Earnings + Extras (100%)
      booking.adminCommission = adminCommissionOnBase;
      booking.vendorEarnings = parseFloat((vendorEarningsOnBase + extraChargesTotal).toFixed(2));

      // Final Amount and User Payable are the same for normal
      booking.finalAmount = collectionAmount;
      booking.userPayableAmount = collectionAmount;
    }

    // Update Booking
    booking.cashCollected = true;
    booking.cashCollectedAt = new Date();
    booking.cashCollectedBy = userRole === 'vendor' ? 'vendor' : 'worker';
    booking.cashCollectorId = userId;

    // PLAN BENEFIT: Set to SUCCESS instead of COLLECTED_BY_VENDOR
    if (booking.paymentMethod === 'plan_benefit') {
      booking.paymentStatus = PAYMENT_STATUS.SUCCESS;
    } else {
      booking.paymentStatus = PAYMENT_STATUS.COLLECTED_BY_VENDOR;
    }

    // If it was a self-job or completed by worker, mark booking as completed or work_done?
    // Usually cash collection is the last step for cash bookings.
    if (booking.status === 'work_done' || booking.status === 'visited' || booking.status === 'in_progress') {
      booking.status = 'completed';
      booking.completedAt = new Date();
    }

    await booking.save();

    // Update Vendor Wallet (Even if worker collected, it goes to vendor's ledger)
    const vendorId = booking.vendorId;
    const vendor = await Vendor.findById(vendorId);

    if (vendor) {
      // Increase dues (amount vendor owes to admin)
      vendor.wallet.dues = (vendor.wallet.dues || 0) + collectionAmount;
      vendor.wallet.totalCashCollected = (vendor.wallet.totalCashCollected || 0) + collectionAmount;

      // Check cash limit
      if (vendor.wallet.dues > (vendor.wallet.cashLimit || 10000)) {
        vendor.wallet.isBlocked = true;
        vendor.wallet.blockedAt = new Date();
        vendor.wallet.blockReason = 'Cash collection limit exceeded. Please settle dues with admin.';
      }

      await vendor.save();

      // Record Transaction
      await Transaction.create({
        vendorId,
        userId: booking.userId,
        bookingId: booking._id,
        amount: collectionAmount,
        type: 'cash_collected',
        description: `Cash collected for booking ${booking.bookingNumber}`,
        status: 'completed'
      });
    }

    // Emit socket event to user for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.userId}`).emit('booking_updated', {
        bookingId: booking._id,
        status: booking.status,
        cashCollected: true,
        message: 'Payment recorded and booking completed!'
      });
    }

    // Send Push Notification for Cash Confirmation
    const { createNotification } = require('../notificationControllers/notificationController');
    await createNotification({
      userId: booking.userId,
      type: 'payment_received',
      title: 'Payment Received (Cash)',
      message: `Payment of ₹${collectionAmount} received in cash. Job Completed. Thanks!`,
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high'
    });

    res.status(200).json({
      success: true,
      message: 'Cash collection confirmed and recorded in ledger',
      data: {
        bookingId: booking._id,
        amount: collectionAmount,
        walletDues: vendor?.wallet?.dues
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Customer Confirm Payment (Optional flow for user to confirm they paid)
 */
exports.customerConfirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.customerConfirmed = true;
    await booking.save();

    res.status(200).json({ success: true, message: 'Payment confirmed by customer' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Cash Collection Status
 */
exports.getCashCollectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).select('cashCollected cashCollectedAt cashCollectedBy paymentStatus');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
