const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Booking = require('../models/Booking');
  const BookingRequest = require('../models/BookingRequest');

  // Search by bookingNumber prefix or exact
  const booking = await Booking.findOne({ bookingNumber: { $regex: 'BK1784200595', $options: 'i' } }).lean();

  if (booking) {
    console.log("Booking Details:");
    console.log(JSON.stringify(booking, null, 2));

    const requests = await BookingRequest.find({ bookingId: booking._id }).lean();
    console.log("BookingRequests for this booking:");
    console.log(JSON.stringify(requests, null, 2));
  } else {
    console.log("Booking not found!");
  }

  await mongoose.connection.close();
}

run().catch(console.error);
