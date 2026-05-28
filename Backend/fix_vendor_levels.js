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
  
  // Find vendors where currentLevel is set but level does not match
  const vendors = await Vendor.find({ currentLevel: { $ne: null } });
  console.log(`Checking ${vendors.length} vendors with training levels...`);
  
  for (const vendor of vendors) {
    const expectedLevel = vendor.currentLevel === 'L1' ? 1 : vendor.currentLevel === 'L2' ? 2 : 3;
    if (vendor.level !== expectedLevel) {
      console.log(`Updating vendor ${vendor.name} (${vendor._id}): level was ${vendor.level}, changing to ${expectedLevel}`);
      vendor.level = expectedLevel;
      await vendor.save();
    }
  }
  
  console.log('Sync complete.');
  process.exit(0);
}

run();
