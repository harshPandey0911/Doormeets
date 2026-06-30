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
    require('../models/Settings');
    const Booking = require('../models/Booking');
    const Vendor = require('../models/Vendor');
    
    const job = await Booking.findById('6a423b3322c1658f81f72a5c');
    if (job) {
      job.status = 'completed';
      await job.save();
      console.log('Marked job as completed in Atlas!');
    }
    
    await Vendor.updateWorkStatus('6a13fdd2381a994f1815879a');
    console.log('Updated harsh pandey status!');
    
    const v = await Vendor.findById('6a13fdd2381a994f1815879a').select('name availability availabilityStatus workStatus');
    console.log('New state in Atlas:', JSON.stringify(v, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
