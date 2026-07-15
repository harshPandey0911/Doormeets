const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const userId = "6a100ce6b4d5de086f4f61d4";
    const user = await User.findById(userId).lean();
    console.log("User wallet info:", JSON.stringify(user?.wallet, null, 2));

    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10).lean();
    console.log("Recent Transactions:", JSON.stringify(transactions, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
