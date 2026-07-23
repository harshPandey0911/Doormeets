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
  // Booking Slot Configuration
  slotsStartTime: {
    type: String,
    default: '09:00 AM'
  },
  slotsEndTime: {
    type: String,
    default: '09:00 PM'
  },
  slotIntervalGap: {
    type: Number,
    default: 30
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
  privacyPolicy: {
    type: String,
    default: 'Your privacy policy content here.'
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
  },
  aboutPageConfig: {
    title: { type: String, default: 'Welcome to Doormeets' },
    subtitle: { type: String, default: 'Your trusted partner for premium home and personal care services.' },
    happyCustomers: { type: String, default: '10K+' },
    servicePartners: { type: String, default: '500+' },
    appRating: { type: String, default: '4.8' },
    mission: { type: String, default: 'Doormeets is dedicated to revolutionizing how you experience home services. We connect you with top-tier professionals to deliver safe, reliable, and high-quality services right at your doorstep. We believe in making life simpler, one service at a time.' },
    logoUrl: { type: String, default: '' },
    features: {
      type: [{
        title: String,
        description: String,
        iconName: String
      }],
      default: [
        { title: 'Expert Providers', description: 'Verified professionals for all your needs', iconName: 'FiUsers' },
        { title: 'Safe & Secure', description: 'Your safety is our top priority', iconName: 'FiShield' },
        { title: 'On-Time Service', description: 'Punctual delivery at your convenience', iconName: 'FiClock' },
        { title: 'Quality Assured', description: 'Service with 100% satisfaction guarantee', iconName: 'FiAward' }
      ]
    },
    steps: {
      type: [{
        title: String,
        desc: String,
        iconName: String
      }],
      default: [
        { title: 'Book Details', desc: 'Select service & schedule time', iconName: 'FiSmartphone' },
        { title: 'Get Matched', desc: 'We assign a top-rated pro', iconName: 'FiUsers' },
        { title: 'Relax', desc: 'Enjoy high-quality service', iconName: 'FiSmile' }
      ]
    }
  },
  levelConfig: {
    L3: {
      badge: { type: String, default: 'Bronze Partner' },
      name: { type: String, default: 'Level 3 (Beginner)' },
      color: { type: String, default: '#D97706' },
      desc: { type: String, default: 'You are currently on Level 3. Complete more jobs and maintain high ratings to upgrade your level.' },
      customSteps: {
        type: [String],
        default: [
          'Complete at least 15 customer bookings',
          'Maintain minimum 4.2 customer rating',
          'Achieve 85%+ booking completion rate'
        ]
      },
      targetJobs: { type: Number, default: 15 },
      targetRating: { type: Number, default: 4.2 },
      targetCompletionRate: { type: Number, default: 85 }
    },
    L2: {
      badge: { type: String, default: 'Silver Partner' },
      name: { type: String, default: 'Level 2 (Professional)' },
      color: { type: String, default: '#0D9488' },
      desc: { type: String, default: 'Great job! You are a Level 2 partner. Keep providing excellent service to climb to the top Level 1.' },
      customSteps: {
        type: [String],
        default: [
          'Complete at least 50 customer bookings',
          'Maintain minimum 4.7 customer rating',
          'Achieve 92%+ booking completion rate'
        ]
      },
      targetJobs: { type: Number, default: 50 },
      targetRating: { type: Number, default: 4.7 },
      targetCompletionRate: { type: Number, default: 92 }
    },
    L1: {
      badge: { type: String, default: 'Gold Elite Partner' },
      name: { type: String, default: 'Level 1 (Expert)' },
      color: { type: String, default: '#EAB308' },
      desc: { type: String, default: 'Congratulations! You are a Level 1 Elite partner. You receive the highest preference in matching and premium job bookings.' },
      customSteps: {
        type: [String],
        default: [
          'Complete at least 10 bookings every month',
          'Maintain 4.7+ customer rating',
          'Zero safety violations or major complaints'
        ]
      },
      targetJobs: { type: Number, default: 10 },
      targetRating: { type: Number, default: 4.7 },
      maintenanceDesc: { type: String, default: 'Complete at least 10 bookings every month' },
      violationDesc: { type: String, default: 'Zero safety violations or major complaints' }
    }
  },
  cancellationPageConfig: {
    freeCancellationTitle: { type: String, default: 'Free Cancellation' },
    freeCancellationDesc: { type: String, default: 'Until professional is assigned' },
    lateFeeTitle: { type: String, default: 'Late Fee' },
    lateFeeDesc: { type: String, default: 'If cancelled after assignment' },
    stage1Title: { type: String, default: 'Before Journey Start' },
    stage1Desc: { type: String, default: 'Any time before professional starts travel' },
    stage1RefundText: { type: String, default: 'Full Refund • No Fee' },
    stage2Title: { type: String, default: 'Journey Started' },
    stage2Desc: { type: String, default: 'When professional is on the way' },
    stage2RefundText: { type: String, default: '₹{penalty} Cancellation Penalty Applies' },
    stage3Title: { type: String, default: 'Professional Arrived' },
    stage3Desc: { type: String, default: 'When professional reaches your location' },
    stage3RefundText: { type: String, default: '₹{visitingCharges} Visiting Charges Apply' },
    whyChargeTitle: { type: String, default: 'Why do we charge a fee?' },
    whyChargeSubtitle: { type: String, default: 'To support our professionals time & effort' },
    whyChargeDetails: { type: String, default: 'Our service partners reserve their time exclusively for your booking and may travel significant distances. The cancellation fee compensates them for their lost time and travel expenses if a confirmed booking is cancelled last minute.' },
    rescheduleTitle: { type: String, default: 'Need to change plans?' },
    rescheduleDesc: { type: String, default: 'Instead of cancelling, you can reschedule your booking for free up to 2 hours before the service time.' },
    rescheduleButtonLabel: { type: String, default: 'Go Back to Booking' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
