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
    const activeJobs = await Booking.find({
      vendorId: '6a13fdd2381a994f1815879a'
    }).select('bookingNumber status scheduledDate timeSlot scheduledTime');
    
    console.log('Active Jobs count:', activeJobs.length);
    console.log(JSON.stringify(activeJobs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
