const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Vendor = require('./models/Vendor');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const vendors = await Vendor.find({ isOnline: true });
  for (const v of vendors) {
    console.log('Vendor:', {
      id: v._id,
      name: v.name,
      businessName: v.businessName,
      approvalStatus: v.approvalStatus,
      isActive: v.isActive,
      categories: v.categories,
      isBlocked: v.wallet?.isBlocked,
    });
  }
  await mongoose.disconnect();
}
run();
