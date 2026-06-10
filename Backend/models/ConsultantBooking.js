const mongoose = require('mongoose');

const consultantBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true
  },
  uploadedImages: [{
    type: String
  }],
  description: {
    type: String,
    trim: true
  },
  consultationFee: {
    type: Number,
    required: true,
    default: 0
  },
  slot: {
    type: String,
    required: true
  },
  assignedConsultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Consultation Completed', 'Quotation Sent', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ConsultantBooking', consultantBookingSchema);
