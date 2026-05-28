const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },

  type: {
    type: String,
    required: true,
    enum: [
      "vendor_service",
      "platform_fee",
      "subscription",
      "credit_recharge"
    ]
  },

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  issuedBy: {
    type: mongoose.Schema.Types.ObjectId
  },

  issuedTo: {
    type: mongoose.Schema.Types.ObjectId
  },

  baseAmount: {
    type: Number,
    required: true
  },

  gstPercent: {
    type: Number,
    required: true
  },

  cgst: {
    type: Number,
    default: 0
  },

  sgst: {
    type: Number,
    default: 0
  },

  igst: {
    type: Number,
    default: 0
  },

  totalGST: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    required: true
  },

  paymentStatus: {
    type: String,
    default: "paid"
  },

  invoiceStatus: {
    type: String,
    enum: ["generated", "paid", "cancelled"],
    default: "generated"
  },

  generatedByRole: {
    type: String,
    default: "super_admin"
  },

  transactionGroupId: {
    type: String
  },

  isArchived: {
    type: Boolean,
    default: false
  },

  pdfUrl: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
