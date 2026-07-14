const mongoose = require('mongoose');
const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

// Register models
const User = require('../models/User');
const Worker = require('../models/Worker');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // 1. Time query with select, populate AND lean
    const startSelect = Date.now();
    const bookingsSelect = await Booking.find({})
      .select('bookingNumber userId workerId serviceId bookingDate bookingSlot finalAmount status createdAt')
      .populate('userId', 'name phone email')
      .populate('workerId', 'name phone')
      .populate('serviceId', 'title')
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(20)
      .lean();
    console.log("Query with SELECT & LEAN took:", Date.now() - startSelect, "ms. Items:", bookingsSelect.length);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
