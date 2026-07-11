const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../utils/constants');

/**
 * Booking Model
 * Represents service bookings made by users
 * Organized by logical sections for better maintainability
 */
const bookingSchema = new mongoose.Schema({
  // ==========================================
  // 1. IDENTIFIERS
  // ==========================================
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: false,
    index: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    default: null,
    index: true
  },
  notifiedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],

  // ==========================================
  // WAVE-BASED ALERTING
  // ==========================================
  potentialVendors: [{
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    distance: { type: Number }, // in km
    wave: { type: Number } // wave assignment level
  }],
  currentWave: {
    type: Number,
    default: 1
  },
  waveStartedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isBidding: {
    type: Boolean,
    default: false
  },
  biddingDeadline: {
    type: Date,
    default: null
  },

  // ==========================================
  // 2. SERVICE INFORMATION
  // ==========================================
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required'],
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
    index: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceCategory: {
    type: String,
    required: [true, 'Service category is required']
  },
  // Visual Identity (For easier UI access)
  categoryIcon: { type: String, default: null }, // URL to category icon
  brandName: { type: String, default: null },    // e.g. "LG", "Samsung"
  brandIcon: { type: String, default: null },    // URL to brand logo
  description: {
    type: String,
    trim: true
  },
  serviceImages: [{
    type: String
  }],
  serviceType: {
    type: String,
    enum: ['service', 'product'],
    default: 'service'
  },
  isConsultation: {
    type: Boolean,
    default: false
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaintingConsultation',
    default: null
  },
  // Booked Items (Brand > Card snapshot)
  bookedItems: [{
    brandName: { type: String, default: '' },
    brandIcon: { type: String, default: null },
    serviceName: { type: String, default: '' },
    card: {
      title: { type: String },
      subtitle: { type: String },
      price: { type: Number, default: 0 },
      originalPrice: { type: Number },
      duration: { type: String },
      description: { type: String },
      imageUrl: { type: String },
      features: [{ type: String }]
    },
    quantity: { type: Number, default: 1 }
  }],

  // ==========================================
  // 3. PRICING & BILLING
  // ==========================================
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  visitingCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  instantMarkupCharged: {
    type: Number,
    default: 0
  },
  penalty: {
    type: Number,
    default: 0,
    min: 0
  },
  extraCharges: [{
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  extraChargesTotal: {
    type: Number,
    default: 0
  },
  // Total Value of the Booking (set after bill generation)
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: 0
  },
  // Amount specifically payable by the user (might differ from finalAmount in plan cases)
  userPayableAmount: {
    type: Number,
    default: 0
  },
  // Reference to VendorBill (single source of truth for earnings/commission)
  vendorBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorBill',
    default: null
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  adminCommission: {
    type: Number,
    default: 0
  },
  vendorShare: {
    type: Number,
    default: 0
  },
  commissionStatus: {
    type: String,
    enum: ['pending', 'received', 'none'],
    default: 'none',
    index: true
  },

  // ==========================================
  // 4. PAYMENT INFORMATION
  // ==========================================
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
    index: true
  },
  paymentMethod: {
    type: String, // 'wallet', 'razorpay', 'online', 'cash', 'card', 'plan_benefit'
    default: null
  },
  paymentId: {
    type: String,
    default: null
  },
  razorpayOrderId: {
    type: String,
    default: null,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpayQrId: {
    type: String,
    default: null,
    index: true
  },
  // Cash Collection Details
  cashCollected: {
    type: Boolean,
    default: false
  },
  cashCollectedAt: {
    type: Date,
    default: null
  },
  cashCollectedBy: {
    type: String,
    enum: ['vendor', 'worker'],
    default: null
  },
  cashCollectorId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'cashCollectedBy',
    default: null
  },

  // ==========================================
  // 5. ADDRESS INFORMATION
  // ==========================================
  address: {
    type: { type: String, default: 'home' },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },

  // ==========================================
  // 6. SCHEDULING
  // ==========================================
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    index: true
  },
  scheduledTime: {
    type: String,
    required: [true, 'Scheduled time is required']
  },
  timeSlot: {
    start: { type: String, required: true },
    end: { type: String, required: true },
    date: { type: String }, // redundant but kept for frontend convenience format
    time: { type: String }  // redundant but kept for frontend convenience format
  },

  // ==========================================
  // 7. STATUS & TRACKING
  // ==========================================
  bookingType: {
    type: String,
    enum: ['instant', 'scheduled'],
    default: 'scheduled',
    index: true
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING,
    index: true
  },
  workerResponse: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  // Timestamps
  acceptedAt: { type: Date, default: null },
  assignedAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  journeyStartedAt: { type: Date, default: null },
  visitedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },

  // ==========================================
  // 8. SECURITY & OTPs
  // ==========================================
  visitOtp: {
    type: String,
    select: false
  },
  paymentOtp: {
    type: String,
    select: false
  },
  customerConfirmationOTP: {
    type: String,
    default: null
  },
  customerConfirmed: {
    type: Boolean,
    default: false
  },

  // ==========================================
  // 9. WORK COMPLETION
  // ==========================================
  // ==========================================
  // 9. WORK COMPLETION
  // ==========================================
  workPhotos: [{
    type: String
  }],
  reachedPhotos: [{
    type: String
  }],
  visitLocation: {
    lat: Number,
    lng: Number,
    address: String,
    verifiedAt: Date
  },
  workDoneDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Note: Detailed billing (items/parts) is now handled by VendorBill model
  // workDoneDetails and extraCharges are deprecated in favor of VendorBill

  // ==========================================
  // 10. RECONFIRMATION
  // ==========================================
  reconfirmationRequired: {
    type: Boolean,
    default: false
  },
  reconfirmationSentAt: {
    type: Date,
    default: null
  },
  reconfirmedAt: {
    type: Date,
    default: null
  },
  reconfirmationStatus: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'MISSED', 'DECLINED'],
    default: null
  },
  bookingRiskStatus: {
    type: String,
    enum: ['NORMAL', 'HIGH'],
    default: 'NORMAL'
  },

  // ==========================================
  // 11. CANCELLATION
  // ==========================================
  cancelledAt: { type: Date, default: null },
  cancellationReason: { type: String, default: null },
  cancelledBy: { type: String, default: null },

  // ==========================================
  // 11. REVIEW & RATING
  // ==========================================
  rating: { type: Number, default: null, min: 1, max: 5 },
  review: { type: String, default: null },
  reviewImages: [{ type: String }],
  reviewedAt: { type: Date, default: null },

  // ==========================================
  // 12. SETTLEMENT (Worker/User)
  // ==========================================
  workerPaymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'SUCCESS'],
    default: 'PENDING'
  },
  isWorkerPaid: { type: Boolean, default: false },
  workerPaidAt: { type: Date, default: null },
  finalSettlementStatus: {
    type: String,
    enum: ['PENDING', 'DONE'],
    default: 'PENDING'
  },

  // ==========================================
  // 13. NOTES
  // ==========================================
  vendorNotes: { type: String, default: null },
  workerNotes: { type: String, default: null },

  // Workload and capacity status tracking
  isSelfJob: {
    type: Boolean,
    default: false
  },
  dynamicFields: [{
    fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceField' },
    name: { type: String },
    label: { type: String },
    value: { type: mongoose.Schema.Types.Mixed }
  }],
  visits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingVisit'
  }],
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsAwarded: {
    type: Boolean,
    default: false
  },
  loyaltyPointsRefunded: {
    type: Boolean,
    default: false
  },
  referralProcessed: {
    type: Boolean,
    default: false
  },
  walletAmountApplied: {
    type: Number,
    default: 0
  },
  walletAmountRefunded: {
    type: Boolean,
    default: false
  },
  codAdvanceAmount: {
    type: Number,
    default: 0
  },

  // ==========================================
  // BILLING — USER GST
  // ==========================================
  userGstNumber: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true
});

