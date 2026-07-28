require('mongoose').connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority').then(async () => {
  const Vendor = require('./models/Vendor');
  const vendors = await Vendor.find({}).select('businessName categories service isOnline');
  console.log('Vendors:', JSON.stringify(vendors, null, 2));
  process.exit();
}).catch(console.error);
