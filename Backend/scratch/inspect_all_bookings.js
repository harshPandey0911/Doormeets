const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const count = await Booking.countDocuments({});
    console.log("Total Bookings in Database:", count);

    const bookings = await Booking.find({}).limit(10).lean();
    bookings.forEach(b => {
      console.log(`- ID: ${b._id}, BookingNumber: ${b.bookingNumber}, VendorId: ${b.vendorId}, Status: ${b.status}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
