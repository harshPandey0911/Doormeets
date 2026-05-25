const mongoose = require('mongoose');

/**
 * VendorCategoryRequest Model
 * Vendors can request admin to add a new category.
 */
const vendorCategoryRequestSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  categoryName: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  adminNote: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

vendorCategoryRequestSchema.index({ status: 1, createdAt: -1 });
vendorCategoryRequestSchema.index({ vendorId: 1, status: 1 });

module.exports = mongoose.model('VendorCategoryRequest', vendorCategoryRequestSchema);
