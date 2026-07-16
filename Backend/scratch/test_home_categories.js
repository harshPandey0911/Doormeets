const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Category = require('../models/Category');

  const categoriesRes = await Category.find({ 
    status: { $in: ['active', 'coming_soon'] }, 
    showOnHome: { $ne: false }
  })
    .select('title showOnHome isGroupCategory mappedCategories')
    .lean();

  console.log("Categories returned with showOnHome !== false:");
  console.log(JSON.stringify(categoriesRes, null, 2));

  await mongoose.connection.close();
}

run().catch(console.error);
