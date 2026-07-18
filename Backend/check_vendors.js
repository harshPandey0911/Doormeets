require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Vendor = require('./models/Vendor');
  const vendors = await Vendor.find({ isDeleted: { $ne: true } }).sort({createdAt: -1});
  
  if (!vendors.length) {
    console.log("No vendor found");
  } else {
    for(const vendor of vendors) {
      console.log(`Vendor: ${vendor.name} (${vendor.phone})`);
      console.log(`- approvalStatus: ${vendor.approvalStatus}`);
      console.log(`- isOnline: ${vendor.isOnline}`);
      console.log(`- address.city: ${vendor.address?.city}`);
      console.log(`- lat/lng: ${vendor.address?.lat}, ${vendor.address?.lng}`);
      console.log(`- geoLocation: ${JSON.stringify(vendor.geoLocation)}`);
      console.log('---------------------------');
    }
  }
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
