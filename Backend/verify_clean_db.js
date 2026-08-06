const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function verifyCleanDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  const PricingConfig = require('./models/PricingConfig');
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');

  const pcWithCity = await PricingConfig.countDocuments({ cityId: { $ne: null } });
  const sbpWithCity = await ServiceBrandPricing.countDocuments({ cityId: { $ne: null } });

  console.log('PricingConfigs with cityId:', pcWithCity);
  console.log('ServiceBrandPricings with cityId:', sbpWithCity);

  const doc = await PricingConfig.findById('6a6edd0f1811e76bec9a8d95').lean();
  console.log('Doc 6a6edd0f1811e76bec9a8d95 keys:', Object.keys(doc));
  console.log('zoneId present:', doc.zoneId);

  await mongoose.disconnect();
}
verifyCleanDatabase().catch(console.error);
