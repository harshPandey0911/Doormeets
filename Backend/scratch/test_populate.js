const mongoose = require('mongoose');
const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

// Require models to register them
const User = require('../models/User');
const Worker = require('../models/Worker');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // 1. Time query with populate
    const startPopulate = Date.now();
    const bookings = await Booking.find({})
      .populate('userId', 'name phone email')
      .populate('workerId', 'name phone')
      .populate('serviceId', 'title')
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(20);
    console.log("Query with populate took:", Date.now() - startPopulate, "ms");
    console.log("Found bookings count:", bookings.length);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
