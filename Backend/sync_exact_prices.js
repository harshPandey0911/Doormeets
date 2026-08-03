const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function syncPrices() {
  await mongoose.connect(mongoUri);
  const PricingConfig = require('./models/PricingConfig');
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');

  const configs = await PricingConfig.find().lean();
  console.log(`Found ${configs.length} PricingConfig records.`);

  for (let cfg of configs) {
    const update = {
      finalCustomerPrice: Number(cfg.customerPrice)
    };
    await ServiceBrandPricing.updateOne(
      {
        categoryId: cfg.categoryId,
        subCategoryId: cfg.subCategoryId,
        serviceId: cfg.serviceId,
        brandId: cfg.brandId,
        cityId: cfg.cityId,
        variantId: cfg.variantId || null
      },
      { $set: update }
    );
  }

  console.log('Successfully synced exact customerPrice from PricingConfig to ServiceBrandPricing.');
  await mongoose.disconnect();
}

syncPrices();
