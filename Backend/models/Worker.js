const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    sparse: true,
    default: null
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  aadhar: {
    number: {
      type: String,
      required: true,
      trim: true
    },
    document: {
      type: String, // URL to stored doc
      required: true
    }
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
    index: true
  },
  serviceCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  skills: [{
    type: String
  }],
  address: {
    addressLine1: String,
    city: String,
    state: String,
    pincode: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'ONLINE', 'OFFLINE', 'BUSY'],
    default: 'active',
    index: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Worker || mongoose.model('Worker', workerSchema);
