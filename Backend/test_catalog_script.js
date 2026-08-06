const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testPublicServices() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }));
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));

  const cat = await Category.findOne({ slug: 'electrician' }).lean();
  const svcs = await Service.find({ categoryId: cat._id, status: 'active' }).lean();
  console.log('Active services count:', svcs.length);
  svcs.forEach(s => console.log('Svc:', s._id, s.title, 'variants:', s.variants));

  const pricings = await ServiceBrandPricing.find({ serviceId: { $in: svcs.map(s => s._id) } }).lean();
  console.log('Pricings found for services:', pricings);

  await mongoose.disconnect();
}
testPublicServices().catch(console.error);
