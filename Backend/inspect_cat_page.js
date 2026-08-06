const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function inspectCategoryPage() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }));
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));

  const cat = await Category.findOne({ slug: 'electrician' }).lean();
  const svcs = await Service.find({ categoryId: cat._id, status: 'active' }).lean();
  const pricings = await ServiceBrandPricing.find({ serviceId: { $in: svcs.map(s => s._id) }, isActive: true }).lean();

  console.log('Category:', cat.title);
  console.log('Services:', svcs.length);
  svcs.forEach(s => {
    const sPricings = pricings.filter(p => p.serviceId.toString() === s._id.toString());
    console.log('Svc:', s.title, 'Variants:', s.variants.map(v => ({ id: v._id, title: v.title })));
    console.log('Pricings for svc:', sPricings.map(p => ({ variantId: p.variantId, zoneId: p.zoneId, price: p.finalCustomerPrice })));
  });

  await mongoose.disconnect();
}
inspectCategoryPage().catch(console.error);
