const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Booking = require('../models/Booking');
  const VendorBill = require('../models/VendorBill');

  const booking = await Booking.findOne({ bookingNumber: 'BK1784201397589VBK6F' }).lean();

  if (booking) {
    console.log("Booking basePrice:", booking.basePrice, "discount:", booking.discount, "finalAmount:", booking.finalAmount);
    
    if (booking.vendorBillId) {
      const bill = await VendorBill.findById(booking.vendorBillId).lean();
      console.log("VendorBill grandTotal:", bill?.grandTotal);
      console.log(JSON.stringify(bill, null, 2));
    } else {
      console.log("No vendorBillId on booking");
      const bill = await VendorBill.findOne({ bookingId: booking._id }).lean();
      console.log("Found VendorBill by bookingId:", JSON.stringify(bill, null, 2));
    }
  } else {
    console.log("Booking not found");
  }

  await mongoose.connection.close();
}

run().catch(console.error);
