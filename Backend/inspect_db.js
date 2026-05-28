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
  
  const vendor = await Vendor.findById('6a16b5a9d1076d4f88f4b4f7').lean();
  console.log('Vendor Devendra:', JSON.stringify(vendor, null, 2));
  
  process.exit(0);
}

inspect();
