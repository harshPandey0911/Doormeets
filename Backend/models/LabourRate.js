const mongoose = require('mongoose');

const labourRateSchema = new mongoose.Schema({
  workType: { type: String, required: true }, // e.g. FRESH, REGULAR, EXTERIOR
  application: { type: String, enum: ['INTERIOR', 'EXTERIOR'], required: true },
  includes: [{ type: String }], // Array of items included e.g. ["PUTTY", "PRIMER", "PAINT"]
  pricePerSqft: { type: Number, required: true, min: 0 },
  status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('LabourRate', labourRateSchema);
