const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Category = require('../models/Category');

  // Set showOnHome to true for all group categories (combined category boxes)
  const result = await Category.updateMany({ isGroupCategory: true }, { showOnHome: true });
  console.log("Updated group categories:", result);

  const groupCategories = await Category.find({ isGroupCategory: true }).select('title showOnHome').lean();
  console.log("Current Group Categories showOnHome status:", groupCategories);

  await mongoose.connection.close();
}

run().catch(console.error);
