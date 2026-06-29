const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'global',
    unique: true
  },
  visitedCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  serviceGstPercentage: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  partsGstPercentage: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  vendorCgstPercentage: {
    type: Number,
    default: 2.5,
    min: 0,
    max: 100
  },
  vendorSgstPercentage: {
    type: Number,
    default: 2.5,
    min: 0,
    max: 100
  },
  servicePayoutPercentage: {
    type: Number,
    default: 90, // Vendor gets 90% of service base price
    min: 0,
    max: 100
  },
  partsPayoutPercentage: {
    type: Number,
    default: 100, // Vendor gets 100% of parts base price
    min: 0,
    max: 100
  },
  tdsPercentage: {
    type: Number,
    default: 1, // 1% default TDS u/s 194-O
    min: 0,
    max: 100
  },
  platformFeePercentage: {
    type: Number,
    default: 0, // 0% — platform fee disabled
    min: 0,
    max: 100
  },
  commissionRates: {
    level1: { type: Number, default: 10 },
    level2: { type: Number, default: 15 },
    level3: { type: Number, default: 20 }
  },
  platformFeeRates: {
    level1: { type: Number, default: 0 },
    level2: { type: Number, default: 0 },
    level3: { type: Number, default: 0 }
  },
  vendorCashLimit: {
    type: Number,
    default: 10000,
    min: 0
  },
  cancellationPenalty: {
    type: Number,
    default: 49,
    min: 0
  },
  maxSearchTime: {
    type: Number,
    default: 5, // 5 minutes default
    min: 1
  },
  waveDuration: {
    type: Number,
    default: 60, // 60 seconds per wave default
    min: 10
  },
  searchRadius: {
    type: Number,
    default: 10, // 10 km default search radius
    min: 1
  },
  // Razorpay Settings
  razorpayKeyId: {
    type: String,
    default: null
  },
  razorpayKeySecret: {
    type: String,
    default: null
  },
  razorpayWebhookSecret: {
    type: String,
    default: null
  },
  // Cloudinary Settings
  cloudinaryCloudName: {
    type: String,
    default: null
  },
  cloudinaryApiKey: {
    type: String,
    default: null
  },
  cloudinaryApiSecret: {
    type: String,
    default: null
  },
  // Future extensible fields
  currency: {
    type: String,
    default: 'INR'
  },

  // Billing & Invoice Configuration
  companyName: {
    type: String,
    default: 'TodayMyDream'
  },
  companyGSTIN: {
    type: String,
    default: ''
  },
  companyPAN: {
    type: String,
    default: ''
  },
  companyAddress: {
    type: String,
    default: ''
  },
  companyCity: {
    type: String,
    default: ''
  },
  companyState: {
    type: String,
    default: ''
  },
  companyPincode: {
    type: String,
    default: ''
  },
  companyPhone: {
    type: String,
    default: ''
  },
  companyEmail: {
    type: String,
    default: ''
  },

  // Invoice Settings
  invoicePrefix: {
    type: String,
    default: 'INV'
  },
  sacCode: {
    type: String,
    default: '998599'  // Event services SAC code
  },
  currentInvoiceNumber: {
    type: Number,
    default: 0
  },

  // Support Settings
  supportEmail: {
    type: String,
    default: ''
  },
  supportPhone: {
    type: String,
    default: ''
  },
  supportWhatsapp: {
    type: String,
    default: ''
  },
  isOnlinePaymentEnabled: {
    type: Boolean,
    default: true
  },
  policeVerificationDays: {
    type: Number,
    default: 7, // Vendors have 7 days to complete verification by default
    min: 1
  },
  mcqTimeLimitMinutes: {
    type: Number,
    default: 30, // 30 minutes default for MCQ test
    min: 1
  },
  mcqMinScoreL1: {
    type: Number,
    default: 80, // >= 80% is Level 1
    min: 0,
    max: 100
  },
  mcqMinScoreL2: {
    type: Number,
    default: 50, // >= 50% is Level 2 (passing mark)
    min: 0,
    max: 100
  },
  commissionPercentage: {
    type: Number,
    default: 20, // default 20%
    min: 0,
    max: 100
  },
  welcomeVideoUrl: {
    type: String,
    default: null
  },
  loyaltyPointsEarningRate: {
    type: Number,
    default: 1, // 1 point per 100 Rs spent
    min: 0
  },
  loyaltyPointsRedemptionRate: {
    type: Number,
    default: 1, // 1 point = 1 Rs discount
    min: 0
  },
  loyaltyPointsCancellationPenalty: {
    type: Number,
    default: 0, // points deducted on cancellation
    min: 0
  },
  loyaltyPointsFixedCompletionAward: {
    type: Number,
    default: 0, // flat points awarded on completion
    min: 0
  },
  referralRewardReferrer: {
    type: Number,
    default: 100,
    min: 0
  },
  referralRewardReferee: {
    type: Number,
    default: 100,
    min: 0
  },
  maxWalletUsagePercentage: {
    type: Number,
    default: 30,
    min: 0,
    max: 100
  },
  codAdvancePercentage: {
    type: Number,
    default: 10, // 10% advance payment required for COD
    min: 0,
    max: 100
  },
  isInstantBookingEnabled: {
    type: Boolean,
    default: true
  },
  instantBookingMarkup: {
    type: Number,
    default: 99, // default 99 Rs extra markup fee
    min: 0
  },
  instantBookingWaitTime: {
    type: Number,
    default: 45, // default 45 minutes arrival wait time
    min: 5
  },
  // how many hours from booking-time onwards are treated as "instant"
  instantBookingWindowHours: {
    type: Number,
    default: 4, // slots within the next 4 hours count as instant
    min: 1
  },
  // whether to show estimated arrival time to the user at checkout
  showArrivalTime: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
