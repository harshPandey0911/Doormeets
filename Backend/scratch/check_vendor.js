const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets';

async function run() {
  try {
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    const Vendor = mongoose.model('Vendor', new mongoose.Schema({}, { strict: false }));
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

    const vendors = await Vendor.find({});
    console.log(`Total vendors found: ${vendors.length}`);
    for (const v of vendors) {
      console.log(`Vendor: ${v.name} (${v._id})`);
      console.log(`- service (categories array in schema):`, v.get('service'));
      console.log(`- categories:`, v.get('categories'));
    }

    const categories = await Category.find({});
    console.log(`\nTotal categories in DB: ${categories.length}`);
    for (const c of categories) {
      console.log(`Category: ${c.title} (${c._id}) - status: ${c.status} - type: ${c.categoryType}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
