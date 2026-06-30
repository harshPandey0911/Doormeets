const mongoose = require('mongoose');

const subtractionSchema = new mongoose.Schema({
  type: { type: String, enum: ['DOOR', 'WINDOW', 'CUSTOM'], default: 'DOOR' },
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 }
}, { _id: false });

const wallSchema = new mongoose.Schema({
  wallNumber: { type: Number, default: 1 },
  length: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  windows: { type: Number, default: 0 },
  doors: { type: Number, default: 0 },
  conditions: {
    dampness: { type: Boolean, default: false },
    crackFilling: { type: Boolean, default: false }
  },
  netArea: { type: Number, default: 0 }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  name: { type: String, default: 'Room' }, // "Bedroom", "Living Room", etc.
  finishStyle: { type: String, enum: ['LIGHT', 'DARK'], default: 'LIGHT' },
  repairType: { type: String, enum: ['NON_PUTTY', 'PRIMER', 'PUTTY'], default: 'PRIMER' },
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  netArea: { type: Number, default: 0 },
  subtractions: [subtractionSchema],
  paintingNeeded: { type: Boolean, default: true },
  additionalServiceNeeded: { type: Boolean, default: false },
  // Wall-level detail (Screen 11)
  walls: [wallSchema],
  // Paint selection (Screen 12)
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

const paintingConsultationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
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
  // Rich wizard data collected during 5-step user flow
  wizardData: wizardDataSchema,
  status: { 
    type: String, 
    enum: [
      'PENDING',               // Broadcast to vendors
      'ACCEPTED_BY_VENDOR',    // A vendor has picked it up
      'QUOTE_GENERATED',       // Vendor visited and submitted a quote
      'QUOTE_ACCEPTED',        // User accepted the quote
      'QUOTE_DECLINED',        // User declined the quote
      'DECLINED_BY_VENDOR',    // Vendor cancelled their acceptance
      'COMPLETED'              // Job finished
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
  }]
}, { timestamps: true });

module.exports = mongoose.model('PaintingConsultation', paintingConsultationSchema);
