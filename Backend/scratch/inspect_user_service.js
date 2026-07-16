const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const service = await mongoose.connection.db.collection('userservices').findOne({ _id: new mongoose.Types.ObjectId('6a58a3a8f5060e5d99eb7a10') });

  if (service) {
    console.log("Service found in userservices collection:");
    console.log(JSON.stringify(service, null, 2));
  } else {
    console.log("Service NOT found in userservices collection!");
  }

  await mongoose.connection.close();
}

run().catch(console.error);
