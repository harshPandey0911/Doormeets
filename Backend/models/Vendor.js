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
    name: {
      type: String,
      trim: true
    },
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
  policeVerification: {
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending'
    },
    documentUrl: {
      type: String, // Cloudinary URL
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    method: {
      type: String,
      enum: ['self', 'admin'],
      default: 'self'
    },
    isGracePeriodActive: {
      type: Boolean,
      default: true
    }
  },
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
  workStatus: {
    type: String,
    enum: ["available", "busy"],
    default: "available",
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
  reservedFrom: {
    type: Date,
    default: null
  },
  reservedBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  availabilityStatus: {
    type: String,
    enum: ['ONLINE', 'RESERVED', 'BUSY', 'OFFLINE'],
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
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredByShopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopOwner',
    default: null
  },
  referredByVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null
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

// Helper function to parse scheduled start time
function parseScheduledStartTime(scheduledDate, timeStr) {
  const date = new Date(scheduledDate);
  if (isNaN(date.getTime())) return new Date();
  
  let hours = 0;
  let minutes = 0;
  if (typeof timeStr === 'string') {
    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    let numericTime = cleanTime.replace(/[AP]M/, '').trim();
    const parts = numericTime.split(':');
    if (parts.length >= 1) {
      hours = parseInt(parts[0], 10) || 0;
    }
    if (parts.length >= 2) {
      minutes = parseInt(parts[1], 10) || 0;
    }
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// Static method to update workload status based on active self jobs
vendorSchema.statics.updateWorkStatus = async function (vendorId) {
  if (!vendorId) return;
  const Booking = mongoose.model('Booking');
  const Settings = mongoose.model('Settings');
  
  // Find all active bookings
  const activeJobs = await Booking.find({
    vendorId: vendorId,
    status: { $in: ['accepted', 'assigned', 'visited', 'in_progress', 'work_done', 'final_settlement', 'confirmed'] }
  });

  const globalSettings = await Settings.findOne({ type: 'global' }).lean();
  const busyBufferHours = (globalSettings && globalSettings.vendorBusyBufferHours !== undefined)
    ? globalSettings.vendorBusyBufferHours
    : 1;

  let isBusy = false;
  const now = new Date();

  for (const job of activeJobs) {
    const status = job.status?.toLowerCase();
    
    // 1. If currently working on site, busy
    if (['visited', 'in_progress', 'work_done', 'final_settlement'].includes(status)) {
      // Only treat as busy if this was a self job (vendor doing it themselves)
      // If it was assigned to a worker, the vendor is not busy.
      if (job.isSelfJob || !job.workerId) {
        isBusy = true;
        break;
      }
    }

    // 2. If scheduled, only busy starting dynamic buffer hours before scheduled time
    if (['accepted', 'assigned', 'confirmed'].includes(status)) {
      if (job.isSelfJob || !job.workerId) {
        const scheduledStart = parseScheduledStartTime(job.scheduledDate, job.timeSlot?.start || job.scheduledTime);
        const busyBufferMs = busyBufferHours * 60 * 60 * 1000;
        const bufferBeforeStart = new Date(scheduledStart.getTime() - busyBufferMs);
        
        if (now >= bufferBeforeStart) {
          isBusy = true;
          break;
        }
      }
    }
  }

  // Check if vendor has online/free workers if vendor themselves is busy
  if (isBusy) {
    try {
      const Worker = mongoose.model('Worker');
      // Find all workers registered under this vendor who are online
      const onlineWorkers = await Worker.find({
        vendorId: vendorId,
        status: 'ONLINE'
      }).select('_id');

      if (onlineWorkers.length > 0) {
        // Check if any of these online workers do NOT have an active job
        const workerIds = onlineWorkers.map(w => w._id);
        const activeWorkerJobs = await Booking.find({
          workerId: { $in: workerIds },
          status: { $in: ['accepted', 'assigned', 'visited', 'in_progress', 'work_done', 'final_settlement', 'confirmed'] }
        }).select('workerId');

        const busyWorkerIds = new Set(activeWorkerJobs.map(job => job.workerId?.toString()));
        const freeWorkerExists = onlineWorkers.some(w => !busyWorkerIds.has(w._id.toString()));

        if (freeWorkerExists) {
          // If a free worker exists, the vendor is NOT busy overall!
          isBusy = false;
        }
      }
    } catch (workerErr) {
      console.error('[Vendor.updateWorkStatus] Failed to evaluate worker availability:', workerErr);
    }
  }

  const vendor = await this.findById(vendorId).select('isOnline');
  const isOnline = vendor ? vendor.isOnline : false;

  const newStatus = isBusy ? 'busy' : 'available';
  const newAvailability = isBusy ? 'ON_JOB' : (isOnline ? 'AVAILABLE' : 'OFFLINE');
  const availabilityStatus = isBusy ? 'BUSY' : (isOnline ? 'ONLINE' : 'OFFLINE');

  const updateFields = {
    workStatus: newStatus,
    availability: newAvailability
  };

  // If no busy jobs, clean up reservation fields and reset availabilityStatus
  if (!isBusy) {
    updateFields.availabilityStatus = availabilityStatus;
    updateFields.reservedFrom = null;
    updateFields.reservedBookingId = null;
  } else {
    updateFields.availabilityStatus = 'BUSY';
  }

  await this.findByIdAndUpdate(vendorId, { $set: updateFields });
  return newStatus;
};

module.exports = mongoose.model('Vendor', vendorSchema);
