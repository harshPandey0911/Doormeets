const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const booking = await Booking.findOne({ bookingNumber: 'BK178410449339358ILJ' });
    console.log("Loaded booking via Mongoose model:", booking);
    console.log("booking.bookingType:", booking.bookingType);
    console.log("booking.instantMarkupCharged:", booking.instantMarkupCharged);

    const instantMarkup = booking.bookingType === 'instant' ? (parseFloat(booking.instantMarkupCharged) || 0) : 0;
    console.log("Calculated instantMarkup:", instantMarkup);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
