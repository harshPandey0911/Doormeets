const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const vendorId = "6a13fdd2381a994f1815879a";
    const vendor = await Vendor.findById(vendorId).lean();
    
    if (!vendor) {
      console.log("Vendor not found!");
      await mongoose.disconnect();
      return;
    }

    console.log("Vendor Details:");
    console.log(`- Name: ${vendor.name}`);
    console.log(`- Approval Status: ${vendor.approvalStatus}`);
    console.log(`- Is Active: ${vendor.isActive}`);
    console.log(`- Is Online: ${vendor.isOnline}`);
    console.log(`- Availability: ${vendor.availability}`);
    console.log(`- Availability Status: ${vendor.availabilityStatus}`);
    console.log(`- Work Status: ${vendor.workStatus}`);
    console.log(`- Categories:`, vendor.categories);
    console.log(`- Service:`, vendor.service);
    console.log(`- Address:`, vendor.address);
    console.log(`- Location:`, vendor.location);
    console.log(`- GeoLocation:`, vendor.geoLocation);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
