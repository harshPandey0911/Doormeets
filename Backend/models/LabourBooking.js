const mongoose = require('mongoose');

const labourBookingSchema = new mongoose.Schema({
  labourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  bookedById: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'bookedByRole'
  },
  bookedByRole: {
    type: String,
    enum: ['User', 'Vendor'],
    required: true
  },
  bookedByName: { type: String },
  bookedByPhone: { type: String },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  note: { type: String },
  acceptedAt: { type: Date },
  completedAt: { type: Date },
  rejectedAt: { type: Date }
}, { timestamps: true });

labourBookingSchema.index({ labourId: 1, status: 1 });
labourBookingSchema.index({ bookedById: 1 });

module.exports = mongoose.model('LabourBooking', labourBookingSchema);
