const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const Service = require('../models/Service');
const ServiceBrandPricing = require('../models/ServiceBrandPricing');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("=== Service: All Services ===");
    const svc = await Service.findOne({ title: 'All Services' });
    if (svc) {
      console.log(JSON.stringify(svc, null, 2));
      
      console.log("\n=== ServiceBrandPricing ===");
      const pricings = await ServiceBrandPricing.find({ serviceId: svc._id });
      console.log(JSON.stringify(pricings, null, 2));
    } else {
      console.log("Service not found");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
