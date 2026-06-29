require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const vendorId = '6a13fdd2381a994f1815879a'; // harsh pandey ID
  
  const activeJobs = await Booking.find({
    vendorId: vendorId,
    status: { $in: ['accepted', 'assigned', 'visited', 'in_progress', 'work_done', 'final_settlement'] }
  }).lean();
  
  console.log(`Found ${activeJobs.length} active bookings for vendor harsh pandey:`);
  for (const j of activeJobs) {
    console.log(`\nBooking Number: ${j.bookingNumber}`);
    console.log(`ID: ${j._id}`);
    console.log(`Status: ${j.status}`);
    console.log(`isSelfJob: ${j.isSelfJob}`);
  }
  
  process.exit(0);
}

run();
