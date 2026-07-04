const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const Booking = require('./models/Booking');
const VendorBill = require('./models/VendorBill');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await connectDB();
  const bookingId = '6a48f1245ad2c9c511037c1d';
  const booking = await Booking.findById(bookingId).lean();
  const bill = await VendorBill.findOne({ bookingId }).lean();

  console.log('booking.vendorShare:', booking?.vendorShare);
  if (bill) {
    console.log('bill.vendorTotalEarning:', bill.vendorTotalEarning);
    console.log('bill.vendorServiceEarning:', bill.vendorServiceEarning);
    console.log('bill.vendorPartsEarning:', bill.vendorPartsEarning);
    console.log('bill.grandTotal:', bill.grandTotal);
  } else {
    console.log('No bill found!');
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
