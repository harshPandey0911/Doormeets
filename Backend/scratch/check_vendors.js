const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const Vendor = require('../models/Vendor');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("=== Vendors ===");
    const vendors = await Vendor.find({});
    for (const v of vendors) {
      console.log(`- Name: ${v.name}, isOnline: ${v.isOnline}, workStatus: ${v.workStatus}, categories: ${JSON.stringify(v.categories)}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
