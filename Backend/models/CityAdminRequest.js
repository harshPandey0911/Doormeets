const mongoose = require('mongoose');

/**
 * CityAdminRequest Model
 * 
 * When a City Admin proposes adding a category, brand, or pricing override,
 * it is stored here with status 'pending' until a Super Admin reviews it.
 * 
 * On approval → the actual record is created (Category, Brand, etc.)
 * On rejection → request is marked rejected with a reason
 */
const cityAdminRequestSchema = new mongoose.Schema({
  // Who made the request
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  requestedByName: {
    type: String,
    required: true
  },

  // Which city this request is for
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  cityName: {
    type: String
  },

  // Type of request
  requestType: {
    type: String,
    enum: ['category', 'brand', 'pricing_override', 'banner', 'homepage_content'],
    required: true
  },

  // The proposed data (stored as JSON blob to support any request type)
  proposedData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Status lifecycle: pending → approved / rejected
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },

  // Super Admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },

  // Reference to the created document after approval (e.g., Category._id)
  createdDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  createdDocumentModel: {
    type: String,
    default: null // 'Category', 'Brand', etc.
  },

  // Optional note from city admin
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for common queries
cityAdminRequestSchema.index({ status: 1, createdAt: -1 });
cityAdminRequestSchema.index({ requestedBy: 1, status: 1 });
cityAdminRequestSchema.index({ cityId: 1, status: 1 });

module.exports = mongoose.model('CityAdminRequest', cityAdminRequestSchema);
