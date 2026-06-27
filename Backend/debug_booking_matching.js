require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const { findNearbyVendors } = require('./services/locationService');
const Category = require('./models/Category');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const lastBooking = await Booking.findOne().sort({ createdAt: -1 }).populate('categoryId').lean();
  if (!lastBooking) {
    console.log("No bookings found in database.");
    process.exit(0);
  }

  console.log("LAST BOOKING DETAILS:");
  console.log(`ID: ${lastBooking._id}`);
  console.log(`Booking Number: ${lastBooking.bookingNumber}`);
  console.log(`Service Name: ${lastBooking.serviceName}`);
  console.log(`Category: ${lastBooking.serviceCategory} (${lastBooking.categoryId?._id})`);
  console.log(`Address:`, JSON.stringify(lastBooking.address));
  console.log(`Status: ${lastBooking.status}`);

  const category = lastBooking.categoryId;
  const searchCategoryTitle = category ? category.title : lastBooking.serviceCategory;
  
  const searchArray = [];
  if (searchCategoryTitle) {
    searchArray.push(new RegExp(`^${searchCategoryTitle.trim()}$`, 'i'));
  }
  if (category) {
    searchArray.push(category._id.toString());
  }

  console.log("\nSearching qualified vendors globally with query:");
  const Vendor = require('./models/Vendor');
  const vendorQuery = {
    isActive: true,
    categories: { $in: searchArray }
  };
  console.log(vendorQuery);
  const matchingVendors = await Vendor.find(vendorQuery).select('name businessName categories').lean();
  console.log(`Found ${matchingVendors.length} matching vendors globally:`, matchingVendors.map(v => v.name));

  const bookingLocation = { lat: lastBooking.address.lat, lng: lastBooking.address.lng };
  console.log(`\nBooking coordinates: lat=${bookingLocation.lat}, lng=${bookingLocation.lng}`);

  const vendorFilters = {
    _id: { $in: matchingVendors.map(v => v._id) },
    checkCashLimit: lastBooking.paymentMethod === 'cash',
    city: lastBooking.address.city
  };
  console.log("Vendor filters for nearby search:", vendorFilters);

  const nearby = await findNearbyVendors(bookingLocation, 10, vendorFilters);
  console.log(`\nNearby search found ${nearby.length} vendors:`, nearby.map(n => ({ name: n.name, distance: n.distance })));

  process.exit(0);
}

run();
