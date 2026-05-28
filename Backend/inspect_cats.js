require('dotenv').config();
const mongoose = require('mongoose');

async function inspectCats() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Category = require('./models/Category');
  const cats = await Category.find({}).lean();
  console.log('Categories:', JSON.stringify(cats, null, 2));
  process.exit(0);
}

inspectCats();
