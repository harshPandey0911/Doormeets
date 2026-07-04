const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const Booking = require('./models/Booking');
const Service = require('./models/Service');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await connectDB();
  const bookingId = '6a48f1245ad2c9c511037c1d';
  const booking = await Booking.findById(bookingId).lean();
  console.log('booking.serviceId:', booking.serviceId);
  if (booking.serviceId) {
    const serviceDoc = await Service.findById(booking.serviceId).lean();
    console.log('serviceDoc.packages:', JSON.stringify(serviceDoc?.packages, null, 2));
  } else {
    console.log('No serviceId on booking!');
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
