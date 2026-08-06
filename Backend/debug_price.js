const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));
  const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }));

  const serviceId = '6a72f9a0f3a9d56c16150f2c';
  const service = await Service.findById(serviceId).lean();

  const configs = await PricingConfig.find({ serviceId: service._id, isActive: true }).lean();

  console.log('\n=== PRICING CONFIGS (isActive: true) ===');
  configs.forEach(c => {
    console.log('  _id:', c._id.toString());
    console.log('  variantId:', c.variantId ? c.variantId.toString() : 'null');
    console.log('  zoneId:', c.zoneId ? c.zoneId.toString() : 'null');
    console.log('  customerPrice:', c.customerPrice);
    console.log('  isActive field in DB:', c.isActive);
    console.log('---');
  });

  // Also check configs WITHOUT isActive filter
  const allConfigs = await PricingConfig.find({ serviceId: service._id }).lean();
  console.log('\n=== ALL PRICING CONFIGS (no isActive filter) ===');
  allConfigs.forEach(c => {
    console.log('  _id:', c._id.toString());
    console.log('  variantId:', c.variantId ? c.variantId.toString() : 'null');
    console.log('  customerPrice:', c.customerPrice);
    console.log('  isActive:', c.isActive);
    console.log('---');
  });

  console.log('\n=== SERVICE VARIANTS ===');
  service.variants.forEach(v => {
    console.log('  variant _id:', v._id.toString());
    console.log('  variant title:', v.title);
    console.log('---');
  });

  // Simulate pricings array build
  const pricings = allConfigs.map(c => ({
    serviceId: c.serviceId,
    variantId: c.variantId || null,
    zoneId: c.zoneId || null,
    customerPrice: c.customerPrice,
    isActive: c.isActive !== false
  }));

  // Try to match for each variant
  service.variants.forEach(v => {
    console.log('\n=== Trying to match variant:', v.title, v._id.toString());
    const match = pricings.find(p =>
      p.serviceId.toString() === service._id.toString() &&
      p.variantId && (p.variantId.toString() === (v._id || v.id || '').toString() || p.variantId.toString() === v.title)
    );
    console.log('  Matched pricing:', match ? `customerPrice: ${match.customerPrice}` : 'NO MATCH');
    if (!match) {
      pricings.forEach(p => {
        console.log('  Checking p.serviceId:', p.serviceId.toString(), '=== svc._id:', service._id.toString(), ':', p.serviceId.toString() === service._id.toString());
        console.log('  p.variantId:', p.variantId ? p.variantId.toString() : 'null');
        console.log('  v._id:', (v._id || '').toString());
        console.log('  Match?', p.variantId && (p.variantId.toString() === (v._id || '').toString()));
      });
    }
  });

  await mongoose.disconnect();
}

debug().catch(console.error);
