const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const PricingConfig = require('../models/PricingConfig');
  const pricings = await PricingConfig.find({ serviceId: '6a58a3a8f5060e5d99eb7a10' }).lean();

  console.log("PricingConfigs for nice cut:");
  console.log(JSON.stringify(pricings, null, 2));

  await mongoose.connection.close();
}

run().catch(console.error);
