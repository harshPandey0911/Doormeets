require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const cats = await Category.find({}).lean();
  console.log(`Found ${cats.length} categories`);
  console.log(JSON.stringify(cats.map(c => ({ title: c.title, status: c.status, showOnHome: c.showOnHome, vendorId: c.vendorId, homeIconUrl: c.homeIconUrl, imageUrl: c.imageUrl })), null, 2));
  process.exit(0);
}

check();
