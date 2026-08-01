const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"\r]|['"\r]$/g, '');
  }
});

async function run() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    const { refundVendorLeadFee } = require('../controllers/bookingControllers/vendorBookingController');
    const Booking = require('../models/Booking');
    const Vendor = require('../models/Vendor');
    
    const booking = await Booking.findOne({ bookingNumber: 'BK1785564411311K22I5' });
    if (!booking) {
      console.log('Booking not found!');
      return;
    }
    
    const vendorBefore = await Vendor.findById(booking.vendorId).lean();
    console.log('Vendor credits before refund:', vendorBefore.wallet.credits);
    
    console.log('Calling refundVendorLeadFee...');
    await refundVendorLeadFee(booking._id);
    
    const vendorAfter = await Vendor.findById(booking.vendorId).lean();
    console.log('Vendor credits after refund:', vendorAfter.wallet.credits);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
