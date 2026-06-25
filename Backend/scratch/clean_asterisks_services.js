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
    
    console.log("=== Finding services with asterisks and formatting/removing them ===");
    const services = await Service.find({});
    for (const svc of services) {
      if (svc.description && (svc.description.includes('**') || svc.description.includes('*'))) {
        console.log(`Original Description for "${svc.title}":`, svc.description);
        // Replace all occurrences of double asterisks ** with nothing
        let cleanDesc = svc.description.replace(/\*\*/g, '').trim();
        // Also clean up leading newline/whitespace if it left an empty line
        cleanDesc = cleanDesc.replace(/^\n+/, '').trim();
        
        svc.description = cleanDesc;
        await svc.save();
        console.log(`Updated Description for "${svc.title}":`, svc.description);
      }
    }

    console.log("Done updating descriptions.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
