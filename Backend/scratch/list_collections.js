const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections list:");
  console.log(collections.map(c => c.name));

  await mongoose.connection.close();
}

run().catch(console.error);
