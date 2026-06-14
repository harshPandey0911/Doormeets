const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const HomeContent = require('./models/HomeContent');
const Service = require('./models/Service');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const homeContent = await HomeContent.findOne({ cityId: null });
    if (!homeContent) {
      console.log('No default home content found.');
      process.exit(0);
    }

    console.log('Popular Services IDs in HomeContent:', homeContent.popularServices);
    console.log('isPopularServicesVisible:', homeContent.isPopularServicesVisible);

    if (homeContent.popularServices && homeContent.popularServices.length > 0) {
      const services = await Service.find({ _id: { $in: homeContent.popularServices } });
      console.log('Found services in DB:');
      services.forEach(s => {
        console.log(`- ID: ${s._id}, Title: ${s.title}, Status: ${s.status}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
