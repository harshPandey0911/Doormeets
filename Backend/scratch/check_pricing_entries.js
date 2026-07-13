require('dotenv').config();
const mongoose = require('mongoose');

async function checkDB() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const serviceId = new mongoose.Types.ObjectId('6a549a59a4d568fa49ca2bd1');

    const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }), 'servicebrandpricings');
    const pricings = await ServiceBrandPricing.find({ serviceId }).lean();
    console.log('ServiceBrandPricing entries found:', pricings.map(p => ({
      _id: p._id,
      cityId: p.cityId,
      variantId: p.variantId,
      basePrice: p.basePrice,
      finalCustomerPrice: p.finalCustomerPrice
    })));

    const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }), 'pricingconfigs');
    const configs = await PricingConfig.find({ serviceId }).lean();
    console.log('PricingConfig entries found:', configs.map(c => ({
      _id: c._id,
      cityId: c.cityId,
      variantId: c.variantId,
      customerPrice: c.customerPrice
    })));

    const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }), 'services');
    const srv = await Service.findById(serviceId).lean();
    console.log('Service variants from DB:', srv?.variants?.map(v => ({ id: v._id, title: v.title, extraPrice: v.extraPrice })));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDB();
