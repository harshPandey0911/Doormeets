const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const Worker = require('../models/Worker');
    const worker = await Worker.findOne({ phone: '8817921168' });
    if (worker) {
      worker.serviceCategories = ['6a645a9e7525f78953e9a13d', '6a672be03c5df013cb20f37d'];
      await worker.save();
      console.log("Successfully assigned Beauty Packages and plant to Isha kumari!");
    } else {
      console.log("Worker Isha kumari not found.");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
