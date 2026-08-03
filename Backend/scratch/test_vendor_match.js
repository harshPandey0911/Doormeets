const mongoose = require('mongoose');
require('dotenv').config();
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');

async function testMatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
    const cat = await Category.findOne({ title: 'Electrician' }).lean();
    console.log('Category ID:', cat ? cat._id : 'NOT FOUND');

    const searchArray = [new RegExp('^Electrician$', 'i')];
    if (cat) searchArray.push(cat._id.toString());

    const vendorQuery = {
      isActive: true,
      $and: [
        { $or: [ { categories: { $in: searchArray } }, { service: { $in: searchArray } } ] }
      ]
    };

    const vendors = await Vendor.find(vendorQuery).lean();
    console.log('--- TEST RESULTS ---');
    console.log('MATCHED VENDORS COUNT:', vendors.length);
    if (vendors.length > 0) {
      console.log('MATCHED VENDOR NAME:', vendors[0].name, 'ID:', vendors[0]._id);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
testMatch();
