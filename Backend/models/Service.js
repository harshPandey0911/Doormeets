const mongoose = require('mongoose');
const { SERVICE_STATUS } = require('../utils/constants');

/**
 * Package Schema — for package_base service type
 */
const packageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, default: 0 },
  originalPrice: { type: Number, default: null },
  duration: { type: String, trim: true },  // e.g. "2-3 hours"
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { _id: true });

/**
 * Service Model (New Structure)
 * Represents individual services strictly under a Brand
 */
const serviceSchema = new mongoose.Schema({
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    index: true,
    default: null
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true,
    default: null
  },
  title: {
    type: String,
    required: [true, 'Please provide a service title'],
    trim: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  iconUrl: {
    type: String,
    default: null
  },
  // Base price and GST removed - moved to ServiceBrandPricing
  // Status and descriptions remain
  status: {
    type: String,
    enum: Object.values(SERVICE_STATUS),
    default: SERVICE_STATUS.ACTIVE,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  steps: [{
    type: String,
    trim: true
  }],
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
    index: true
  },
  cityIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  }],

  // ─── Service Type ────────────────────────────────────────────
  // minute_base: price per minute (Plumber, Electrician per hour/min)
  // package_base: fixed package pricing (Cleaning packages)
  // image_base: user uploads images, gets quote from vendor
  // multi_visit: multiple visits (Pest Control, Physiotherapy)
  serviceType: {
    type: String,
    enum: ['minute_base', 'package_base', 'image_base', 'multi_visit', 'dynamic_base'],
    default: 'package_base',
    index: true
  },

  // ─── Minute Base fields ───────────────────────────────────────
  pricePerMinute: {
    type: Number,
    default: null  // e.g. 5 = ₹5 per minute
  },
  minimumMinutes: {
    type: Number,
    default: 30    // Minimum booking duration in minutes
  },

  // ─── Package Base fields ──────────────────────────────────────
  packages: {
    type: [packageSchema],
    default: []
  },

  // ─── Image Base fields ────────────────────────────────────────
  quoteInstructions: {
    type: String,
    trim: true,
    default: null  // Instructions shown to user when uploading images
  },
  maxImageUploads: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

// Generate slug from title before saving
serviceSchema.pre('validate', async function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
