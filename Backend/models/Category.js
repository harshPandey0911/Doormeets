const mongoose = require('mongoose');
const { SERVICE_STATUS } = require('../utils/constants');

/**
 * Category Model
 * Represents service categories (e.g., Electrician, Plumber, Salon, etc.)
 */
const categorySchema = new mongoose.Schema({
  // Frontend matching fields
  title: {
    type: String,
    required: [true, 'Please provide a category title'],
    trim: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  categoryType: {
    type: String,
    enum: ['service', 'product'],
    default: 'service',
    index: true
  },
  homeIconUrl: {
    type: String,
    default: null
  },
  homeBadge: {
    type: String,
    default: null,
    trim: true
  },
  hasSaleBadge: {
    type: Boolean,
    default: false
  },
  showOnHome: {
    type: Boolean,
    default: true,
    index: true
  },
  hasBrands: {
    type: Boolean,
    default: true
  },
  hasSubCategory: {
    type: Boolean,
    default: true
  },
  hasBrand: {
    type: Boolean,
    default: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryTemplate',
    default: null,
    index: true
  },
  enableBrands: {
    type: Boolean,
    default: false
  },
  brandRequired: {
    type: Boolean,
    default: false
  },
  enableConsultantBooking: {
    type: Boolean,
    default: false
  },
  enableWarranty: {
    type: Boolean,
    default: false
  },
  enableMultiVisit: {
    type: Boolean,
    default: false
  },
  enablePricingMatrix: {
    type: Boolean,
    default: true
  },
  isBiddingEnabled: {
    type: Boolean,
    default: false
  },
  homeOrder: {
    type: Number,
    default: 0,
    index: true
  },
  // Cities where this category is available
  cityIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    index: true
  }],
  // Additional backend fields
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: Object.values(SERVICE_STATUS),
    default: SERVICE_STATUS.ACTIVE,
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false,
    index: true
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
    index: true
  },
  interestedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  // Group Category (Urban Company style: one card shows multiple categories)
  isGroupCategory: {
    type: Boolean,
    default: false,
    index: true
  },
  mappedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }]
}, {
  timestamps: true
});

// Generate slug from title before validation
categorySchema.pre('validate', async function (next) {
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

// Index for faster queries
categorySchema.index({ status: 1, homeOrder: 1 });
categorySchema.index({ isPopular: 1, status: 1 });
categorySchema.index({ showOnHome: 1, homeOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);

