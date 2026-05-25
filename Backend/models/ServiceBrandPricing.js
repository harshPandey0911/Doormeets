const mongoose = require('mongoose');

const serviceBrandPricingSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    index: true,
    default: null
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    index: true,
    default: null
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  gstPercentage: {
    type: Number,
    required: true,
    default: 18,
    min: 0
  },
  gstAmount: {
    type: Number,
    required: true,
    min: 0
  },
  vendorProfit: {
    type: Number,
    required: true,
    min: 0
  },
  finalCustomerPrice: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

// Ensure only one pricing matrix entry per category/sub/service/brand combo
serviceBrandPricingSchema.index(
  { categoryId: 1, subCategoryId: 1, serviceId: 1, brandId: 1 },
  { unique: true }
);

// Pre-save hook to auto-calculate derived fields if not explicitly provided
serviceBrandPricingSchema.pre('validate', function(next) {
  if (this.basePrice !== undefined && this.gstPercentage !== undefined) {
    // Basic calculation if we want to ensure data consistency
    this.gstAmount = (this.basePrice * this.gstPercentage) / 100;
    
    // In our specific requirements, VendorProfit + CompanyProfit/Base + GST = Final
    // Or simpler: basePrice + gstAmount = finalCustomerPrice
    // Wait, the prompt says: Base Price = 1000, GST = 120, Vendor Profit = 200, Final = 1320.
    // That means: Base Price + GST + Vendor Profit = Final Price
    // Or Base Price IS the company portion, and Vendor Profit is separate?
    // Let's adopt a simple approach: finalCustomerPrice = basePrice + gstAmount + vendorProfit
    
    this.finalCustomerPrice = this.basePrice + this.gstAmount + (this.vendorProfit || 0);
  }
  next();
});

module.exports = mongoose.model('ServiceBrandPricing', serviceBrandPricingSchema);
