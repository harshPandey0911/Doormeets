const mongoose = require('mongoose');
const Service = require('../models/Service');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const service = await Service.findOne({ title: 'Mens and kids salon' }).lean();
    if (service) {
      console.log("Service details:", {
        _id: service._id,
        title: service.title,
        basePrice: service.basePrice,
        discountPrice: service.discountPrice,
        packages: service.packages
      });
    } else {
      console.log("Service not found");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
