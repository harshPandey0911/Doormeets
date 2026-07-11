const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const HomeContent = require('./models/HomeContent');
    const contents = await HomeContent.find({});
    console.log('Total HomeContent documents:', contents.length);
    for (const doc of contents) {
      console.log(`Document ID: ${doc._id}, cityId: ${doc.cityId}`);
      console.log('Most Booked (booked) Services:');
      console.log(JSON.stringify(doc.booked, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
