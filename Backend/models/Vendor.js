const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { VENDOR_STATUS } = require('../utils/constants');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // sparse allows multiple null/undefined values without triggering unique constraint
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['vendor'],
    default: 'vendor'
  },
  password: {
    type: String,
    select: false
  },
  businessName: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    default: 0
  },
  service: {
    type: [String], // Changed to array for multiple categories
    default: [],
    // required: [true, 'Please provide at least one service category'] 
  },
  professions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profession'
  }],
  categories: {
    type: [String],
    default: []
  },
  subCategories: {
    type: [String],
    default: []
  },
  brands: {
    type: [String],
    default: []
  },
  isConsultant: {
    type: Boolean,
    default: false
  },
  skills: {
    type: [String],
    default: []
  },
  training: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    score: {
      type: Number,
      default: 0
    },
    attemptCount: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    assignedLevel: {
      type: Number,
      default: 3 // 1: Expert, 2: Professional, 3: Beginner
    }
  },
  subscription: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'inactive'],
      default: 'inactive'
    }
  },
  isSubscriptionActive: {
    type: Boolean,
    default: false
  },
  aadhar: {
    number: {
      type: String,
      trim: true
    },
    document: {
      type: String // Cloudinary URL (Front Side)
    },
    backDocument: {
      type: String // Cloudinary URL (Back Side)
    }
  },
  pan: {
    number: {
      type: String,
      trim: true,
      uppercase: true
    },
    document: {
      type: String // Cloudinary URL
    }
  },
  otherDocuments: [{
    type: String // Cloudinary URLs
  }],
  approvalStatus: {
    type: String,
    enum: Object.values(VENDOR_STATUS),
    default: VENDOR_STATUS.PENDING
  },
  approvalDate: {
    type: Date
  },
  rejectedReason: {
    type: String
  },

  profilePhoto: {
    type: String,
    default: null
  },
  address: {
    fullAddress: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  wallet: {
    dues: {
      type: Number,
      default: 0 // Amount owed TO admin (from cash collection)
    },
    earnings: {
      type: Number,
      default: 0 // Amount owed BY admin (net income from jobs)
    },
    totalCashCollected: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    },
    totalSettled: {
      type: Number,
      default: 0
    },
    cashLimit: {
      type: Number,
      default: 10000
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedAt: {
      type: Date,
      default: null
    },
    blockReason: {
      type: String,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Settings
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    soundAlerts: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    serviceRange: {
      type: Number,
      default: 10, // Default 10km service range for the vendor
      min: 1
    }
  },
  // Real-time Location
  location: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  // GeoJSON Location for 2dsphere indexing (fast geo queries)
  geoLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  // Real-time Online Status
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  lastSeenAt: {
    type: Date,
    default: null
  },
  currentSocketId: {
    type: String,
    default: null
  },
  // Availability Status
  availability: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'ON_JOB', 'OFFLINE'],
    default: 'OFFLINE',
    index: true
  },
  // Rating & Stats
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalJobs: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  cancelledJobs: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // Business Hours
  businessHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
  },

  // FCM Push Notification Tokens
  fcmTokens: {
    type: [String],
    default: []
  },
  fcmTokenMobile: {
    type: [String],
    default: []
  },
  loginSessionId: {
    type: String,
    default: null
  },
  performanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  level: {
    type: Number,
    enum: [1, 2, 3],
    default: 3
  },
  commissionRate: {
    type: Number,
    default: 15 // Default 15%
  },

  // ─────────────────────────────────────────────────
  // TRAINING & CERTIFICATION SYSTEM
  // ─────────────────────────────────────────────────
  training: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'failed'],
      default: 'not_started'
    },
    assignedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    attemptCount: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    // Cooldown: vendor must wait before retaking (24h after fail)
    nextAttemptAllowedAt: { type: Date, default: null }
  },
  // Assigned level after training test (L1=80%+, L2=50-79%, L3=<50%)
  currentLevel: {
    type: String,
    enum: ['L1', 'L2', 'L3'],
    default: null
  },
  trainingScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  // Admin can freeze vendor (blocks all activity)
  isFrozen: {
    type: Boolean,
    default: false
  },
  freezeReason: {
    type: String,
    default: null
  },
  // Trust score (starts at 100, decreases with complaints/cancellations)
  trustScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Indexes for faster queries
vendorSchema.index({ approvalStatus: 1 });
vendorSchema.index({ 'wallet.earnings': -1 });
vendorSchema.index({ geoLocation: '2dsphere' }); // Fast geo queries
vendorSchema.index({ isOnline: 1, availability: 1, approvalStatus: 1 }); // Compound index for vendor search

// Hash password before saving
vendorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
vendorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Vendor', vendorSchema);

