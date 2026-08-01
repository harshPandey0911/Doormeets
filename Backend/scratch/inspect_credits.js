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
    const Booking = require('../models/Booking');
    const CreditTransaction = require('../models/CreditTransaction');
    const Vendor = require('../models/Vendor');
    
    // Find booking
    const booking = await Booking.findOne({ bookingNumber: 'BK1785564411311K22I5' }).lean();
    if (!booking) {
      console.log('Booking not found!');
      return;
    }
    console.log('Booking Details:');
    console.log({
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      vendorId: booking.vendorId,
      cancelledAt: booking.cancelledAt
    });

    // Find credit transactions related to this booking
    const txns = await CreditTransaction.find({ bookingId: booking._id }).lean();
    console.log('\nCredit Transactions for this booking:');
    console.log(JSON.stringify(txns, null, 2));

    // Find all credit transactions for the vendor
    if (booking.vendorId) {
      const vendorTxns = await CreditTransaction.find({ vendorId: booking.vendorId }).sort({ createdAt: -1 }).limit(5).lean();
      console.log('\nLast 5 Credit Transactions for Vendor:');
      console.log(JSON.stringify(vendorTxns, null, 2));
      
      const vendor = await Vendor.findById(booking.vendorId).lean();
      console.log('\nVendor Wallet Info:');
      console.log(vendor.wallet);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
