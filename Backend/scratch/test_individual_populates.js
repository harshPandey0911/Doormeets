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

    // 1. Time query WITHOUT populate
    const startFind = Date.now();
    const bookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(20)
      .lean();
    console.log("Booking.find took:", Date.now() - startFind, "ms");

    const userIds = bookings.map(b => b.userId).filter(Boolean);
    const workerIds = bookings.map(b => b.workerId).filter(Boolean);
    const serviceIds = bookings.map(b => b.serviceId).filter(Boolean);

    // 2. Time User.find
    const startUser = Date.now();
    const users = await User.find({ _id: { $in: userIds } }).lean();
    console.log("User.find took:", Date.now() - startUser, "ms. Found:", users.length);

    // 3. Time Worker.find
    const startWorker = Date.now();
    const workers = await Worker.find({ _id: { $in: workerIds } }).lean();
    console.log("Worker.find took:", Date.now() - startWorker, "ms. Found:", workers.length);

    // 4. Time Service.find
    const startService = Date.now();
    const services = await Service.find({ _id: { $in: serviceIds } }).lean();
    console.log("Service.find took:", Date.now() - startService, "ms. Found:", services.length);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
