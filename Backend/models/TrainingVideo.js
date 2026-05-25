const mongoose = require('mongoose');

/**
 * TrainingVideo — Admin-managed video content for vendor onboarding.
 * Videos can be YouTube embeds or any direct URL (Cloudinary, Vimeo, etc.).
 */
const trainingVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // YouTube video ID (e.g. "dQw4w9WgXcQ") OR full URL
  videoUrl: {
    type: String,
    required: [true, 'Video URL or YouTube ID is required'],
    trim: true
  },
  // Source type determines how the frontend renders it
  videoSource: {
    type: String,
    enum: ['youtube', 'cloudinary', 'external'],
    default: 'youtube'
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  // Estimated duration in seconds (used for watch-time validation)
  durationSeconds: {
    type: Number,
    default: 300 // 5 minutes default
  },
  // If true, vendor must watch this video before taking the test
  isRequired: {
    type: Boolean,
    default: true
  },
  // Display order (lower = shown first)
  order: {
    type: Number,
    default: 0
  },
  // Optional: per-category training (null = global, applies to all vendors)
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Stats
  totalViews: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

trainingVideoSchema.index({ isActive: 1, order: 1 });
trainingVideoSchema.index({ categoryId: 1, isActive: 1 });

module.exports = mongoose.model('TrainingVideo', trainingVideoSchema);
