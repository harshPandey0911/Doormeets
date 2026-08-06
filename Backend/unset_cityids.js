const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function removeLegacyCityIds() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }));
  const res = await Service.updateMany({}, { $unset: { cityIds: 1 } });
  console.log('Unset cityIds from services:', res);
  await mongoose.disconnect();
}
removeLegacyCityIds().catch(console.error);
