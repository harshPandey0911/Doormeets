const mongoose = require('mongoose');
require('dotenv').config();

require('./models/Service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  const Service = mongoose.model('Service');
  const service = await Service.findOne({ title: /massage/i });
  console.log('Massage Service Doc:', JSON.stringify(service, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
