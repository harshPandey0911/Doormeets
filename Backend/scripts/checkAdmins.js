const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

dotenv.config();

const check = async () => {
  try {
    await connectDB();
    const admins = await Admin.find({}, 'name email role isActive');
    console.log('--- ADMINS IN DATABASE ---');
    console.log(JSON.stringify(admins, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(0);
  }
};

check();
