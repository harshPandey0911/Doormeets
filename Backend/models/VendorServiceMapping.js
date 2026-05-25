const mongoose = require('mongoose');

const vendorServiceMappingSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true
  },
  supportedBrandIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  }],
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// A vendor can only map a specific service once (brands are inside the array)
vendorServiceMappingSchema.index(
  { vendorId: 1, serviceId: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('VendorServiceMapping', vendorServiceMappingSchema);
