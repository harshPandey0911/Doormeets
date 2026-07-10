const mongoose = require('mongoose');

/**
 * VendorDashboardContent — Admin-managed media content for the Vendor App dashboard.
 * Supports image and video banners with optional redirection link targets.
 */
const vendorDashboardContentSchema = new mongoose.Schema({
  banners: [{
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    imageUrl: { type: String, default: '' },       // Banner image
    videoUrl: { type: String, default: '' },       // YouTube ID/URL or direct video URL
    videoSource: {
      type: String,
      enum: ['youtube', 'cloudinary', 'external'],
      default: 'youtube'
    },
    linkType: {
      type: String,
      enum: ['none', 'url', 'category', 'subcategory'],
      default: 'none'
    },
    linkUrl: { type: String, default: '' },       // Custom redirect URL
    targetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    targetSubCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      default: null
    },
    bgColor: { type: String, default: '#F3F4F6' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('VendorDashboardContent', vendorDashboardContentSchema);
