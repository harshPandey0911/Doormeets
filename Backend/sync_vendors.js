const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

async function sync() {
  await mongoose.connect(env.MONGODB_URI);
  const Vendor = require('./models/Vendor');
  
  const vendors = await Vendor.find();
  console.log('Syncing vendors...');
  
  for (let vendor of vendors) {
    if (vendor.isOnline) {
      vendor.availability = 'AVAILABLE';
      vendor.availabilityStatus = 'ONLINE';
    } else {
      vendor.availability = 'OFFLINE';
      vendor.availabilityStatus = 'OFFLINE';
    }
    await vendor.save();
    
    // Also sync to Redis
    try {
      const { setVendorOnline, setVendorAvailability } = require('./services/redisService');
      await setVendorOnline(vendor._id, vendor.isOnline);
      await setVendorAvailability(vendor._id, vendor.availability);
      console.log(`Synced ${vendor.name} (isOnline=${vendor.isOnline}) to DB and Redis`);
    } catch (err) {
      console.log(`Synced ${vendor.name} (isOnline=${vendor.isOnline}) to DB (Redis sync skipped/failed: ${err.message})`);
    }
  }
  
  console.log('Sync complete.');
  process.exit(0);
}

sync();
