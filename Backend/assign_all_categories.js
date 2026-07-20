require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Vendor = require('./models/Vendor');
  const Profession = require('./models/Profession');
  const Category = require('./models/Category');
  
  const vendors = await Vendor.find().populate({
    path: 'professions',
    populate: {
      path: 'categories',
      model: 'Category'
    }
  });

  let updateCount = 0;

  for (const vendor of vendors) {
    if (vendor.professions && vendor.professions.length > 0) {
      // Gather all unique categories from all assigned professions
      const categoryMap = new Map();
      vendor.professions.forEach(prof => {
        if (prof.categories) {
          prof.categories.forEach(cat => {
            if (cat && cat._id) {
              categoryMap.set(cat._id.toString(), cat.title);
            }
          });
        }
      });

      const categoryIds = Array.from(categoryMap.keys());
      const categoryTitles = Array.from(categoryMap.values());

      vendor.categories = categoryIds;
      vendor.service = categoryTitles;
      await vendor.save();
      updateCount++;
    }
  }
  
  console.log(`Updated ${updateCount} vendors based on their selected professions.`);
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
