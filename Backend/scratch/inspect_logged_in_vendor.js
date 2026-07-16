const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Vendor = require('../models/Vendor');
  const loggedInVendor = await Vendor.findById('6a588bfcccb56b9f142fc4d9').lean();

  if (loggedInVendor) {
    console.log("Logged In Vendor details:");
    console.log(JSON.stringify(loggedInVendor, null, 2));
  } else {
    console.log("Logged In Vendor not found in database!");
  }

  await mongoose.connection.close();
}

run().catch(console.error);
