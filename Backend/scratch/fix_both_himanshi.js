const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Vendor = require('../models/Vendor');

  // Parlour category ID
  const parlourCategoryId = '6a589e9f6b41d354ba8fe4bf';

  // Update BOTH vendor profiles named Himanshi
  const result = await Vendor.updateMany(
    { name: { $regex: 'himanshi', $options: 'i' } },
    {
      $set: {
        approvalStatus: 'approved',
        isOnline: true,
        availability: 'AVAILABLE',
        availabilityStatus: 'ONLINE',
        'address.city': 'Indore',
        'address.lat': 22.7176,
        'address.lng': 75.8720,
        geoLocation: {
          type: 'Point',
          coordinates: [75.8720, 22.7176]
        }
      },
      $addToSet: {
        categories: parlourCategoryId,
        service: 'parlour'
      }
    }
  );

  console.log("Update result for both vendors:", result);

  const vendors = await Vendor.find({ name: { $regex: 'himanshi', $options: 'i' } }).lean();
  vendors.forEach(v => {
    console.log(`Vendor: ${v.name} (${v._id}) | Phone: ${v.phone}`);
    console.log(`- Categories:`, v.categories);
    console.log(`- Service:`, v.service);
    console.log(`- Status:`, v.approvalStatus, v.isOnline);
  });

  await mongoose.connection.close();
}

run().catch(console.error);
