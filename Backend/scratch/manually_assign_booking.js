const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const vendorId = "6a13fdd2381a994f1815879a";
    const bookingId = "6a4cac45e601ad03be3bda41";

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log("Booking not found!");
      await mongoose.disconnect();
      return;
    }

    booking.vendorId = vendorId;
    booking.status = "assigned";
    booking.isSelfJob = true;
    booking.acceptedAt = new Date();
    booking.assignedAt = new Date();

    await booking.save();
    console.log(`Successfully assigned Booking ${booking.bookingNumber} (${bookingId}) to Vendor ${vendorId}`);

    // Update vendor work status to busy
    await Vendor.updateWorkStatus(vendorId);
    console.log("Updated vendor work status in DB.");

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
