const mongoose = require('mongoose');
const dns = require('dns');

// Force DNS resolution to use public DNS servers (prevents querySrv ETIMEOUT issues)
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { ensureProtectedAccounts } = require('../utils/ensureProtectedAccounts');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed and guarantee protected admin accounts on server startup
    await ensureProtectedAccounts();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

