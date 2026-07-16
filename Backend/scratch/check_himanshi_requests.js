const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const BookingRequest = require('../models/BookingRequest');
  const requests = await BookingRequest.find({ vendorId: '6a58854997fe01d30a582b90' }).lean();

  console.log("Booking requests for Himanshi in DB:", requests);

  await mongoose.connection.close();
}

run().catch(console.error);
