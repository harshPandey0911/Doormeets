require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const db = mongoose.connection.db;

    // 1. Check pricingconfigs indexes
    const pricingconfigsCol = db.collection('pricingconfigs');
    let indexes = await pricingconfigsCol.indexes();
    console.log('pricingconfigs existing indexes:', indexes);

    // Drop the old index if it exists
    // The old index key is { categoryId: 1, subCategoryId: 1, serviceId: 1, brandId: 1, cityId: 1, packageTitle: 1 } (without variantId)
    // Find index that does not contain variantId
    for (const idx of indexes) {
      if (idx.name !== '_id_' && !idx.key.hasOwnProperty('variantId')) {
        console.log('Found old index without variantId on pricingconfigs:', idx.name);
        try {
          await pricingconfigsCol.dropIndex(idx.name);
          console.log('Successfully dropped old index from pricingconfigs');
        } catch (err) {
          console.error('Error dropping index from pricingconfigs:', err);
        }
      }
    }

    // 2. Check servicebrandpricings indexes
    const servicebrandpricingsCol = db.collection('servicebrandpricings');
    indexes = await servicebrandpricingsCol.indexes();
    console.log('servicebrandpricings existing indexes:', indexes);

    for (const idx of indexes) {
      if (idx.name !== '_id_' && !idx.key.hasOwnProperty('variantId')) {
        console.log('Found old index without variantId on servicebrandpricings:', idx.name);
        try {
          await servicebrandpricingsCol.dropIndex(idx.name);
          console.log('Successfully dropped old index from servicebrandpricings');
        } catch (err) {
          console.error('Error dropping index from servicebrandpricings:', err);
        }
      }
    }

    console.log('Re-creating indexes via Mongoose schemas...');
    // Touch models to trigger index creation
    const PricingConfig = require('../models/PricingConfig');
    const ServiceBrandPricing = require('../models/ServiceBrandPricing');
    await PricingConfig.createIndexes();
    await ServiceBrandPricing.createIndexes();

    console.log('New indexes in pricingconfigs:', await pricingconfigsCol.indexes());
    console.log('New indexes in servicebrandpricings:', await servicebrandpricingsCol.indexes());

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

fixIndexes();
