const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function dedupAndClean() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const PricingConfig = require('./models/PricingConfig');
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');

  // Drop old indexes
  try { await PricingConfig.collection.dropIndexes(); } catch (e) {}
  try { await ServiceBrandPricing.collection.dropIndexes(); } catch (e) {}

  // Remove cityId from existing documents
  await PricingConfig.updateMany({}, { $unset: { cityId: 1 } });
  await ServiceBrandPricing.updateMany({}, { $unset: { cityId: 1 } });

  // Deduplicate ServiceBrandPricing entries
  const docs = await ServiceBrandPricing.find({}).sort({ updatedAt: -1 }).lean();
  const seenKeys = new Set();
  for (const doc of docs) {
    const key = `${doc.categoryId}_${doc.subCategoryId}_${doc.serviceId}_${doc.brandId}_${doc.zoneId}_${doc.variantId}`;
    if (seenKeys.has(key)) {
      console.log('Removing duplicate ServiceBrandPricing:', doc._id);
      await ServiceBrandPricing.deleteOne({ _id: doc._id });
    } else {
      seenKeys.add(key);
    }
  }

  // Deduplicate PricingConfig entries
  const pcDocs = await PricingConfig.find({}).sort({ updatedAt: -1 }).lean();
  const seenPcKeys = new Set();
  for (const doc of pcDocs) {
    const key = `${doc.categoryId}_${doc.subCategoryId}_${doc.serviceId}_${doc.brandId}_${doc.zoneId}_${doc.packageTitle}_${doc.variantId}`;
    if (seenPcKeys.has(key)) {
      console.log('Removing duplicate PricingConfig:', doc._id);
      await PricingConfig.deleteOne({ _id: doc._id });
    } else {
      seenPcKeys.add(key);
    }
  }

  // Sync new clean indexes
  await PricingConfig.syncIndexes();
  await ServiceBrandPricing.syncIndexes();

  console.log('Deduplication & index sync without cityId finished successfully!');
  await mongoose.disconnect();
}

dedupAndClean().catch(console.error);
