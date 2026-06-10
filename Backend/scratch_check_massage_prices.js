const mongoose = require('mongoose');
require('dotenv').config();

// Register schemas
require('./models/Category');
require('./models/SubCategory');
require('./models/Service');
require('./models/City');
require('./models/PricingConfig');
require('./models/ServiceBrandPricing');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log('Connected to DB');

  const Service = mongoose.model('Service');
  const PricingConfig = mongoose.model('PricingConfig');
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing');

  const services = await Service.find({ title: /massage/i });
  console.log('Services matching "massage":', services.map(s => ({ id: s._id, title: s.title, serviceType: s.serviceType, pricePerMinute: s.pricePerMinute, price: s.price, minimumMinutes: s.minimumMinutes })));

  if (services.length > 0) {
    const sId = services[0]._id;
    const configs = await PricingConfig.find({ serviceId: sId }).populate('categoryId').populate('cityId');
    console.log('PricingConfigs:', configs.map(c => ({
      id: c._id,
      city: c.cityId?.name,
      customerPrice: c.customerPrice,
      pricePerMinute: c.pricePerMinute,
      minimumMinutes: c.minimumMinutes,
      pricingType: c.pricingType
    })));

    const pricings = await ServiceBrandPricing.find({ serviceId: sId }).populate('cityId');
    console.log('ServiceBrandPricings:', pricings.map(p => ({
      id: p._id,
      city: p.cityId?.name,
      basePrice: p.basePrice,
      finalCustomerPrice: p.finalCustomerPrice,
      isActive: p.isActive
    })));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
