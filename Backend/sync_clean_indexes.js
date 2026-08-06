const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function syncAllCleanIndexes() {
  await mongoose.connect(process.env.MONGODB_URI);
  const PricingConfig = require('./models/PricingConfig');
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');

  try {
    await PricingConfig.collection.dropIndexes();
  } catch (e) {}
  try {
    await ServiceBrandPricing.collection.dropIndexes();
  } catch (e) {}

  await PricingConfig.syncIndexes();
  await ServiceBrandPricing.syncIndexes();

  console.log('Re-synced schema indexes without cityId!');

  await PricingConfig.updateMany({}, { $unset: { cityId: 1 } });
  await ServiceBrandPricing.updateMany({}, { $unset: { cityId: 1 } });

  console.log('Successfully unset cityId from all pricing documents.');
  await mongoose.disconnect();
}

syncAllCleanIndexes().catch(console.error);
