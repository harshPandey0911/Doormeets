require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Vendor = require('./models/Vendor');
  const Category = require('./models/Category');
  
  const allCategories = await Category.find().limit(2);
  const categoryIds = allCategories.map(c => c._id.toString());
  const categoryTitles = allCategories.map(c => c.title);
  
  await Vendor.updateMany({}, {
    $set: { categories: categoryIds, service: categoryTitles }
  });
  
  console.log(`Updated all vendors to have only 2 categories for testing. Service is now titles.`);
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
