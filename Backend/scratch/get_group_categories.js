const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Category = require('../models/Category');
  const groupCategories = await Category.find({ isGroupCategory: true }).lean();
  console.log("Group Categories found in DB:");
  console.log(JSON.stringify(groupCategories, null, 2));

  await mongoose.connection.close();
}

run().catch(console.error);
