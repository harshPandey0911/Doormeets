const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function deepCheck() {
  await mongoose.connect(mongoUri);
  const Category = require('./models/Category');
  const SubCategory = require('./models/SubCategory');
  const Service = require('./models/Service');
  const Vendor = require('./models/Vendor');

  console.log('=== ALL CATEGORIES ===');
  const cats = await Category.find().lean();
  cats.forEach(c => console.log({ id: c._id.toString(), title: c.title, slug: c.slug, status: c.status }));

  console.log('\n=== ALL SUBCATEGORIES ===');
  const subs = await SubCategory.find().lean();
  subs.forEach(s => console.log({ id: s._id.toString(), title: s.title, categoryId: s.categoryId ? s.categoryId.toString() : null, status: s.status }));

  console.log('\n=== SERVICES DETAILS ===');
  const svcs = await Service.find().lean();
  svcs.forEach(s => console.log({
    id: s._id.toString(),
    title: s.title,
    categoryId: s.categoryId ? s.categoryId.toString() : null,
    subCategoryId: s.subCategoryId ? s.subCategoryId.toString() : null,
    status: s.status,
    packagesCount: s.packages ? s.packages.length : 0,
    serviceGroupsCount: s.serviceGroups ? s.serviceGroups.length : 0
  }));

  console.log('\n=== VENDOR DETAILS ===');
  const vendors = await Vendor.find().lean();
  vendors.forEach(v => console.log({
    id: v._id.toString(),
    name: v.name,
    isOnline: v.isOnline,
    workStatus: v.workStatus,
    categories: v.categories,
    address: v.address
  }));

  await mongoose.disconnect();
}

deepCheck();
