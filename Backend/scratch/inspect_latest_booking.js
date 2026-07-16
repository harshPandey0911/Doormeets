const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Booking = require('../models/Booking');
  const latestBooking = await Booking.findOne().sort({ createdAt: -1 }).lean();
  
  if (latestBooking) {
    console.log("Latest Booking details:");
    console.log(JSON.stringify(latestBooking, null, 2));
  } else {
    console.log("No bookings found!");
  }

  await mongoose.connection.close();
}

run().catch(console.error);
