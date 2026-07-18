const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['purchase', 'lead_deduct', 'refund', 'penalty', 'job_earning'],
    required: true
  },
  amount: {
    type: Number, // Amount in Credits. Positive for purchase/earning/refund, Negative for lead_deduct/penalty
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Could be Booking ID or Payment ID
    default: null
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreditPackage',
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
