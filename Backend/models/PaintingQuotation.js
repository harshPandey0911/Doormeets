const mongoose = require('mongoose');

// --- Legacy Sub-schemas (kept for backward compatibility) ---
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

// --- New Model Specifications ---

const productSnapshotSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintProduct', required: true },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintBrand', required: true },
  productName: { type: String, required: true },
  productCode: { type: String, required: true },
  productType: { type: String, enum: ['Paint', 'Primer', 'Putty'], required: true },
  selectedPackSize: {
    size: { type: Number, required: true },
    unit: { type: String, required: true }
  },
  coverage: { type: Number, required: true }, // numerical sq.ft/L or sq.ft/Kg coverage
  unitPrice: { type: Number, required: true },
  quantityRequired: { type: Number, required: true }, // dynamically calculated
  quantityPurchased: { type: Number, required: true }, // calculated pack count
  subtotal: { type: Number, required: true },
  appliedArea: { type: Number, required: true } // the specific paintable area applied to
}, { _id: false });

const labourSnapshotSchema = new mongoose.Schema({
  labourRateId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourRate', required: true },
  workType: { type: String, required: true },
  pricePerSqFt: { type: Number, required: true },
  area: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: false });

const additionalChargeSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. Transportation, Scaffolding, Wall Repair, Texture Work
  amount: { type: Number, required: true, default: 0 },
  remarks: { type: String, default: '' }
}, { _id: false });

const discountDetailsSchema = new mongoose.Schema({
  type: { type: String, enum: ['FLAT', 'PERCENTAGE', 'NONE'], default: 'NONE' },
  value: { type: Number, default: 0 },
  reason: { type: String, default: '' }
}, { _id: false });

const gstDetailsSchema = new mongoose.Schema({
  gstPercentage: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 }
}, { _id: false });

const summarySchema = new mongoose.Schema({
  materialCost: { type: Number, default: 0 },
  labourCost: { type: Number, default: 0 },
  additionalCharges: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 }
}, { _id: false });

const remarksSchema = new mongoose.Schema({
  vendorRemarks: { type: String, default: '' },
  customerRemarks: { type: String, default: '' },
  adminRemarks: { type: String, default: '' }
}, { _id: false });

const attachmentsSchema = new mongoose.Schema({
  inspectionPhotos: [{ type: String }],
  beforePhotos: [{ type: String }],
  referenceImages: [{ type: String }]
}, { _id: false });

const propertyDetailsSchema = new mongoose.Schema({
  propertyType: { type: String, default: '' },
  interiorArea: { type: Number, default: 0 },
  exteriorArea: { type: Number, default: 0 },
  ceilingArea: { type: Number, default: 0 },
  balconyArea: { type: Number, default: 0 },
  totalPaintableArea: { type: Number, default: 0 }
}, { _id: false });

const paintingQuotationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customerName: { type: String, required: false },
  customerPhone: { type: String, required: false },

  // New Property Breakdown fields
  property: propertyDetailsSchema,

  // New Snapshot Lists
  products: [productSnapshotSchema],
  labour: [labourSnapshotSchema],

  // New Pricing Components
  additionalCharges: [additionalChargeSchema],
  discount: discountDetailsSchema,
  gst: gstDetailsSchema,
  summary: summarySchema,
  remarks: remarksSchema,
  attachments: attachmentsSchema,

  // Legacy simple fields (kept for backward compat)
  interiorArea: { type: Number, default: 0 },
  exteriorArea: { type: Number, default: 0 },
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
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },

  // Final pricing (Screen 9, 20)
  couponCode: { type: String, default: '' },
  loyaltyDiscount: { type: Number, default: 0 },  // percentage 0-15
  taxAmount: { type: Number, default: 0 },
  estimatedWorkDays: { type: Number, default: 3 },
  numberOfPainters: { type: Number, default: 2 },

  // Legacy calculation (kept to avoid breakage in any other routes)
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

  status: { 
    type: String, 
    enum: [
      'DRAFT', 
      'SUBMITTED_TO_ADMIN', 
      'UNDER_REVIEW', 
      'ADMIN_APPROVED', 
      'ADMIN_REJECTED', 
      'SENT_TO_CUSTOMER', 
      'CUSTOMER_ACCEPTED', 
      'CUSTOMER_REJECTED', 
      'EXPIRED', 
      'CONVERTED_TO_ORDER'
    ], 
    default: 'DRAFT' 
  }
}, { timestamps: true });

module.exports = mongoose.model('PaintingQuotation', paintingQuotationSchema);
