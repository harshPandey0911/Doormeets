const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const txs = await Transaction.find({ bookingId: new mongoose.Types.ObjectId('6a57462dffc68bdf1883593e') }).lean();
    console.log("Transactions found for booking:", txs);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
