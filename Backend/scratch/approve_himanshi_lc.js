const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Vendor = require('../models/Vendor');

  // Update Himanshi to lowercase 'approved'
  const result = await Vendor.updateOne(
    { name: { $regex: 'himanshi', $options: 'i' } },
    {
      $set: {
        approvalStatus: 'approved',
        isOnline: true,
        availability: 'AVAILABLE',
        availabilityStatus: 'ONLINE'
      }
    }
  );

  console.log("Update result:", result);

  const updatedHimanshi = await Vendor.findOne({ name: { $regex: 'himanshi', $options: 'i' } }).lean();
  console.log("Updated Himanshi Details:", {
    name: updatedHimanshi.name,
    approvalStatus: updatedHimanshi.approvalStatus,
    isOnline: updatedHimanshi.isOnline,
    availability: updatedHimanshi.availability
  });

  await mongoose.connection.close();
}

run().catch(console.error);
