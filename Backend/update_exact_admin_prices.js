const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function updateDbToExactAdminPrices() {
  await mongoose.connect(mongoUri);
  const PricingConfig = require('./models/PricingConfig');
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');

  console.log('--- PricingConfig records ---');
  const configs = await PricingConfig.find().lean();
  for (let c of configs) {
    console.log({
      id: c._id,
      serviceId: c.serviceId,
      variantId: c.variantId,
      customerPrice: c.customerPrice
    });
  }

  console.log('\n--- Updating ServiceBrandPricing to match PricingConfig.customerPrice ---');
  for (let c of configs) {
    await ServiceBrandPricing.updateOne(
      {
        serviceId: c.serviceId,
        variantId: c.variantId || null
      },
      {
        $set: {
          finalCustomerPrice: Number(c.customerPrice)
        }
      }
    );
  }

  const pricings = await ServiceBrandPricing.find({ categoryId: '6a6eeeadb577f89b18e00f78' }).lean();
  console.log('\nUpdated ServiceBrandPricing records:');
  pricings.forEach(p => {
    console.log({
      serviceId: p.serviceId,
      variantId: p.variantId,
      finalCustomerPrice: p.finalCustomerPrice
    });
  });

  await mongoose.disconnect();
}

updateDbToExactAdminPrices();
