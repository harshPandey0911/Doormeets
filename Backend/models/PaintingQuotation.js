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

const openingSchema = new mongoose.Schema({
  type: { type: String, default: 'Door' }, // Door, Window, French Window, Sliding Window, Ventilator, Arch, Custom
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  paint: { type: Boolean, default: false },
  frameMaterial: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { _id: false });

const paintItemSchema = new mongoose.Schema({
  name: { type: String, default: '' }, // Door, Window, Grill, Railing, Cupboard, Wardrobe, False Ceiling, Beam, Column, TV Unit, Cabinet, Shelf, Custom
  quantity: { type: Number, default: 1 },
  unitArea: { type: Number, default: 0 },
  totalArea: { type: Number, default: 0 },
  itemType: { type: String, default: 'Custom' }
}, { _id: false });

const wallSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  width: { type: Number, default: 0 }, // Represents Wall Length
  height: { type: Number, default: 0 },
  thickness: { type: Number, default: 0 },
  wallType: { type: String, default: 'Standard' }, // Standard, Partition, Exterior, Curved, Glass, Feature, Texture
  material: { type: String, default: 'Concrete' }, // Concrete, Brick, POP, Gypsum, Wood, Metal, Glass
  condition: { type: String, default: 'Good' }, // Excellent, Good, Average, Damp, Peeling, Cracked, Seepage
  openings: [openingSchema],
  saved: { type: Boolean, default: false }
}, { _id: false });

const roomQuoteSchema = new mongoose.Schema({
  name: { type: String, default: 'Room' },
  roomCode: { type: String, default: 'CUSTOM' },
  sqft: { type: Number, default: 0 },
  paintType: { type: String, default: '' },
  finish: { type: String, default: '' },
  paintCost: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  breakdown: [breakdownItemSchema],
  walls: [wallSchema],
  paintItems: [paintItemSchema],
  ceiling: {
    included: { type: Boolean, default: false },
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 }
  },
  measurementMode: { type: String, default: 'DIMENSIONS' }, // DIMENSIONS, WALLS, FLOOR_PLAN, MANUAL
  roomProgress: { type: Number, default: 0 },
  photos: {
    before: [{ type: String }],
    damage: [{ type: String }],
    reference: [{ type: String }],
    after: [{ type: String }],
    video: { type: String, default: '' }
  },
  calculationBreakdown: {
    grossWallArea: { type: Number, default: 0 },
    doorDeduction: { type: Number, default: 0 },
    windowDeduction: { type: Number, default: 0 },
    cabinetDeduction: { type: Number, default: 0 },
    tileDeduction: { type: Number, default: 0 },
    mirrorDeduction: { type: Number, default: 0 },
    ventilatorDeduction: { type: Number, default: 0 },
    wallpaperDeduction: { type: Number, default: 0 },
    textureArea: { type: Number, default: 0 },
    featureWallArea: { type: Number, default: 0 },
    doorPaintArea: { type: Number, default: 0 },
    windowPaintArea: { type: Number, default: 0 },
    grillPaintArea: { type: Number, default: 0 },
    ceilingArea: { type: Number, default: 0 },
    additionalPaintItems: { type: Number, default: 0 },
    netPaintableArea: { type: Number, default: 0 }
  },
  vendorOverride: {
    overrideActive: { type: Boolean, default: false },
    manualArea: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    photoEvidence: [{ type: String }],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
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
  packBreakdown: [{
    size: { type: Number, required: true },
    count: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  appliedArea: { type: Number, required: true }, // the specific paintable area applied to
  coats: { type: Number, default: 2 },
  roundingMethodUsed: { type: String }
}, { _id: false });

const labourSnapshotSchema = new mongoose.Schema({
  labourRateId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourRate', required: true },
  workType: { type: String, required: true },
  pricePerSqFt: { type: Number, required: true },
  area: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  labourMethodUsed: { type: String },
  premiumPercentageApplied: { type: Number, default: 0 }
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
      'REVISION_REQUESTED',
      'ADMIN_APPROVED', 
      'ADMIN_REJECTED', 
      'SENT_TO_CUSTOMER', 
      'CUSTOMER_ACCEPTED', 
      'CUSTOMER_REJECTED', 
      'EXPIRED', 
      'CONVERTED_TO_ORDER'
    ], 
    default: 'DRAFT' 
  },
  currentVersion: { type: Number, default: 1 },
  versions: [{
    version: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    changedByName: { type: String, default: '' },
    changedByType: { type: String, enum: ['ADMIN', 'VENDOR', 'SYSTEM'], required: true },
    changeSummary: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    snapshot: {
      property: { type: Object },
      products: { type: Array },
      labour: { type: Array },
      additionalCharges: { type: Array },
      discount: { type: Object },
      gst: { type: Object },
      summary: { type: Object },
      remarks: { type: Object },
      attachments: { type: Object }
    }
  }],
  settingsProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaintingSettings', default: null },
  settingsVersion: { type: Number, default: 1 },
  settingsSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  calculationVersion: { type: String, default: '1.1.0' },
  calculationTimestamp: { type: Date },
  engineVersion: { type: String, default: '1.1.0' },
  calculationDurationMs: { type: Number },
  validationResults: { type: mongoose.Schema.Types.Mixed, default: null },
  validationWarnings: { type: mongoose.Schema.Types.Mixed, default: null },
  review: {
    status: { type: String, default: null },
    adminRemarks: { type: String, default: '' },
    internalNotes: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    revisionReason: { type: String, default: '' },
    reviewStartedAt: { type: Date, default: null },
    reviewCompletedAt: { type: Date, default: null }
  },
  customerSharedAt: { type: Date, default: null },
  customerViewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectedAt: { type: Date, default: null },
  revisionRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  revisionRequestedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('PaintingQuotation', paintingQuotationSchema);
