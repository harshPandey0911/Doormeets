const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Vendor = require('./models/Vendor');
  const Transaction = require('./models/Transaction');
  
  const vendor = await Vendor.findOne();
  const vendorId = vendor._id;
  
  const earningTypes = ['credit', 'commission', 'earnings_credit'];
  
  await Transaction.deleteMany({ _id: { $in: ['6a5b428b82d87db1a2b04069', '6a5b3e7782d87db1a2b03748'] } });
  console.log('Deleted duplicate transactions');
  process.exit(0);
});
