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

    // 1. Time query with populate AND lean
    const startLean = Date.now();
    const bookingsLean = await Booking.find({})
      .populate('userId', 'name phone email')
      .populate('workerId', 'name phone')
      .populate('serviceId', 'title')
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(20)
      .lean();
    console.log("Query with LEAN took:", Date.now() - startLean, "ms. Items:", bookingsLean.length);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