// Generate unique booking number
bookingSchema.pre('save', async function (next) {
  if (this.isNew && !this.bookingNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingNumber = `BK${timestamp}${random}`;
  }

  // Refund loyalty points and wallet applied if cancelled or search failed
  if (this.isModified('status') && (this.status === 'cancelled' || this.status === 'no_vendors')) {
    if (this.loyaltyPointsRedeemed > 0 && !this.loyaltyPointsRefunded) {
      try {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(this.userId, { $inc: { loyaltyPoints: this.loyaltyPointsRedeemed } });
        console.log(`[LoyaltyPoints] Refunded ${this.loyaltyPointsRedeemed} points to user ${this.userId} due to status change to ${this.status}`);

        const Transaction = mongoose.model('Transaction');
        await Transaction.create({
          userId: this.userId,
          type: 'refund',
          amount: this.loyaltyPointsRedeemed,
          status: 'completed',
          paymentMethod: 'system',
          description: `Refunded ${this.loyaltyPointsRedeemed} Loyalty Points for booking #${this.bookingNumber} (${this.status})`,
          bookingId: this._id,
          metadata: { type: 'loyalty_points', pointsRefunded: this.loyaltyPointsRedeemed }
        });

        this.loyaltyPointsRefunded = true;
      } catch (err) {
        console.error('[LoyaltyPoints] Error refunding points in pre-save hook:', err);
      }
    }

    if (this.walletAmountApplied > 0 && !this.walletAmountRefunded) {
      try {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(this.userId, { $inc: { 'wallet.balance': this.walletAmountApplied } });
        console.log(`[Wallet] Refunded ₹${this.walletAmountApplied} to user ${this.userId} due to status change to ${this.status}`);

        const Transaction = mongoose.model('Transaction');
        await Transaction.create({
          userId: this.userId,
          type: 'refund',
          amount: this.walletAmountApplied,
          status: 'completed',
          paymentMethod: 'system',
          description: `Refunded ₹${this.walletAmountApplied} wallet balance for booking #${this.bookingNumber} (${this.status})`,
          bookingId: this._id
        });

        this.walletAmountRefunded = true;
      } catch (err) {
        console.error('[Wallet] Error refunding wallet balance in pre-save hook:', err);
      }
    }
  }

  // Deduct loyalty points cancellation penalty if booking is cancelled
  if (this.isModified('status') && this.status === 'cancelled') {
    try {
      const Settings = mongoose.model('Settings');
      const globalSettings = await Settings.findOne({ type: 'global' }).lean();
      const cancellationPenalty = globalSettings?.loyaltyPointsCancellationPenalty || 0;

      if (cancellationPenalty > 0) {
        const User = mongoose.model('User');
        const user = await User.findById(this.userId);
        if (user) {
          const penaltyAmount = Math.min(user.loyaltyPoints || 0, cancellationPenalty);
          if (penaltyAmount > 0) {
            user.loyaltyPoints -= penaltyAmount;
            await user.save();

            const Transaction = mongoose.model('Transaction');
            await Transaction.create({
              userId: this.userId,
              type: 'penalty',
              amount: penaltyAmount,
              status: 'completed',
              paymentMethod: 'system',
              description: `Deducted ${penaltyAmount} Loyalty Points as cancellation penalty for booking #${this.bookingNumber}`,
              bookingId: this._id,
              metadata: { type: 'loyalty_points', pointsDeducted: penaltyAmount }
            });
            console.log(`[LoyaltyPoints] Deducted ${penaltyAmount} points from user ${this.userId} as cancellation penalty for booking ${this.bookingNumber}`);
          }
        }
      }
    } catch (err) {
      console.error('[LoyaltyPoints] Error deducting cancellation penalty points in pre-save hook:', err);
    }
  }
  next();
});

