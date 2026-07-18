require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Vendor = require('./models/Vendor');
  const Category = require('./models/Category');
  
  const allCategories = await Category.find().select('_id');
  const categoryIds = allCategories.map(c => c._id.toString());
  
  await Vendor.updateMany({}, {
    $set: { categories: categoryIds, service: categoryIds }
  });
  
  console.log(`Updated all vendors to have all ${categoryIds.length} categories for testing.`);
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
