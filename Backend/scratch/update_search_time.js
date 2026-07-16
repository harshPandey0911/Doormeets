const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Settings = require('../models/Settings');
  const result = await Settings.updateOne(
    { type: 'global' },
    { $set: { waveDuration: 60, maxSearchTime: 1 } }
  );

  console.log("Update settings result:", result);

  const currentSettings = await Settings.findOne({ type: 'global' }).lean();
  console.log("Current Global Settings:", currentSettings);

  await mongoose.connection.close();
}

run().catch(console.error);
