const mongoose = require('mongoose');
const VendorBill = require('../models/VendorBill');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const bill = await VendorBill.findOne({ bookingId: new mongoose.Types.ObjectId('6a57462dffc68bdf1883593e') }).lean();
    console.log("VendorBill full document:", bill);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
