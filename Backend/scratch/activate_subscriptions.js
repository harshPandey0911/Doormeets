const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets';

async function run() {
  try {
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    const Vendor = require('../models/Vendor');
    
    // Set active subscription for all vendors
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const result = await Vendor.updateMany(
      {},
      {
        $set: {
          isSubscriptionActive: true,
          'subscription.status': 'active',
          'subscription.startDate': new Date(),
          'subscription.endDate': oneMonthFromNow,
          'subscription.planId': new mongoose.Types.ObjectId('6a104c1b3d43e108a60857ee')
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} vendors to have active subscriptions.`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
