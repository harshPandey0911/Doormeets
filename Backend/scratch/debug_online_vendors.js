require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Vendor = require('../models/Vendor');
  const ids = [
    '6a13fdd2381a994f1815879a',
    '6a3fba58d2a65a1cdb86d754',
    '6a3fbafb1d9b6376fc9013c5',
    '6a43aac0e375586b073d3d1a',
    '6a43aee6e375586b073d4835',
    '6a44bd20cc3572dcef289112',
    '6a4cd5a2ae831e7dc41c367a'
  ];
  const matching = await Vendor.find({ _id: { $in: ids } }).select('name isOnline availability address.city approvalStatus isActive').lean();
  console.log(JSON.stringify(matching, null, 2));
  process.exit(0);
}

run().catch(console.error);
