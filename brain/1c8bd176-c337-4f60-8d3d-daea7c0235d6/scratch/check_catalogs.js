const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../Doormeets/Backend/.env') });

const VendorServiceCatalog = require('../../Doormeets/Backend/models/VendorServiceCatalog');
const Service = require('../../Doormeets/Backend/models/Service');
const Category = require('../../Doormeets/Backend/models/Category');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civilconnect');
    console.log('Connected to MongoDB');

    const vendorServices = await VendorServiceCatalog.find().populate('categoryId');
    console.log('--- VendorServiceCatalog Items ---');
    console.log(JSON.stringify(vendorServices, null, 2));

    const categories = await Category.find();
    console.log('--- Categories ---');
    console.log(categories.map(c => ({ id: c._id, title: c.title })));

    const services = await Service.find().populate('categoryId');
    console.log('--- Service (User Catalog) Items ---');
    console.log(services.map(s => ({ id: s._id, title: s.title, category: s.categoryId?.title })));

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
