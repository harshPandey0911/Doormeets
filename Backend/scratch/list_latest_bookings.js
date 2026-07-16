const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Booking = require('../models/Booking');
  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(5).lean();

  console.log("Latest 5 bookings:");
  bookings.forEach(b => {
    console.log(`ID: ${b._id} | Number: ${b.bookingNumber} | BasePrice: ${b.basePrice} | Discount: ${b.discount} | Final: ${b.finalAmount}`);
  });

  await mongoose.connection.close();
}

run().catch(console.error);
