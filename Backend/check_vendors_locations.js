require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const vendors = await Vendor.find({}).lean();
  console.log(`Found ${vendors.length} vendors`);
  console.log(JSON.stringify(vendors.map(v => ({
    name: v.name,
    businessName: v.businessName,
    isOnline: v.isOnline,
    location: v.location,
    address: v.address,
    geoLocation: v.geoLocation
  })), null, 2));
  process.exit(0);
}

check();
