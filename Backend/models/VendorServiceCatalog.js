const mongoose = require('mongoose');
const { SERVICE_STATUS } = require('../utils/constants');

/**
 * Vendor Service Catalog Model
 * Represents services that vendors can add to their bill
 */
const vendorServiceCatalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a service name'],
    trim: true,
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  serviceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    index: true
  }],
  customerPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  vendorPayoutBase: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: 0
  },
  // Dynamic tax/commission config — mirrors PricingConfig so an add-on picked from this central
  // library is settled through the exact same cascade as the originally booked service, instead
  // of a hardcoded flat GST%. 0/undefined falls back to global Settings at bill time.
  gstPercentage: {
    type: Number,
    default: 18,
    min: 0
  },
  vendorSgstPercentage: {
    type: Number,
    default: 2.5,
    min: 0
  },
  vendorCgstPercentage: {
    type: Number,
    default: 2.5,
    min: 0
  },
  platformCommission: {
    type: Number,
    default: 0,
    min: 0
  },
  l1Commission: {
    type: Number,
    default: 0,
    min: 0
  },
  l2Commission: {
    type: Number,
    default: 0,
    min: 0
  },
  l3Commission: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(SERVICE_STATUS),
    default: SERVICE_STATUS.ACTIVE,
    index: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VendorServiceCatalog', vendorServiceCatalogSchema);
