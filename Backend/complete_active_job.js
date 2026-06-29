require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const bookingId = '6a3fa76670dbf0559e34e6be';
  
  const res = await Booking.findByIdAndUpdate(
    bookingId,
    {
      $set: {
        status: 'completed',
        isSelfJob: false // Release self-job flag
      }
    },
    { new: true }
  );
  
  console.log('Booking status updated:');
  console.log(`Booking Number: ${res.bookingNumber}`);
  console.log(`Status: ${res.status}`);
  console.log(`isSelfJob: ${res.isSelfJob}`);
  
  process.exit(0);
}

run();
