const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testPricingMatch() {
  await mongoose.connect(process.env.MONGODB_URI);
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));

  const serviceId = new mongoose.Types.ObjectId('6a6efaf9b577f89b18e01bc5');
  const sbPricings = await ServiceBrandPricing.find({ serviceId, isActive: true }).lean();
  const configPricings = await PricingConfig.find({ serviceId, isActive: { $ne: false } }).lean();

  const pricings = [
    ...sbPricings,
    ...configPricings.map(c => ({
      serviceId: c.serviceId,
      variantId: c.variantId || null,
      zoneId: c.zoneId || null,
      customerPrice: c.customerPrice,
      finalCustomerPrice: c.customerPrice,
      basePrice: c.customerPrice,
      gstPercentage: c.gstPercentage || 18,
      isActive: c.isActive !== false
    }))
  ];

  const variantId = '6a6efaf9b577f89b18e01bc6';
  const resolvedZoneId = '6a719af5391c02327f3f1107'; // Gondia Zone

  console.log('=== TEST WITH ZONE (Jaistambh, Gondia) ===');
  let vPricingZone = pricings.find(p =>
    p.serviceId.toString() === serviceId.toString() &&
    p.variantId && p.variantId.toString() === variantId &&
    p.zoneId && p.zoneId.toString() === resolvedZoneId.toString()
  );
  console.log('Found pricing with zone:', vPricingZone ? (vPricingZone.customerPrice ?? vPricingZone.finalCustomerPrice) : 'null');
  console.log('From doc _id:', vPricingZone ? vPricingZone._id : null);

  console.log('\n=== TEST WITHOUT ZONE (resolvedZoneId = null) ===');
  let vPricingNoZone = pricings.find(p =>
    p.serviceId.toString() === serviceId.toString() &&
    p.variantId && p.variantId.toString() === variantId &&
    (!p.zoneId || p.zoneId === null)
  );
  console.log('Found pricing without zone:', vPricingNoZone ? (vPricingNoZone.customerPrice ?? vPricingNoZone.finalCustomerPrice) : 'null');
  console.log('From doc _id:', vPricingNoZone ? vPricingNoZone._id : null);

  await mongoose.disconnect();
}

testPricingMatch().catch(console.error);
