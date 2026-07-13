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
  const Service = require('../models/Service');
  
  try {
    // Find the first service
    const service = await Service.findOne();
    if (!service) {
      console.log("No service found in database.");
      process.exit(0);
    }
    console.log("Found service:", service.title, "ID:", service._id);
    
    // Attempt to update variants
    service.variants = [
      {
        title: "Test Variant 1",
        extraPrice: 99,
        platformCommission: 20,
        l1Commission: 10,
        l2Commission: 15,
        l3Commission: 20
      }
    ];
    
    await service.save();
    console.log("Service saved successfully via Mongoose save!");
  } catch (err) {
    console.error("Save failed:", err);
  }
  process.exit(0);
}

run();
