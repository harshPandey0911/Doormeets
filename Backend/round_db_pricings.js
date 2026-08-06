const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doormeets';

async function cleanPricings() {
  await mongoose.connect(MONGODB_URI);
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));

  const configs = await PricingConfig.find({}).lean();
  for (const c of configs) {
    const updatedBase = Math.round(c.vendorPayoutBase || 0);
    const updatedExtra = Math.round(c.vendorPayoutExtra || 0);
    const updatedFee = Math.round(c.vendorAcceptanceFee || 0);
    await PricingConfig.updateOne({ _id: c._id }, {
      vendorPayoutBase: updatedBase,
      vendorPayoutExtra: updatedExtra,
      vendorAcceptanceFee: updatedFee
    });
  }

  const sbPricings = await ServiceBrandPricing.find({}).lean();
  for (const s of sbPricings) {
    const updatedBase = Math.round(s.basePrice || s.finalCustomerPrice || 0);
    await ServiceBrandPricing.updateOne({ _id: s._id }, {
      basePrice: updatedBase,
      finalCustomerPrice: updatedBase
    });
  }

  console.log('Successfully rounded all existing pricing records in database.');
  await mongoose.disconnect();
}

cleanPricings().catch(console.error);
