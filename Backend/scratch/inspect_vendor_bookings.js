const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const vendorId = "6a13fdd2381a994f1815879a";
    console.log("Searching for bookings with vendorId:", vendorId);

    const bookings = await Booking.find({ vendorId }).lean();
    console.log(`Found ${bookings.length} bookings for vendor:`);

    bookings.forEach(b => {
      console.log(`- ID: ${b._id}, BookingNumber: ${b.bookingNumber}, Status: ${b.status}, isSelfJob: ${b.isSelfJob}, scheduledDate: ${b.scheduledDate}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
