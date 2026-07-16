const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Category = require('../models/Category');
  const Vendor = require('../models/Vendor');
  const { findNearbyVendors } = require('../services/locationService');

  // 1. Fetch parlour category
  const category = await Category.findOne({ title: { $regex: 'parlour', $options: 'i' } });
  console.log("Category Found:", category ? { id: category._id, title: category.title } : "NOT FOUND");

  if (!category) {
    await mongoose.connection.close();
    return;
  }

  // 2. Locate vendor query matching logic
  const searchCategoryTitle = category.title;
  const searchArray = [searchCategoryTitle, category._id.toString()];

  const vendorQuery = {
    isActive: true,
    categories: { $in: searchArray }
  };

  console.log("Executing Vendor.find(vendorQuery) with query:", JSON.stringify(vendorQuery));
  const matchingVendors = await Vendor.find(vendorQuery).select('_id name categories approvalStatus isOnline availability').lean();
  console.log("Matching Vendors from DB:", matchingVendors);

  // 3. Find nearby vendors matching the filters
  const bookingLocation = { lat: 22.7176052, lng: 75.871977 }; // Indore center
  const vendorFilters = {
    _id: { $in: matchingVendors.map(v => v._id) },
    city: 'Indore'
  };

  console.log("Calling findNearbyVendors with location:", bookingLocation, "filters:", vendorFilters);
  const nearby = await findNearbyVendors(bookingLocation, 10, vendorFilters);
  console.log("Resulting Nearby Vendors matched:", nearby);

  await mongoose.connection.close();
}

run().catch(console.error);
