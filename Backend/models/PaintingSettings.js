const mongoose = require('mongoose');

const paintingSettingsSchema = new mongoose.Schema({
  profileName: {
    type: String,
    required: true,
    unique: true
  },
  profileCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMIT_FOR_REVIEW', 'REVIEWED', 'APPROVED', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  currentVersion: {
    type: Number,
    default: 1
  },
  publishedVersion: {
    type: Number,
    default: 0
  },
  activeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaintingSettingsVersion',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('PaintingSettings', paintingSettingsSchema);
