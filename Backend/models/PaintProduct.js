const mongoose = require('mongoose');

const paintProductSchema = new mongoose.Schema({
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintBrand', required: true },
  application: { type: String, enum: ['INTERIOR', 'EXTERIOR'], required: true },
  productType: { type: String, enum: ['PAINT', 'PUTTY', 'PRIMER'], required: true },
  paintName: { type: String, required: true },
  category: { type: String, enum: ['ECONOMY', 'PREMIUM', 'SUPER_LUXURY', 'NOT_APPLICABLE'], default: 'NOT_APPLICABLE' },
  finish: { type: String, default: '' },
  unit: { type: String, default: '1L' }, // e.g. 1L, 40KG
  price: { type: Number, required: true, min: 0 },
  coverage: { type: Number, required: true, min: 1 }, // sqft per unit
  warranty: { type: String, default: '' },
  washable: { type: Boolean, default: false },
  status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaintProduct', paintProductSchema);
