const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function syncSalonHasSubCategory() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({}, { strict: false }));

  const categories = await Category.find({});
  for (const cat of categories) {
    const subCount = await SubCategory.countDocuments({ categoryId: cat._id });
    if (subCount > 0 && !cat.hasSubCategory) {
      await Category.updateOne({ _id: cat._id }, { $set: { hasSubCategory: true } });
      console.log('Updated category', cat.title, 'hasSubCategory -> true');
    }
  }

  await mongoose.disconnect();
}

syncSalonHasSubCategory().catch(console.error);
