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
  // COD (Cash on Delivery) Settings
  codAdvancePercentage: {
    type: Number,
    default: 0, // % advance for COD bookings (0 = no advance)
    min: 0,
    max: 100
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
  companyCIN: {
    type: String,
    default: ''
  },
  companyWebsite: {
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
  invoiceTitle: {
    type: String,
    default: 'Convenience and Platform Fee'
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
  isInstantBookingEnabled: {
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
  vendorBusyBufferHours: {
    type: Number,
    default: 1, // default 1 hour before scheduled time
    min: 0
  },
  instantBookingMarkup: {
    type: Number,
    default: 99, // default 99 Rs extra markup fee
    min: 0
  },
  instantBookingVendorShare: {
    type: Number,
    default: 50, // default 50 Rs goes to the vendor, remaining (e.g. 49 Rs) to admin
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
  },
  shopReferralRewardShopOwner: {
    type: Number,
    default: 100,
    min: 0
  },
  shopReferralRewardVendor: {
    type: Number,
    default: 50,
    min: 0
  },
  shopReferralQrCodeUrl: {
    type: String,
    default: null
  },
  // Painting Consultation Rates Settings (Dynamic configs for quote calculations)
  paintingRates: {
    consultationFee: { type: Number, default: 0 },
    consultationDuration: { type: String, default: '45 - 60 Minutes physical survey' },
    utilities: {
      doors: {
        enamelRate: { type: Number, default: 120 },
        addlRate: { type: Number, default: 80 }
      },
      grills: {
        enamelRate: { type: Number, default: 90 },
        addlRate: { type: Number, default: 60 }
      },
      windows: {
        enamelRate: { type: Number, default: 100 },
        addlRate: { type: Number, default: 70 }
      },
      panels: {
        enamelRate: { type: Number, default: 150 },
        addlRate: { type: Number, default: 100 }
      }
    },
    additionalServices: {
      waterproofing: { rate: { type: Number, default: 15 } },
      pop_repair: { rate: { type: Number, default: 22 } },
      wallpaper_removal: { rate: { type: Number, default: 500 } },
      texture_painting: { rate: { type: Number, default: 800 } },
      deep_cleaning: { rate: { type: Number, default: 350 } },
      putty_work: { rate: { type: Number, default: 12 } },
      enamel_painting: { rate: { type: Number, default: 30 } }
    },
    brands: [{
      name: { type: String, required: true },
      standardRate: { type: Number, default: 12 },
      premiumRate: { type: Number, default: 18 },
      luxuryRate: { type: Number, default: 25 }
    }],
    wallBaseRate: { type: Number, default: 10 },
    // Dynamic area/dimension-based pricing range configurations
    sqftRanges: [{
      minSqft: { type: Number, required: true },
      maxSqft: { type: Number, required: true },
      rateMultiplier: { type: Number, default: 1.0 } // Multiplier or adjustments for large/small areas
    }],
    doorSizeRates: [{
      minSqft: { type: Number, required: true },
      maxSqft: { type: Number, required: true },
      price: { type: Number, required: true }
    }],
    windowSizeRates: [{
      minSqft: { type: Number, required: true },
      maxSqft: { type: Number, required: true },
      price: { type: Number, required: true }
    }],
    // Dynamic user-side room layouts configurations
    propertyLayouts: [{
      id: { type: String, required: true }, // e.g. 1BHK, 2BHK, Villa
      name: { type: String, required: true },
      tag: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
      details: [{ type: String }] // e.g. ["1 Bedroom", "1 Kitchen"]
    }],
    // Painting landing page content configuration (admin-editable)
    paintingPageConfig: {
      isEnabled: { type: Boolean, default: true },
      badgeText: { type: String, default: '' },        // Hero badge chip text
      heroTitle: { type: String, default: '' },        // H1 headline
      heroSubtitle: { type: String, default: '' },     // Paragraph below H1
      metaTitle: { type: String, default: '' },        // SEO meta title
      metaDescription: { type: String, default: '' },  // SEO meta description
      featureCards: [{                                  // Mini highlight cards in hero banner
        icon: { type: String, default: 'home_repair_service' },  // Material icon name
        title: { type: String, default: '' },
        description: { type: String, default: '' }
      }],
      inclusions: [{ type: String }],                  // What's included in consultation
      workflowSteps: [{                                 // How it works steps
        title: { type: String },
        description: { type: String }
      }],
      valueProps: [{                                    // USP / value proposition cards
        icon: { type: String, default: 'check_circle' },
        title: { type: String },
        description: { type: String }
      }],
      supportSection: {                                 // Bottom support CTA block
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        buttonLabel: { type: String, default: '' }
      },
      // Details page specific custom texts
      detailsBadgeText: { type: String, default: 'Free Consultation' },
      overviewTitle: { type: String, default: 'Property Overview' },
      howItWorksTitle: { type: String, default: 'How It Works' },
      whyChooseTitle: { type: String, default: 'Why Choose Doormeets Painting' },
      inclusionsTitle: { type: String, default: "What's Included in Consultation" },
      infoNoteText: { type: String, default: 'Final pricing is calculated after measuring the actual paintable area and understanding your requirements.' },
      bottomBarTitle: { type: String, default: 'Free Site Inspection' },
      bottomBarSubtitle: { type: String, default: 'Book a consultation today and receive a personalized quotation.' },
      bottomBarButtonLabel: { type: String, default: 'Confirm & Book Consultation' }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
