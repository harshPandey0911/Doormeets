require('mongoose').connect('mongodb://localhost:27017/civilconnect').then(async () => {
  const Service = require('./models/Service');
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');
  const brandId = '6a103215ca864728ce8f6fcd'; // Example brandId
  const categoryId = '6a102f889c9f3a4b5fa77db1';
  
  const services = await Service.find({ categoryId: categoryId, status: 'active' }).lean();
  console.log('services:', services);
  
  const serviceIds = services.map(s => s._id);
  const pricings = await ServiceBrandPricing.find({
    categoryId: categoryId,
    brandId: brandId,
    serviceId: { $in: serviceIds },
    isActive: true
  }).lean();
  
  console.log('pricings count:', pricings.length);
  process.exit();
});
