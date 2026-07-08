const mongoose = require('mongoose');

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

const roomSchema = new mongoose.Schema({
  name: { type: String, default: 'Room' }, // "Bedroom", "Living Room", etc.
  roomCode: { type: String, default: 'CUSTOM' },
  finishStyle: { type: String, enum: ['LIGHT', 'DARK'], default: 'LIGHT' },
  repairType: { type: String, default: 'PRIMER' },
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  netArea: { type: Number, default: 0 },
  walls: [wallSchema],
  paintItems: [paintItemSchema],
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
  paintTier: { type: String, enum: ['ECONOMY', 'PREMIUM', 'LUXURY'], default: 'PREMIUM' },
  paintProduct: { type: String, default: '' },
  finish: { type: String, enum: ['MATT', 'SATIN', 'GLOSS'], default: 'MATT' },
  color: { type: String, default: '' },
  estimatedCost: { type: Number, default: 0 }
}, { _id: false });

const utilitySchema = new mongoose.Schema({
  type: { type: String, enum: ['DOORS', 'GRILLS', 'WINDOWS', 'PANELS'] },
  selected: { type: Boolean, default: false },
  enamelPainting: { type: Boolean, default: false },
  additionalService: { type: Boolean, default: false }
}, { _id: false });

const additionalServiceSchema = new mongoose.Schema({
  name: { type: String, default: '' },         // "Waterproofing", "POP Repair", "Wallpaper Removal"
  enabled: { type: Boolean, default: false },
  quantity: { type: Number, default: 1 },
  estimatedCost: { type: Number, default: 0 }
}, { _id: false });

const woodPolishItemSchema = new mongoose.Schema({
  finish: { type: String, enum: ['GLOSSY', 'MATTE'], default: 'GLOSSY' },
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  area: { type: Number, default: 0 },
  shade: { type: String, default: '' }
}, { _id: false });

const enamelPaintItemSchema = new mongoose.Schema({
  product: { type: String, default: '' },
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  area: { type: Number, default: 0 },
  shade: { type: String, default: '' }
}, { _id: false });

const wizardDataSchema = new mongoose.Schema({
  // Project Type — Interior vs Exterior (Screen 0)
  projectType: { type: String, enum: ['INTERIOR', 'EXTERIOR'], default: 'INTERIOR' },
  customAreaName: { type: String, default: '' },  // e.g., "North Terrace", "Pool Deck"
  surfaceCondition: { type: String, enum: ['GOOD', 'CRACKED', 'PEELING'], default: 'GOOD' },
  // Step 1 — Room Details (per room)
  rooms: [roomSchema],
  // Step 3 — Utilities Selection
  utilities: [utilitySchema],
  // Additional Services (Screen 6)
  additionalServices: [additionalServiceSchema],
  // Wood & Enamel Services (Screens 16, 17)
  woodEnamelServices: {
    woodPolish: [woodPolishItemSchema],
    enamelItems: [enamelPaintItemSchema]
  },
  // Step 4 — Brand & Summary
  paintBrand: { type: String, enum: ['ASIAN_PAINTS', 'DULUX', 'BERGER'], default: 'ASIAN_PAINTS' },
  upgradeOption: { type: String, enum: ['NONE', 'PREMIUM', 'LUXURY'], default: 'NONE' },
  estimatedTotal: { type: Number, default: 0 },
  // Step 5 — Finalize
  numberOfPainters: { type: Number, default: 2 },
  preferredStartDate: { type: Date, default: null },
  pModeStyle: { type: String, enum: ['ASSEMBLY', 'BASIC'], default: 'ASSEMBLY' },
  estimatedWorkDays: { type: Number, default: 3 },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 }
}, { _id: false });

// ─────────────── Tracking Sub-Document ───────────────
const trackingSchema = new mongoose.Schema({
  // Arrival OTP (sent to user's phone, vendor asks user for it to prove physical presence)
  arrivalOtp: { type: String, default: null },
  arrivalOtpExpiresAt: { type: Date, default: null },
  arrivalOtpVerified: { type: Boolean, default: false },
  arrivalOtpVerifiedAt: { type: Date, default: null },

  // Arrival Evidence
  arrivalPhotoUrls: [{ type: String }],
  arrivalGeoLat: { type: Number, default: null },
  arrivalGeoLng: { type: Number, default: null },

  // Completion OTP (sent to user after inspection, vendor enters to confirm work done)
  completionOtp: { type: String, default: null },
  completionOtpExpiresAt: { type: Date, default: null },
  completionOtpVerified: { type: Boolean, default: false },
  completionOtpVerifiedAt: { type: Date, default: null },

  // Inspection Photos (uploaded by vendor after inspection walk-through)
  inspectionPhotoUrls: [{ type: String }],

  // Key timestamps for the full flow
  vendorAcceptedAt: { type: Date, default: null },
  vendorEnRouteAt: { type: Date, default: null },
  inspectionStartedAt: { type: Date, default: null },
  inspectionCompletedAt: { type: Date, default: null }
}, { _id: false });

const paintingConsultationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // Denormalized for quick OTP SMS sending without extra DB lookups
  userPhone: { type: String, default: '' },

  propertyType: { 
    type: String, 
    required: true 
    // e.g., '1BHK', '2BHK', '3BHK', 'Villa', 'Commercial'
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    fullAddress: String
  },

  // ─── Booking Type ────────────────────────────────────
  bookingType: {
    type: String,
    enum: ['INSTANT', 'SCHEDULED'],
    default: 'INSTANT'
    // INSTANT  → vendor assigned ASAP (within 2-4 hrs)
    // SCHEDULED → user picked a date + time slot
  },
  scheduledSlot: {
    date: { type: Date, default: null },         // e.g. 2026-07-10
    timeSlot: { type: String, default: '' }      // e.g. "10:00 AM - 12:00 PM"
  },

  // Rich wizard data collected during 5-step user flow
  wizardData: wizardDataSchema,

  status: { 
    type: String, 
    enum: [
      'PENDING',                // Broadcast to vendors
      'ACCEPTED_BY_VENDOR',     // A vendor has picked it up
      'VENDOR_EN_ROUTE',        // Vendor marked on their way to location
      'INSPECTION_IN_PROGRESS', // Arrival OTP verified — inspection underway
      'QUOTE_GENERATED',        // Vendor submitted a quote → pending admin review
      'QUOTE_ACCEPTED',         // User accepted the quote
      'QUOTE_DECLINED',         // User declined the quote
      'DECLINED_BY_VENDOR',     // Vendor cancelled their acceptance
      'COMPLETED'               // Job finished
    ], 
    default: 'PENDING' 
  },

  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor', 
    default: null 
  },
  quotationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PaintingQuotation', 
    default: null 
  },
  notifiedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],

  // ─── Tracking Sub-Document ───────────────────────────
  tracking: { type: trackingSchema, default: () => ({}) }

}, { timestamps: true });

module.exports = mongoose.model('PaintingConsultation', paintingConsultationSchema);
