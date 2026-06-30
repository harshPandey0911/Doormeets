const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function run() {
  await connectDB();
  const Vendor = require('../models/Vendor');
  const Booking = require('../models/Booking');

  const bookings = await Booking.find({ vendorId: { $ne: null } });
  console.log(`Found ${bookings.length} bookings to update vendors for.`);

  for (const b of bookings) {
    const status = await Vendor.updateWorkStatus(b.vendorId);
    console.log(`Updated vendor ${b.vendorId} status to: ${status}`);
  }

  process.exit(0);
}

run().catch(console.error);
