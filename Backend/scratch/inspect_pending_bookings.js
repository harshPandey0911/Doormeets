const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"\r]|['"\r]$/g, '');
  }
});

async function run() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    const Booking = require('../models/Booking');
    
    // We are looking for pending bookings (status not completed, not cancelled)
    const pendingBookings = await Booking.find({
      status: { $nin: ['completed', 'cancelled'] }
    })
    .select('bookingNumber status serviceCategory serviceName finalAmount createdAt')
    .lean();
    
    console.log('Pending Bookings Count in DB:', pendingBookings.length);
    console.log('Pending Bookings details:');
    console.log(JSON.stringify(pendingBookings, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
