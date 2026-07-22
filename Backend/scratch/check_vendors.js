const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets';

async function run() {
  try {
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    const Vendor = require('../models/Vendor');
    const vendors = await Vendor.find({}).lean();
    console.log(`Total vendors: ${vendors.length}`);
    for (const v of vendors) {
      console.log(`Vendor: ${v.name} (${v._id})`);
      console.log(`- approvalStatus: ${v.approvalStatus}`);
      console.log(`- isSubscriptionActive: ${v.isSubscriptionActive}`);
      console.log(`- subscription:`, v.subscription);
      console.log(`- service count: ${v.service?.length || 0}`);
      console.log(`- categories count: ${v.categories?.length || 0}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
