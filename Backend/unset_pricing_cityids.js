const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function removeCityIdFromPricings() {
  await mongoose.connect(process.env.MONGODB_URI);
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));

  const pcRes = await PricingConfig.updateMany({}, { $unset: { cityId: 1 } });
  console.log('Unset cityId from PricingConfig:', pcRes);

  const sbpRes = await ServiceBrandPricing.updateMany({}, { $unset: { cityId: 1 } });
  console.log('Unset cityId from ServiceBrandPricing:', sbpRes);

  await mongoose.disconnect();
}

removeCityIdFromPricings().catch(console.error);
