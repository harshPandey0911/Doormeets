const mongoose = require('mongoose');

const paintBrandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  logo: { type: String, default: null },
  description: { type: String, default: '' },
  status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaintBrand', paintBrandSchema);
