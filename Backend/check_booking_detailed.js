require('dotenv').config();
const mongoose = require('mongoose');

// Register all models first
require('./models/User');
require('./models/Category');
require('./models/Service');
require('./models/Vendor');
const Booking = require('./models/Booking');
const BookingRequest = require('./models/BookingRequest');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const lastBooking = await Booking.findOne().sort({ createdAt: -1 }).populate('categoryId').lean();
  if (!lastBooking) {
    console.log("No bookings found.");
    process.exit(0);
  }

  console.log("LAST BOOKING DETAILS:");
  console.log(JSON.stringify(lastBooking, null, 2));

  console.log("\nBOOKING REQUESTS FOR THIS BOOKING:");
  const reqs = await BookingRequest.find({ bookingId: lastBooking._id }).lean();
  console.log(JSON.stringify(reqs, null, 2));

  process.exit(0);
}

run();
