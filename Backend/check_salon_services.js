const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

async function inspect() {
  await mongoose.connect(env.MONGODB_URI);
  const Service = require('./models/Service');
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');
  const Category = require('./models/Category');
  const Brand = require('./models/Brand');

  const catId = '6a28ffd9d65b14fa11ce393e';
  
  const category = await Category.findById(catId);
  console.log('Category found:', category ? category.title : 'NOT FOUND');

  const brands = await Brand.find({
    $or: [
      { categoryIds: catId },
      { categoryId: catId }
    ]
  });
  console.log(`Brands in Category (${brands.length}):`, brands.map(b => b.title));

  const services = await Service.find({ categoryId: catId });
  console.log(`Services in Category (${services.length}):`);
  services.forEach(s => {
    console.log(`- Service Title: ${s.title}, ID: ${s._id}, status: ${s.status}, brandId: ${s.brandId}`);
  });

  const pricings = await ServiceBrandPricing.find({ categoryId: catId });
  console.log(`Pricings in Category (${pricings.length}):`);
  pricings.forEach(p => {
    console.log(`- Pricing ID: ${p._id}, serviceId: ${p.serviceId}, brandId: ${p.brandId}, isActive: ${p.isActive}`);
  });

  process.exit(0);
}

inspect();
