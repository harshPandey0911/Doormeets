const mongoose = require('mongoose');

/**
 * VendorDashboardContent — Admin-managed content for the Vendor App dashboard.
 * Supports banners (image/promo), announcement cards, and videos shown to vendors.
 */
const vendorDashboardContentSchema = new mongoose.Schema({
  // Banners shown at the top of vendor dashboard (image carousels / promo strips)
  banners: [{
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    linkUrl: { type: String, default: '' },       // External URL on tap
    linkType: {
      type: String,
      enum: ['none', 'url', 'training', 'subscription', 'earnings'],
      default: 'none'
    },
    bgColor: { type: String, default: '#FF6B00' }, // Fallback bg color
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],

  // Announcement / notice cards shown as a scrollable list
  announcements: [{
    title: { type: String, required: true },
    body: { type: String, default: '' },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'urgent'],
      default: 'info'
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },      // Auto-hide after date
    order: { type: Number, default: 0 }
  }],

  // Videos (YouTube / Cloudinary / external links) shown in a vendor tips section
  videos: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    videoSource: {
      type: String,
      enum: ['youtube', 'cloudinary', 'external'],
      default: 'youtube'
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],

  // Quick links shown as icon grid on vendor dashboard
  quickLinks: [{
    label: { type: String, required: true },
    icon: { type: String, default: 'link' },       // icon name string
    linkUrl: { type: String, default: '' },
    bgColor: { type: String, default: '#F97316' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],

  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('VendorDashboardContent', vendorDashboardContentSchema);
