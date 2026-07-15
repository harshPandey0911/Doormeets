const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const bookingNum = "BK1784099197586IFODN";
    const booking = await Booking.findOne({ bookingNumber: bookingNum }).lean();
    
    console.log("Booking details:", JSON.stringify(booking, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
