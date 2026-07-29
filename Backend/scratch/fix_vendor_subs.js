const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const run = async () => {
  await mongoose.connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority');
  console.log('Connected to DB');

  const Vendor = require('../models/Vendor');
  const Category = require('../models/Category');
  const SubCategory = require('../models/SubCategory');
  const Brand = require('../models/Brand');

  const vendors = await Vendor.find({});
  console.log(`Processing ${vendors.length} vendors...`);

  for (const vendor of vendors) {
    const rawCategories = Array.from(new Set([
      ...(vendor.service || []),
      ...(vendor.categories || [])
    ]));

    if (rawCategories.length === 0) continue;

    // Find category documents to get IDs and Titles
    const objectIds = [];
    const titles = [];
    rawCategories.forEach(c => {
      if (/^[0-9a-fA-F]{24}$/.test(c)) {
        objectIds.push(new mongoose.Types.ObjectId(c));
      } else {
        titles.push(c);
      }
    });

    const categories = await Category.find({
      $or: [
        { _id: { $in: objectIds } },
        { title: { $in: titles } }
      ]
    });

    const categoryIds = categories.map(c => c._id);
    const categoryTitles = categories.map(c => c.title);

    // Fetch all subcategories belonging to these categories
    const subCategories = await SubCategory.find({
      categoryId: { $in: categoryIds }
    });
    
    // Fetch all brands belonging to these categories
    const brands = await Brand.find({
      $or: [
        { categoryIds: { $in: categoryIds } },
        { categoryId: { $in: categoryIds } }
      ]
    });

    const subIds = subCategories.map(s => s._id.toString());
    const brandIds = brands.map(b => b._id.toString());

    // Update vendor in database with subcategories and brands IDs
    vendor.subCategories = Array.from(new Set([
      ...(vendor.subCategories || []),
      ...subIds
    ]));

    vendor.brands = Array.from(new Set([
      ...(vendor.brands || []),
      ...brandIds
    ]));

    // Sync categories to make sure IDs are stored
    vendor.categories = Array.from(new Set([
      ...(vendor.categories || []),
      ...categoryIds.map(id => id.toString())
    ]));
    vendor.service = Array.from(new Set([
      ...(vendor.service || []),
      ...categoryIds.map(id => id.toString())
    ]));

    await vendor.save();
    console.log(`Updated vendor "${vendor.name}" with ${subIds.length} subcategories and ${brandIds.length} brands.`);
  }

  console.log('Finished updating vendors.');
  process.exit(0);
};

run();
