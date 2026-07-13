require('dotenv').config();
const mongoose = require('mongoose');

async function debugAllPricings() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }), 'servicebrandpricings');
    const pricings = await ServiceBrandPricing.find({}).lean();
    console.log('ALL ServiceBrandPricing entries:', pricings.map(p => ({
      _id: p._id,
      serviceId: p.serviceId,
      cityId: p.cityId,
      variantId: p.variantId,
      basePrice: p.basePrice,
      finalCustomerPrice: p.finalCustomerPrice
    })));

    const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }), 'pricingconfigs');
    const configs = await PricingConfig.find({}).lean();
    console.log('ALL PricingConfig entries:', configs.map(c => ({
      _id: c._id,
      serviceId: c.serviceId,
      cityId: c.cityId,
      variantId: c.variantId,
      customerPrice: c.customerPrice
    })));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

debugAllPricings();
