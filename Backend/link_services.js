const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets').then(async () => {
  const Vendor = require('./models/Vendor');
  const Brand = require('./models/Brand');
  const Service = require('./models/Service');
  const vendor = await Vendor.findOne();
  if (!vendor) {
    console.log('No vendor found');
    process.exit(1);
  }
  console.log('Updating for vendor:', vendor.name);
  await Brand.updateMany({ vendorId: null }, { $set: { vendorId: vendor._id } });
  await Service.updateMany({ vendorId: null }, { $set: { vendorId: vendor._id } });
  console.log('Updated Brands and Services with vendorId');
  process.exit(0);
});