// Post-save hook to award loyalty points upon completion
bookingSchema.post('save', async function (doc) {
  if (doc.status === 'completed' && !doc.loyaltyPointsAwarded && (doc.paymentMethod === 'razorpay' || doc.paymentMethod === 'wallet' || doc.paymentMethod === 'online')) {
    try {
      const Settings = mongoose.model('Settings');
      const globalSettings = await Settings.findOne({ type: 'global' }).lean();
      const earningRate = globalSettings?.loyaltyPointsEarningRate !== undefined ? globalSettings.loyaltyPointsEarningRate : 1;
      const fixedAward = globalSettings?.loyaltyPointsFixedCompletionAward || 0;

      // Award points based on amount spent + flat completion award
      const pointsEarned = (Math.floor(doc.finalAmount / 100) * earningRate) + fixedAward;

      if (pointsEarned > 0) {
        await mongoose.model('Booking').findByIdAndUpdate(doc._id, {
          loyaltyPointsEarned: pointsEarned,
          loyaltyPointsAwarded: true
        });

        const User = mongoose.model('User');
        await User.findByIdAndUpdate(doc.userId, { $inc: { loyaltyPoints: pointsEarned } });
        console.log(`[LoyaltyPoints] Awarded ${pointsEarned} points to user ${doc.userId} for booking ${doc.bookingNumber}`);

        // Try creating push/in-app notification
        const { createNotification } = require('../controllers/notificationControllers/notificationController');
        await createNotification({
          userId: doc.userId,
          type: 'loyalty_points_earned',
          title: 'Loyalty Points Earned! 🎁',
          message: `Congratulations! You earned ${pointsEarned} loyalty points from your booking ${doc.bookingNumber}.`,
          relatedId: doc._id,
          relatedType: 'booking',
          pushData: {
            type: 'loyalty_points_earned',
            bookingId: doc._id.toString(),
            link: '/user/rewards'
          }
        });
      } else {
        await mongoose.model('Booking').findByIdAndUpdate(doc._id, { loyaltyPointsAwarded: true });
      }
    } catch (err) {
      console.error('[LoyaltyPoints] Error awarding points post-save:', err);
    }
  }

  // Handle referral reward for the referrer upon referee's first booking completion
  if (doc.status === 'completed' && !doc.referralProcessed) {
    try {
      const User = mongoose.model('User');
      const refereeUser = await User.findById(doc.userId);
      if (refereeUser && refereeUser.referredBy && refereeUser.referralStatus === 'pending') {
        const Settings = mongoose.model('Settings');
        const globalSettings = await Settings.findOne({ type: 'global' }).lean();
        const referrerReward = globalSettings?.referralRewardReferrer !== undefined ? globalSettings.referralRewardReferrer : 100;

        if (referrerReward > 0) {
          // Credit referrer's wallet balance
          await User.findByIdAndUpdate(refereeUser.referredBy, {
            $inc: { 'wallet.balance': referrerReward }
          });

          // Log Transaction for referrer
          const Transaction = mongoose.model('Transaction');
          await Transaction.create({
            userId: refereeUser.referredBy,
            type: 'credit',
            amount: referrerReward,
            status: 'completed',
            paymentMethod: 'system',
            description: `Referral Reward: Your referred friend completed their first booking #${doc.bookingNumber}`,
            bookingId: doc._id
          });

          // Send notification to referrer
          const { createNotification } = require('../controllers/notificationControllers/notificationController');
          await createNotification({
            userId: refereeUser.referredBy,
            type: 'referral_earned',
            title: 'Referral Reward Credited! 🎉',
            message: `Congratulations! You have received ₹${referrerReward} in your wallet because your referred friend, ${refereeUser.name}, completed their first booking.`,
            relatedId: doc._id,
            relatedType: 'booking',
            pushData: {
              type: 'referral_earned',
              bookingId: doc._id.toString(),
              link: '/user/rewards'
            }
          });
        }

        // Update user's referralStatus to rewarded
        refereeUser.referralStatus = 'rewarded';
        await refereeUser.save();

        // Mark booking.referralProcessed = true
        await mongoose.model('Booking').findByIdAndUpdate(doc._id, { referralProcessed: true });
      } else {
        // If not referred or status is not pending, still mark it processed so we don't check again
        await mongoose.model('Booking').findByIdAndUpdate(doc._id, { referralProcessed: true });
      }
    } catch (err) {
      console.error('[Referral] Error processing referrer reward:', err);
    }
  }
});

// Core compound indexes
bookingSchema.index({ userId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ workerId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ scheduledDate: 1, status: 1 });
bookingSchema.index({ paymentStatus: 1, status: 1 });
bookingSchema.index({ createdAt: -1 });

// ── PERFORMANCE INDEXES (added for wave-scheduler & dashboard queries) ──
// Scheduler: Booking.find({ status: 'searching', waveStartedAt: { $ne: null } })
bookingSchema.index({ status: 1, waveStartedAt: 1 });
// Reject/Accept: Booking.findOne({ notifiedVendors: vendorId, status: ... })
bookingSchema.index({ notifiedVendors: 1, status: 1 });
// Wave filter: potentialVendors.vendorId lookup
bookingSchema.index({ 'potentialVendors.vendorId': 1 });
// Dashboard: $or on { vendorId: null, serviceCategory: ..., status: ... }
bookingSchema.index({ vendorId: 1, serviceCategory: 1, status: 1 });

require('./Worker');

module.exports = mongoose.model('Booking', bookingSchema);
