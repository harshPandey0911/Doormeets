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
    console.log('Connecting to:', env.MONGODB_URI);
    await mongoose.connect(env.MONGODB_URI);
    require('../models/Settings');
    require('../models/Booking');
    const Vendor = require('../models/Vendor');
    
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
