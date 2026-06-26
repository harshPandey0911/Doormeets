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
  
  const salonCatId = '6a28ffd9d65b14fa11ce393e';
  
  const vendorsToUpdate = ['6a13fdd2381a994f1815879a', '6a16b5a9d1076d4f88f4b4f7'];
  
  for (let id of vendorsToUpdate) {
    const vendor = await Vendor.findById(id);
    if (vendor) {
      if (!vendor.categories.includes(salonCatId)) {
        vendor.categories.push(salonCatId);
      }
      if (!vendor.service.includes('salon')) {
        vendor.service.push('salon');
      }
      await vendor.save();
      console.log(`Successfully added Salon category to vendor: ${vendor.name}`);
    }
  }
  
  process.exit(0);
}

run();
