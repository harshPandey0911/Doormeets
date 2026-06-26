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

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');
  
  const categoryId = '6a28ffd9d65b14fa11ce393e'; // salon
  const serviceId = '6a3cd0d7b06a136f3bf6fd17'; // Mens and kids salon
  
  // Check if pricing already exists
  const existing = await ServiceBrandPricing.findOne({ serviceId });
  if (existing) {
    console.log('Pricing already exists:', existing);
  } else {
    const pricing = await ServiceBrandPricing.create({
      categoryId,
      subCategoryId: null,
      serviceId,
      brandId: null,
      basePrice: 100, // default placeholder base price
      gstPercentage: 18,
      vendorProfit: 50, // placeholder profit
      isActive: true
    });
    console.log('Pricing created successfully:', pricing);
  }
  
  process.exit(0);
}

run();
