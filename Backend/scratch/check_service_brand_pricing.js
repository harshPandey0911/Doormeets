const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const ServiceBrandPricing = require('../models/ServiceBrandPricing');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("=== ServiceBrandPricing ===");
    const pricings = await ServiceBrandPricing.find({ serviceId: '6a3a6f03b357f7e9d9e7d742' });
    console.log(JSON.stringify(pricings, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
