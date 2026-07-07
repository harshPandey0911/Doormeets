const mongoose = require('mongoose');

const roomLibrarySchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true } // Bed, Living, Kitchen, Toilet, Exterior, Custom
}, { _id: false });

const featureLibrarySchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true }, // checkbox, areaInput, dropdown, photoUpload
  formulaKey: { type: String, default: null } // RECTANGLE, WALL, ARCH, COLUMN, etc.
}, { _id: false });

const roomConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomCode: { type: String, required: true },
  required: { type: Boolean, default: false },
  features: [{
    featureCode: { type: String, required: true },
    enabled: { type: Boolean, default: false }
  }]
}, { _id: false });

const exteriorZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // Elevation, Compound, Balcony, Terrace, Garage
  supportsMeasurements: { type: Boolean, default: true }
}, { _id: false });

const propertyTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Residential', 'Commercial', 'Industrial', 'Hospitality', 'Custom'],
    default: 'Residential'
  },
  status: {
    type: String,
    enum: ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  defaultScope: {
    type: String,
    enum: ['INTERIOR', 'EXTERIOR', 'BOTH'],
    default: 'BOTH'
  },
  roomLibrary: {
    type: [roomLibrarySchema],
    default: []
  },
  featureLibrary: {
    type: [featureLibrarySchema],
    default: []
  },
  rooms: {
    type: [roomConfigSchema],
    default: []
  },
  exteriorZones: {
    type: [exteriorZoneSchema],
    default: []
  },
  version: {
    type: Number,
    default: 1
  },
  versions: [{
    version: { type: Number, required: true },
    rooms: [roomConfigSchema],
    exteriorZones: [exteriorZoneSchema],
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changeSummary: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('PropertyTemplate', propertyTemplateSchema);
