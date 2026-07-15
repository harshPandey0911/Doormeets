const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const vendorId = "6a13fdd2381a994f1815879a";
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      console.log("Vendor not found!");
      await mongoose.disconnect();
      return;
    }

    vendor.availability = 'AVAILABLE';
    vendor.workStatus = 'available';
    vendor.availabilityStatus = 'ONLINE';
    vendor.reservedFrom = null;
    vendor.reservedBookingId = null;
    vendor.isOnline = true;

    await vendor.save();
    console.log("Vendor availability reset successfully!");

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
