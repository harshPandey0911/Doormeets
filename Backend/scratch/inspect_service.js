const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  // Try finding in UserService
  const Service = require('../models/UserService');
  let service = await Service.findById('6a58a3a8f5060e5d99eb7a10').lean();

  if (service) {
    console.log("Found in UserService:");
    console.log(JSON.stringify(service, null, 2));
  } else {
    console.log("Not found in UserService.");
    // Try finding in standard Service model
    try {
      const AltService = mongoose.model('Service') || require('../models/Service');
      service = await AltService.findById('6a58a3a8f5060e5d99eb7a10').lean();
      if (service) {
        console.log("Found in Alt Service model:");
        console.log(JSON.stringify(service, null, 2));
      }
    } catch(e) {
      console.log("Alt model check error:", e.message);
    }
  }

  await mongoose.connection.close();
}

run().catch(console.error);
