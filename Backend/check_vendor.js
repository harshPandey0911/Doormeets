require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Vendor = require('./models/Vendor');
  const vendor = await Vendor.findOne({ isDeleted: { $ne: true } }).sort({createdAt: -1});
  
  if (!vendor) {
    console.log("No vendor found");
  } else {
    console.log(JSON.stringify({
      name: vendor.name,
      approvalStatus: vendor.approvalStatus,
      isActive: vendor.isActive,
      isOnline: vendor.isOnline,
      availability: vendor.availability,
      categories: vendor.categories,
      address: vendor.address,
      geoLocation: vendor.geoLocation,
      isDeleted: vendor.isDeleted,
      wallet: vendor.wallet
    }, null, 2));
  }
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
