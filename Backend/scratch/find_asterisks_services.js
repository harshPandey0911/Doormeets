const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const Service = require('../models/Service');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("=== Finding all active services with double asterisks ===");
    const services = await Service.find({});
    for (const svc of services) {
      if (svc.description && (svc.description.includes('**') || svc.description.includes('*'))) {
        console.log(`FOUND Service ID: ${svc._id}, Title: "${svc.title}"`);
        console.log(`Description: "${svc.description}"\n`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
