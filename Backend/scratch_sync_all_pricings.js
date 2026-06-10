const mongoose = require('mongoose');
require('dotenv').config();

// Register schemas
require('./models/Category');
require('./models/SubCategory');
require('./models/Service');
require('./models/City');
require('./models/PricingConfig');
require('./models/ServiceBrandPricing');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log('Connected to DB');

  const PricingConfig = mongoose.model('PricingConfig');
  const configs = await PricingConfig.find({});
  console.log(`Syncing ${configs.length} pricing configs...`);

  for (const config of configs) {
    // Calling save() triggers the post('save') hook
    await config.save();
  }

  console.log('Sync complete!');
  await mongoose.disconnect();
}

run().catch(console.error);
