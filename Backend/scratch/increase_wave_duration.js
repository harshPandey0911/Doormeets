const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Settings = require('../models/Settings');
  
  // Update wave duration to 600 seconds (10 minutes) for testing
  const result = await Settings.updateOne(
    { type: 'global' },
    { $set: { waveDuration: 600 } },
    { upsert: true }
  );

  console.log("Update settings result:", result);

  const updatedSettings = await Settings.findOne({ type: 'global' }).lean();
  console.log("Current Global Settings waveDuration:", updatedSettings.waveDuration);

  await mongoose.connection.close();
}

run().catch(console.error);
