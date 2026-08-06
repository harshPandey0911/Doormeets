const mongoose = require('mongoose');
const { BILL_STATUS } = require('../utils/constants');

/**
 * Vendor Bill Model
 * ─────────────────
 * Single source of truth for the final bill and revenue split.
 * 
 * Revenue Model:
 *   Vendor gets 70% of total service BASE (excl GST)
 *   Vendor gets 10% of total parts BASE (excl GST)
 *   GST is NEVER paid to vendor — 100% retained by company
 *   Company gets remainder (30% service + 90% parts + 100% GST)
 */
const vendorBillSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },

  // ==========================================
  // 1. BILL LINE ITEMS (Input)
  // ==========================================

  /** Services — original booking service + vendor-added extras */
  services: [{
    catalogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorServiceCatalog'
    },
    name: String,
    price: Number,            // Unit base price (excl GST)
    gstPercentage: Number,
    quantity: { type: Number, default: 1 },
    gstAmount: Number,        // price × qty × gst%
    total: Number,            // price × qty + gstAmount
    isOriginal: { type: Boolean, default: false }, // true = from booking, false = vendor-added
    note: { type: String, default: '' }
  }],

  /** Parts used during the job */
  parts: [{
    catalogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorPartsCatalog'
    },
    name: String,
    price: Number,            // Unit base price (excl GST)
    gstPercentage: Number,
    quantity: { type: Number, default: 1 },
    gstAmount: Number,
    total: Number
  }],

  /** Custom items added by vendor (ad-hoc parts/materials) */
  customItems: [{
    name: String,
    price: Number,            // Unit base price (excl GST)
    gstPercentage: Number,
    quantity: { type: Number, default: 1 },
    gstAmount: Number,
    total: Number
  }],

  // ==========================================
  // 2. CALCULATED BASE TOTALS
  // ==========================================

  // Service bases
  originalServiceBase: { type: Number, default: 0 },  // Σ(original service price×qty)
  vendorServiceBase: { type: Number, default: 0 },  // Σ(added service price×qty)
  totalServiceBase: { type: Number, default: 0 },  // original + vendor

  // Parts base
  totalPartsBase: { type: Number, default: 0 },  // Σ(part price×qty)

  // Visiting Charges
  visitingCharges: { type: Number, default: 0 },

  // Transport Charges
  transportCharges: { type: Number, default: 0 },

  // GST breakdown
  originalGST: { type: Number, default: 0 },
  vendorServiceGST: { type: Number, default: 0 },
  partsGST: { type: Number, default: 0 },
  totalGST: { type: Number, default: 0 },  // sum of all GST

  // ==========================================
  // 3. FINAL BILL (What user pays)
  // ==========================================

  grandTotal: {
    type: Number,
    required: true
    // = totalServiceBase + totalPartsBase + totalGST
  },

  // ==========================================
  // 4. REVENUE SPLIT (Internal — never shown to vendor before payment)
  // ==========================================

  /** Config snapshot — frozen at bill-generation time */
  payoutConfig: {
    serviceSplitPercentage: { type: Number, default: 70 },  // vendor gets 70%
    partsSplitPercentage: { type: Number, default: 10 },  // vendor gets 10%
    serviceGstPercentage: { type: Number, default: 18 },
    partsGstPercentage: { type: Number, default: 18 }
  },

  /** Vendor earnings (calculated on BASE prices, never on GST) */
  vendorServiceEarning: { type: Number, default: 0 },  // totalServiceBase × 70%
  vendorPartsEarning: { type: Number, default: 0 },  // totalPartsBase  × 10%
  vendorTotalEarning: { type: Number, default: 0 },  // service + parts earning

  /** Company revenue */
  companyRevenue: { type: Number, default: 0 },  // grandTotal − vendorTotalEarning

  // ==========================================
  // 4.5 CLEAN ADMIN-FACING BREAKDOWN
  // ==========================================
  // Every service line (original + vendor-added) is settled through the same sgst/cgst →
  // platform commission → level commission cascade used for the primary booking, and the
  // same admin-margin → margin-GST → net split. These totals are the sum across every
  // service line, kept separate from parts (which use a flat split, no per-tier cascade).
  vendorServiceSgst: { type: Number, default: 0 },
  vendorServiceCgst: { type: Number, default: 0 },
  platformCommissionAmount: { type: Number, default: 0 },
  levelCommissionAmount: { type: Number, default: 0 },

  // customerPrice-equivalent minus vendor's gross base payout, summed across every service
  // line, BEFORE the platform's own GST on that margin (distinct from companyRevenue, which
  // also folds in the sgst/cgst/commission siphoned from the vendor's side).
  adminMarginGross: { type: Number, default: 0 },
  adminMarginGst: { type: Number, default: 0 },
  adminMarginNet: { type: Number, default: 0 },

  // Simple totals for the admin dashboard: what the customer paid, split by "originally
  // booked" vs "added on site", independent of the service/parts/custom-item plumbing above.
  totalServiceCharge: { type: Number, default: 0 },  // original booked service base only
  totalAddonCharge: { type: Number, default: 0 },    // vendor-added services + parts + custom items base

  // ==========================================
  // 5. STATUS & META
  // ==========================================

  status: {
    type: String,
    enum: Object.values(BILL_STATUS),
    default: BILL_STATUS.DRAFT,
    index: true
  },

  generatedAt: {
    type: Date,
    default: Date.now
  },

  paidAt: {
    type: Date,
    default: null
  },

  applyPartsGST: {
    type: Boolean,
    default: true
  },

  note: { type: String, default: null }

}, {
  timestamps: true
});

vendorBillSchema.index({ vendorId: 1, status: 1 });

module.exports = mongoose.model('VendorBill', vendorBillSchema);
