const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function fixCityMismatch() {
  await mongoose.connect(mongoUri);
  const Service = require('./models/Service');
  const ServiceBrandPricing = require('./models/ServiceBrandPricing');
  const City = require('./models/City');

  const indore = await City.findOne({ slug: 'indore' });
  const oldCityId = new mongoose.Types.ObjectId('6a153cdfb02e3f00051d6156');
  
  console.log('Target Indore city ID:', indore._id);

  const svcs = await Service.find({ cityIds: oldCityId });
  console.log('Services with old cityId:', svcs.length);
  for (let s of svcs) {
    s.cityIds = s.cityIds.map(id => id.toString() === oldCityId.toString() ? indore._id : id);
    await s.save();
  }
  console.log('Services updated.');

  const pricings = await ServiceBrandPricing.find({ cityId: oldCityId });
  console.log('Pricings with old cityId:', pricings.length);
  for (let p of pricings) {
    p.cityId = indore._id;
    await p.save();
  }
  console.log('Pricings updated.');

  await mongoose.disconnect();
}

fixCityMismatch();
