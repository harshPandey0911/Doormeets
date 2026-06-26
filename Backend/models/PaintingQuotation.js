const mongoose = require('mongoose');

const paintingQuotationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Nullable if generated offline
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  interiorArea: { type: Number, default: 0 },
  exteriorArea: { type: Number, default: 0 },
  interiorPaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintProduct', default: null },
  exteriorPaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintProduct', default: null },
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourRate', default: null },
  calculation: {
    paintCost: { type: Number, default: 0 },
    puttyCost: { type: Number, default: 0 },
    primerCost: { type: Number, default: 0 },
    labourCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'EXPIRED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('PaintingQuotation', paintingQuotationSchema);
