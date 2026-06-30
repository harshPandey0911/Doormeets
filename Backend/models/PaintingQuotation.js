const mongoose = require('mongoose');

const breakdownItemSchema = new mongoose.Schema({
  category: { type: String, enum: ['CEILING', 'WALLS', 'ADD_ONS', 'OTHERS'], default: 'WALLS' },
  product: { type: String, default: '' },
  cost: { type: Number, default: 0 }
}, { _id: false });

const windowDoorSchema = new mongoose.Schema({
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 }
}, { _id: false });

const wallSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  windows: [windowDoorSchema],
  doors: [windowDoorSchema],
  wardrobes: [windowDoorSchema],
  surfaceCondition: {
    dampness: { type: Boolean, default: false },
    crackFilling: { type: Boolean, default: false }
  },
  saved: { type: Boolean, default: false }
}, { _id: false });

const roomQuoteSchema = new mongoose.Schema({
  name: { type: String, default: 'Room' },
  sqft: { type: Number, default: 0 },
  paintType: { type: String, default: '' },
  finish: { type: String, default: '' },
  paintCost: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  breakdown: [breakdownItemSchema],
  walls: [wallSchema],
  ceiling: {
    included: { type: Boolean, default: false },
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 }
  },
  repairType: { type: String, default: 'paint_only' }
}, { _id: false });

const additionalServiceSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  unit: { type: String, default: 'sqft' },
  quantity: { type: Number, default: 0 },
  cost: { type: Number, default: 0 }
}, { _id: false });

const woodPolishSchema = new mongoose.Schema({
  finish: { type: String, enum: ['GLOSSY', 'MATTE'], default: 'GLOSSY' },
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  area: { type: Number, default: 0 },
  shade: { type: String, default: '' },
  cost: { type: Number, default: 0 }
}, { _id: false });

const enamelItemSchema = new mongoose.Schema({
  product: { type: String, default: '' },
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  area: { type: Number, default: 0 },
  shade: { type: String, default: '' },
  cost: { type: Number, default: 0 }
}, { _id: false });

const paintingQuotationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },

  // Legacy simple fields (kept for backward compat)
  interiorArea: { type: Number, default: 0 },
  exteriorArea: { type: Number, default: 0 },

  // Rich vendor-side data (Screen 5 — Generate Bill & Quote)
  timeline: { type: String, default: '' },       // e.g. "3-5 Days"
  finishing: { type: String, default: '' },      // e.g. "Premium Emulsion"
  vendorNotes: { type: String, default: '' },

  // Painter details (Screen 8)
  painterDetails: {
    name: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    badge: { type: String, default: 'Pro-Level Artisan' },
    photoUrl: { type: String, default: '' }
  },

  // Room-by-room breakdown (Screens 13, 15)
  rooms: [roomQuoteSchema],

  // Additional services (Screens 5, 7, 16)
  additionalServices: [additionalServiceSchema],

  // Wood & Enamel services (Screen 16)
  woodEnamel: {
    woodPolish: [woodPolishSchema],
    enamelItems: [enamelItemSchema]
  },

  // Material logistics (Screen 13)
  materials: {
    wallPaintLiters: { type: Number, default: 0 },
    primerLiters: { type: Number, default: 0 }
  },

  // Legacy paint refs
  interiorPaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintProduct', default: null },
  exteriorPaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintProduct', default: null },
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourRate', default: null },

  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintingConsultation', default: null },

  // Final pricing (Screen 9, 20)
  couponCode: { type: String, default: '' },
  loyaltyDiscount: { type: Number, default: 0 },  // percentage 0-15
  taxAmount: { type: Number, default: 0 },
  estimatedWorkDays: { type: Number, default: 3 },
  numberOfPainters: { type: Number, default: 2 },

  calculation: {
    paintCost: { type: Number, default: 0 },
    puttyCost: { type: Number, default: 0 },
    primerCost: { type: Number, default: 0 },
    labourCost: { type: Number, default: 0 },
    additionalServicesCost: { type: Number, default: 0 },
    woodEnamelCost: { type: Number, default: 0 },
    materialsCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    loyaltyDiscountAmount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
  },

  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'EXPIRED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('PaintingQuotation', paintingQuotationSchema);
