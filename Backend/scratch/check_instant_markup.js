const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  const Booking = require('../models/Booking');
  const booking = await Booking.findOne({ bookingNumber: 'BK1784201397589VBK6F' }).lean();
  if (booking) {
    console.log("instantMarkupCharged:", booking.instantMarkupCharged);
    console.log("bookingType:", booking.bookingType);
    console.log("paymentMethod:", booking.paymentMethod);
    console.log("amount:", booking.amount);
    console.log("finalAmount:", booking.finalAmount);
  }
  await mongoose.connection.close();
}
run().catch(console.error);
