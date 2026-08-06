const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doormeets';

async function migratePricings() {
  await mongoose.connect(MONGODB_URI);
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));

  const pricings = await PricingConfig.find({ zoneId: null }).lean();
  console.log('Found unmigrated pricings:', pricings.length);

  let updatedCount = 0;

  for (const prc of pricings) {
    if (!prc.categoryId) continue;
    const cat = await Category.findById(prc.categoryId).lean();
    if (cat && Array.isArray(cat.zoneIds) && cat.zoneIds.length > 0) {
      const targetZoneId = cat.zoneIds[0]; // Assign to the first zone of the category
      console.log(`Migrating Pricing ${prc._id} (Cat: ${cat.title}) -> Zone: ${targetZoneId}`);

      await PricingConfig.updateOne({ _id: prc._id }, { zoneId: targetZoneId });
      await ServiceBrandPricing.updateOne(
        { categoryId: prc.categoryId, serviceId: prc.serviceId, variantId: prc.variantId || null },
        { zoneId: targetZoneId }
      );
      updatedCount++;
    }
  }

  console.log(`Successfully migrated ${updatedCount} pricing entries to category zones.`);
  await mongoose.disconnect();
}

migratePricings().catch(console.error);
