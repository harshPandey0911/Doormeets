const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function syncSwitchSocketPricing() {
  await mongoose.connect(process.env.MONGODB_URI);
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));

  const res1 = await PricingConfig.updateOne(
    { _id: new mongoose.Types.ObjectId('6a6efdc58611f8f7de0bd86e') },
    { $set: { customerPrice: 57 } }
  );
  const res2 = await ServiceBrandPricing.updateOne(
    { _id: new mongoose.Types.ObjectId('6a72d3510693402fe4d2eb5e') },
    { $set: { finalCustomerPrice: 57, basePrice: 57 } }
  );

  console.log('Updated PricingConfig:', res1);
  console.log('Updated ServiceBrandPricing:', res2);

  await mongoose.disconnect();
}

syncSwitchSocketPricing().catch(console.error);
