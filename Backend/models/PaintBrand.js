const mongoose = require('mongoose');

const paintBrandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  logo: {
    url: { type: String, default: null },
    publicId: { type: String, default: null }
  },
  description: { type: String, default: '' },
  status: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
}, { timestamps: true });

// Partial indexes to ensure uniqueness only among active (non-deleted) brands
paintBrandSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
paintBrandSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.model('PaintBrand', paintBrandSchema);

