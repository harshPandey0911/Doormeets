const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log('Connected to DB');
  
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const cat = await Category.findOne({ title: 'Plumbing' }).lean();
  if (cat) {
    console.log('Plumbing category details:', JSON.stringify(cat, null, 2));
  const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({}, { strict: false }));
  const subs = await SubCategory.find({ categoryId: cat._id }).lean();
  console.log('Subcategories found:', JSON.stringify(subs, null, 2));
  
  const Brand = mongoose.model('Brand', new mongoose.Schema({}, { strict: false }));
  const brands = await Brand.find({
    $or: [
      { categoryId: cat._id },
      { categoryIds: cat._id },
      { category: cat._id }
    ]
  }).lean();
  console.log('Brands found for Plumbing:', JSON.stringify(brands, null, 2));

  const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }));
  const svcs = await Service.find({ categoryId: cat._id }).lean();
  console.log('Services count for Plumbing category:', svcs.length);
  if (svcs.length > 0) {
    console.log('Sample service:', JSON.stringify(svcs[0], null, 2));
  }
  } else {
    console.log('Plumbing category not found');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
