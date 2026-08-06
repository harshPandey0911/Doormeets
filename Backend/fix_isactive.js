const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixExistingConfigs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));
  const res = await PricingConfig.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });
  console.log('Updated existing configs isActive:', res);
  await mongoose.disconnect();
}
fixExistingConfigs().catch(console.error);
