const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  const users = await User.find({}).select('name email phone').lean();
  console.log("Users found in database:", JSON.stringify(users, null, 2));
  mongoose.disconnect();
}

check();
