const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const Worker = require('../models/Worker');
    const workers = await Worker.find({}).lean();
    for (const w of workers) {
      console.log(`Worker: ${w.name}, status: ${w.status}, isActive: ${w.isActive}, approvalStatus: ${w.approvalStatus}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
