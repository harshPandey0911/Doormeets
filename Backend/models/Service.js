const mongoose = require('mongoose');
const { SERVICE_STATUS } = require('../utils/constants');

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
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
    index: true
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
