const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Vendor = require('../models/Vendor');
  
  // Search for vendor named Himanshi
  const vendor = await Vendor.findOne({ name: { $regex: 'himanshi', $options: 'i' } }).lean();
  if (!vendor) {
    console.log("Vendor 'Himanshi' not found!");
  } else {
    console.log("Vendor 'Himanshi' details:");
    console.log(JSON.stringify(vendor, null, 2));
  }

  await mongoose.connection.close();
}

run().catch(console.error);
