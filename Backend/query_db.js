const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const Booking = require('./models/Booking');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await connectDB();
  const bookingId = '6a48f1245ad2c9c511037c1d';
  const booking = await Booking.findById(bookingId).lean();

  console.log('booking.finalAmount:', booking?.finalAmount);
  console.log('booking.userPayableAmount:', booking?.userPayableAmount);
  console.log('booking.basePrice (original booking price):', booking?.basePrice);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
