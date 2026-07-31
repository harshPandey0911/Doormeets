const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Settings = require('./models/Settings');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const settings = await Settings.findOne({ type: 'global' });
  console.log('Global Settings:', settings);
  await mongoose.disconnect();
}
run();
