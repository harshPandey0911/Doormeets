const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Vendor = require('../models/Vendor');

  // Update Himanshi to be approved, online, and add matching categories + coordinates
  const result = await Vendor.updateOne(
    { name: { $regex: 'himanshi', $options: 'i' } },
    {
      $set: {
        approvalStatus: 'APPROVED',
        isOnline: true,
        availability: 'AVAILABLE',
        availabilityStatus: 'ONLINE',
        'address.city': 'Indore',
        'address.lat': 22.7196,
        'address.lng': 75.8577,
        geoLocation: {
          type: 'Point',
          coordinates: [75.8577, 22.7196]
        },
        // Mapped categories: Plumber, Painting, Carpenter, Parlour, etc.
        categories: [
          '6a3a4e4fe17e70480747f848', // Plumber
          '6a293e391e686a11ee740000', // Painting
          '6a53aff11ac1bf137612a9c9', // Carpenter
          '6a589e9f6b41d354ba8fe4bf', // Parlour
          '6a28ffd9d65b14fa11ce393e'  // Salon
        ],
        service: ['Plumber', 'Painting', 'Carpenter', 'parlour', 'salon']
      }
    }
  );

  console.log("Update result:", result);

  const updatedHimanshi = await Vendor.findOne({ name: { $regex: 'himanshi', $options: 'i' } }).lean();
  console.log("Updated Himanshi Details:", {
    name: updatedHimanshi.name,
    approvalStatus: updatedHimanshi.approvalStatus,
    isOnline: updatedHimanshi.isOnline,
    availability: updatedHimanshi.availability,
    city: updatedHimanshi.address?.city,
    coordinates: updatedHimanshi.geoLocation?.coordinates,
    categories: updatedHimanshi.categories,
    service: updatedHimanshi.service
  });

  await mongoose.connection.close();
}

run().catch(console.error);
