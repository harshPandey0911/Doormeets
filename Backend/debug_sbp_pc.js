const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkPricingsOrder() {
  await mongoose.connect(process.env.MONGODB_URI);
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));

  const serviceId = new mongoose.Types.ObjectId('6a6efaf9b577f89b18e01bc5');
  const sbPricings = await ServiceBrandPricing.find({ serviceId, isActive: true }).lean();
  const configPricings = await PricingConfig.find({ serviceId, isActive: { $ne: false } }).lean();

  console.log('=== ServiceBrandPricing items ===');
  sbPricings.forEach(p => console.log('SBP:', p._id, 'variantId:', p.variantId, 'zoneId:', p.zoneId, 'finalCustomerPrice:', p.finalCustomerPrice, 'customerPrice:', p.customerPrice));

  console.log('\n=== PricingConfig items ===');
  configPricings.forEach(p => console.log('PC:', p._id, 'variantId:', p.variantId, 'zoneId:', p.zoneId, 'customerPrice:', p.customerPrice));

  await mongoose.disconnect();
}
checkPricingsOrder().catch(console.error);
