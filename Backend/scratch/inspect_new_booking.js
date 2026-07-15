const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const bookingNum = "BK1784098618950CTELY";
    const booking = await Booking.findOne({ bookingNumber: bookingNum }).lean();
    
    if (!booking) {
      console.log(`Booking with number ${bookingNum} not found!`);
      await mongoose.disconnect();
      return;
    }

    console.log("Booking details:", JSON.stringify(booking, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
