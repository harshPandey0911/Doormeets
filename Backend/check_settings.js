const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Settings = require('./models/Settings');
const PricingConfig = require('./models/PricingConfig');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const settings = await Settings.findOne({ type: 'global' });
  console.log('Settings:', settings);
  
  const pricings = await PricingConfig.find();
  console.log('Pricings:', pricings);

  await mongoose.disconnect();
}
run();
