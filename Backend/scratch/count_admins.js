const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const admins = await Admin.find({ role: { $in: ['admin', 'super_admin', 'super-admin', 'ADMIN', 'SUPER_ADMIN'] } }).select('_id name email role').lean();
    console.log(`Found ${admins.length} admins:`);
    admins.forEach(a => console.log(`  ${a._id} | ${a.name} | ${a.email} | role: ${a.role}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
