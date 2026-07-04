const mongoose = require('mongoose');

const paintProductSchema = new mongoose.Schema({
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintBrand', required: true },
  productName: { type: String, required: true, trim: true },
  productCode: { type: String, required: true, trim: true, uppercase: true },
  sku: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, default: '' },
  
  application: { 
    type: String, 
    enum: ['Interior', 'Exterior', 'Universal'], 
    required: true 
  },
  productType: { 
    type: String, 
    enum: ['Paint', 'Primer', 'Putty'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['Economy', 'Premium', 'Luxury'], 
    required: true 
  },
  finish: { 
    type: String, 
    enum: ['Matte', 'Soft Sheen', 'Satin', 'Gloss', 'Textured'], 
    required: true 
  },
  
  availablePackSizes: [{
    size: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, trim: true } // e.g. "Litre", "Kg"
  }],
  
  coverage: {
    value: { type: Number, required: true, min: 0.1 },
    unit: { type: String, required: true, trim: true } // e.g. "Sq.Ft/Litre", "Sq.Ft/Bag"
  },
  
  price: { type: Number, required: true, min: 0.01 },
  taxPercentage: { type: Number, default: 18, min: 0 },
  warrantyYears: { type: Number, default: 0, min: 0 },
  washable: { type: Boolean, default: false },
  
  features: [{ type: String, trim: true }],
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  }],
  
  status: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isRecommended: { type: Boolean, default: false },
  visibleToVendor: { type: Boolean, default: true },
  internalNotes: { type: String, default: '' },
  
  displayOrder: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
}, { timestamps: true });

// Partial indexes for active uniqueness
paintProductSchema.index(
  { productCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
paintProductSchema.index(
  { sku: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('PaintProduct', paintProductSchema);

