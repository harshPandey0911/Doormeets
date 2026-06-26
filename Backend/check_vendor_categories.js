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

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const Vendor = require('./models/Vendor');
  
  const onlineVendors = await Vendor.find({ isOnline: true }).select('name categories service address location geoLocation');
  console.log('Online Vendors Details:');
  console.log(JSON.stringify(onlineVendors, null, 2));
  
  process.exit(0);
}

run();
