const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrateAllNullZonePricings() {
  await mongoose.connect(process.env.MONGODB_URI);
  const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));
  const ServiceBrandPricing = mongoose.model('ServiceBrandPricing', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const Zone = mongoose.model('Zone', new mongoose.Schema({}, { strict: false }));

  const configsWithoutZone = await PricingConfig.find({
    $or: [
      { zoneId: { $exists: false } },
      { zoneId: null }
    ]
  }).lean();

  console.log('Total configs missing zoneId:', configsWithoutZone.length);

  for (const c of configsWithoutZone) {
    const cat = await Category.findById(c.categoryId).lean();
    let targetZoneId = null;

    if (cat && Array.isArray(cat.zoneIds) && cat.zoneIds.length > 0) {
      targetZoneId = cat.zoneIds[0];
    } else {
      const firstZone = await Zone.findOne({ isActive: true }).lean();
      if (firstZone) targetZoneId = firstZone._id;
    }

    if (targetZoneId) {
      await PricingConfig.updateOne(
        { _id: c._id },
        { zoneId: targetZoneId }
      );

      await ServiceBrandPricing.updateMany(
        {
          categoryId: c.categoryId,
          serviceId: c.serviceId,
          variantId: c.variantId || null,
          $or: [
            { zoneId: { $exists: false } },
            { zoneId: null }
          ]
        },
        { zoneId: targetZoneId }
      );

      console.log('Migrated config', c._id, '-> assigned zoneId:', targetZoneId);
    }
  }

  console.log('Finished migrating all pricing records with missing zoneId.');
  await mongoose.disconnect();
}

migrateAllNullZonePricings().catch(console.error);
