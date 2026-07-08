const mongoose = require('mongoose');

const paintingSettingsVersionSchema = new mongoose.Schema({
  settingsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaintingSettings',
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  snapshot: {
    // General Settings
    gstPercentage: { type: Number, default: 18 },
    defaultWarrantyYears: { type: Number, default: 2 },
    quotationValidityDays: { type: Number, default: 30 },
    companyMarginPercent: { type: Number, default: 15 },
    currency: { type: String, default: 'INR' },
    areaUnit: { type: String, default: 'sqft' },

    // Material Rules
    primerBuffer: { type: Number, default: 10 },
    puttyBuffer: { type: Number, default: 10 },
    paintBuffer: { type: Number, default: 10 },
    textureBuffer: { type: Number, default: 10 },
    waterproofingBuffer: { type: Number, default: 10 },
    materialBufferPercent: { type: Number, default: 10 },
    wastagePercent: { type: Number, default: 5 },
    coverageBufferPercent: { type: Number, default: 10 },

    // Pack Rules
    roundingMethod: {
      type: String,
      enum: ['ROUND_UP', 'ROUND_DOWN', 'NEAREST_PACK', 'CUSTOM_BUFFER'],
      default: 'ROUND_UP'
    },
    customBufferPercent: { type: Number, default: 0 },

    // Coverage Rules Matrix
    coverageRules: [{
      surfaceType: { type: String, required: true },
      paintCategory: { type: String, required: true },
      application: { type: String, enum: ['Interior', 'Exterior', 'Universal'], default: 'Interior' },
      condition: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor', 'Cracked', 'Damp', 'Peeling', 'Seepage'], default: 'Good' },
      coverageSqftPerLiter: { type: Number, required: true }
    }],

    // Labour Rules
    activeLabourMethod: {
      type: String,
      enum: ['PER_SQFT', 'PER_ROOM', 'PER_DAY', 'PER_TEAM'],
      default: 'PER_SQFT'
    },
    laborCoatMultipliers: {
      type: Map,
      of: Number,
      default: { '1': 0.6, '2': 1.0, '3': 1.3, '4': 1.6 }
    },

    // Coat Rules
    coatRules: [{
      category: { type: String, required: true }, // Economy, Premium, Luxury, Texture, Waterproof
      defaultPrimerCoats: { type: Number, default: 1 },
      defaultPaintCoats: { type: Number, default: 2 },
      defaultFinishCoats: { type: Number, default: 2 }
    }],

    // Booking Rules
    minArea: { type: Number, default: 50 },
    maxArea: { type: Number, default: 50000 },
    minLabourCharge: { type: Number, default: 1000 },
    minMaterialCharge: { type: Number, default: 1000 },
    emergencyBookingPremiumPercent: { type: Number, default: 20 },
    expressBookingPremiumPercent: { type: Number, default: 15 },
    consultationFee: { type: Number, default: 0 },
    consultationDuration: { type: String, default: '45 - 60 Minutes physical survey' },

    // Vendor Rules
    mandatoryPhotos: { type: Boolean, default: false },
    mandatoryMeasurements: { type: Boolean, default: false },
    mandatoryBeforeImages: { type: Boolean, default: false },
    mandatoryAfterImages: { type: Boolean, default: false },
    mandatorySelfie: { type: Boolean, default: false },
    mandatoryUniform: { type: Boolean, default: false },
    mandatoryOtp: { type: Boolean, default: false },
    mandatoryMaterialUsage: { type: Boolean, default: false },

    // Future Rules Extensibility
    futureRules: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMIT_FOR_REVIEW', 'REVIEWED', 'APPROVED', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  changeSummary: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  approvalNotes: {
    type: String,
    default: ''
  },
  rollbackFromVersion: {
    type: Number,
    default: null
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('PaintingSettingsVersion', paintingSettingsVersionSchema);
