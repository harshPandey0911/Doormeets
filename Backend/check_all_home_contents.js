const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const HomeContent = require('./models/HomeContent');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    const docs = await HomeContent.find({});
    console.log(`Found ${docs.length} HomeContent documents:`);
    for (const doc of docs) {
      console.log(`- CityId: ${doc.cityId}, popularServices: ${doc.popularServices}, isVisible: ${doc.isPopularServicesVisible}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
