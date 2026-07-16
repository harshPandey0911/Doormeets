const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Vendor = require('../models/Vendor');

  // Set the 3 duplicate Himanshi accounts offline, keep only the active one (8888888888) online
  const result = await Vendor.updateMany(
    { 
      name: { $regex: 'himanshi', $options: 'i' },
      phone: { $ne: '8888888888' }
    },
    {
      $set: {
        isOnline: false,
        availabilityStatus: 'OFFLINE'
      }
    }
  );

  console.log("Update offline result:", result);

  // Set the active account online
  const activeResult = await Vendor.updateOne(
    { phone: '8888888888' },
    {
      $set: {
        isOnline: true,
        availabilityStatus: 'ONLINE',
        availability: 'AVAILABLE'
      }
    }
  );
  console.log("Update active online result:", activeResult);

  const vendors = await Vendor.find({ name: { $regex: 'himanshi', $options: 'i' } }).lean();
  vendors.forEach(v => {
    console.log(`Vendor: ${v.name} (${v._id}) | Phone: ${v.phone} | isOnline: ${v.isOnline}`);
  });

  await mongoose.connection.close();
}

run().catch(console.error);
