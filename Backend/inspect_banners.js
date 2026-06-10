const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const OfferBanner = require('./models/OfferBanner');
const HomeContent = require('./models/HomeContent');
const City = require('./models/City');

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log('Connected to MongoDB');

  const offerBanners = await OfferBanner.find({});
  console.log('\n--- OfferBanner (Global Banners) ---');
  console.log(JSON.stringify(offerBanners, null, 2));

  const homeContents = await HomeContent.find({}).populate('cityId', 'name');
  console.log('\n--- HomeContent (City-specific Banners) ---');
  homeContents.forEach(hc => {
    console.log(`City: ${hc.cityId ? hc.cityId.name : 'Global/Default'} (${hc.cityId ? hc.cityId._id : 'null'})`);
    console.log(`Banners Count: ${hc.banners ? hc.banners.length : 0}`);
    console.log(JSON.stringify(hc.banners, null, 2));
  });

  await mongoose.disconnect();
}

inspect().catch(console.error);
