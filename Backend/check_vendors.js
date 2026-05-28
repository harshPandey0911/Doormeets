require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const vendors = await Vendor.find({}).lean();
  console.log(`Found ${vendors.length} vendors`);
  console.log(JSON.stringify(vendors.map(v => ({ id: v._id, name: v.name, phone: v.phone, approvalStatus: v.approvalStatus, policeVerification: v.policeVerification })), null, 2));
  process.exit(0);
}

check();
