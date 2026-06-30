const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const shopOwnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  businessName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    default: 'shop_owner'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  wallet: {
    balance: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
shopOwnerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
shopOwnerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('ShopOwner', shopOwnerSchema);
