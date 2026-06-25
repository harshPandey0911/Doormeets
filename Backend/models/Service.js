const mongoose = require('mongoose');
const { SERVICE_STATUS } = require('../utils/constants');

/**
 * ─── Service Group Item Schema ─────────────────────────────────
 * Individual option within a service group (e.g. "Haircut for men ₹199")
 */
const serviceGroupItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },     // "Haircut for men"
  price: { type: Number, required: true, default: 0 },     // 199
  description: { type: String, trim: true, default: '' },  // Optional description
  duration: { type: String, trim: true, default: '' },     // "30 mins"
  isActive: { type: Boolean, default: true }
}, { _id: true });

/**
 * ─── Service Group Schema ──────────────────────────────────────
 * Sub-category within a package-based service (e.g. "Haircut", "Face care", "Massage")
 * Shown as icon buttons on user side. Each group has items user can choose from.
 */
const serviceGroupSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },     // "Haircut"
  iconUrl: { type: String, default: null },                 // Icon image URL
  order: { type: Number, default: 0 },                     // Display order
  items: { type: [serviceGroupItemSchema], default: [] },   // Options within group
  allowSkip: { type: Boolean, default: true }               // Allow "I don't need X" option
}, { _id: true });

/**
 * ─── Package Included Item Schema ──────────────────────────────
 * References which service group + item is included in a package
 */
const packageIncludedItemSchema = new mongoose.Schema({
  serviceGroupId: { type: mongoose.Schema.Types.ObjectId },         // Ref to serviceGroup._id
  serviceGroupTitle: { type: String, trim: true, default: '' },     // Denormalized: "Haircut"
  selectedItemId: { type: mongoose.Schema.Types.ObjectId },         // Ref to default selected item._id
  selectedItemTitle: { type: String, trim: true, default: '' },     // Denormalized: "Haircut for men"
  selectedItemDescription: { type: String, trim: true, default: '' } // Brief desc shown in package card
}, { _id: true });

/**
 * ─── Package Schema — Salon-style combo packages ───────────────
 * e.g. "Haircut + Beard grooming + Massage" with discount pricing
 */
const packageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, default: 0 },       // Final discounted price
  originalPrice: { type: Number, default: null },              // MRP / strikethrough price
  discountPercentage: { type: Number, default: 0 },            // e.g. 10 for "10% off"
  duration: { type: String, trim: true },                      // e.g. "2-3 hours"
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: String, default: '1.0k' },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  allowUserEdit: { type: Boolean, default: true },
  // Which service groups + items are included in this package
  includedItems: { type: [packageIncludedItemSchema], default: [] },
  // Price matrix fields
  gstPercentage: { type: Number, default: 18 },
  gstIncluded: { type: Boolean, default: true },
  vendorPayout: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 20 },
  // Subscription fields (for subscription_base reuse)
  visitsCredits: { type: Number, default: null },
  bookingDiscount: { type: Number, default: null },
  freeInspection: { type: Boolean, default: false },
  prioritySupport: { type: Boolean, default: false },
  memberPricing: { type: Boolean, default: false },
  visitFrequency: { type: String, default: null }
}, { _id: true });

const variantSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },       // e.g. "Male Therapist"
  category: { type: String, trim: true, default: '' },       // Grouping of variants (addons)
  extraPrice: { type: Number, default: 0 },                  // Extra ₹ added to base price
  description: { type: String, trim: true, default: '' },    // Optional short description
  isActive: { type: Boolean, default: true },
  gstPercentage: { type: Number, default: 18 },
  gstIncluded: { type: Boolean, default: true },
  platformCommission: { type: Number, default: 20 },
  l1Commission: { type: Number, default: 10 },
  l2Commission: { type: Number, default: 15 },
  l3Commission: { type: Number, default: 20 }
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
  rating: {
    type: Number,
    default: 4.5
  },
  reviewCount: {
    type: String,
    default: '1.2k'
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
    enum: ['minute_base', 'package_base', 'image_base', 'multi_visit', 'dynamic_base', 'subscription_base'],
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

  // ─── Service Groups (for package_base — salon-style sub-categories) ──
  // e.g. "Haircut", "Face care", "Massage" — each with selectable items
  serviceGroups: {
    type: [serviceGroupSchema],
    default: []
  },

  // ─── Service Variants (optional add-ons) ─────────────────────
  // e.g. Male Therapist (+₹50), Aromatherapy Oil (+₹80), etc.
  variants: {
    type: [variantSchema],
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
