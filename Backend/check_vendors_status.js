require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const vendors = await Vendor.find({}).lean();
  vendors.forEach(v => {
    console.log(`\nVendor: ${v.name} (${v.phone})`);
    console.log(`ID: ${v._id}`);
    console.log(`Approval: ${v.approvalStatus}, isActive: ${v.isActive}`);
    console.log(`isOnline: ${v.isOnline}, availabilityStatus: ${v.availabilityStatus}, availability: ${v.availability}`);
    console.log(`Categories:`, v.categories);
    console.log(`Service:`, v.service);
    console.log(`Wallet Dues: ${v.wallet?.dues}, CashLimit: ${v.wallet?.cashLimit}, Earnings: ${v.wallet?.earnings}`);
    console.log(`GeoLocation:`, JSON.stringify(v.geoLocation));
    console.log(`Address:`, JSON.stringify(v.address));
  });
  process.exit(0);
}

run();
