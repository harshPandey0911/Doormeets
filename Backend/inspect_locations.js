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

async function inspect() {
  await mongoose.connect(env.MONGODB_URI);
  const Vendor = require('./models/Vendor');
  
  const vendors = await Vendor.find().select('name isOnline availability location address geoLocation').lean();
  console.log('Vendors Locations:');
  vendors.forEach(v => {
    console.log(`- ${v.name}: isOnline=${v.isOnline}, location=${JSON.stringify(v.location)}, address.lat=${v.address?.lat}, address.lng=${v.address?.lng}, geo=${JSON.stringify(v.geoLocation?.coordinates)}`);
  });
  
  process.exit(0);
}

inspect();
