const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Worker = require('../models/Worker');
const Category = require('../models/Category');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doormeets');
  console.log('Connected to DB');

  try {
    const name = 'Test Worker';
    const email = '';
    const phone = '9999999999';
    const aadharNumber = '123456789012';
    const aadharUrl = 'https://res.cloudinary.com/deorxby43/image/upload/v1779695058/vendors/documents/jenam0ubwilxc196j8xc.webp';
    const vendorId = '6a13fdd2381a994f1815879a';
    
    const serviceCategories = ['Beauty Packages'];
    const foundCategories = await Category.find({ title: { $in: serviceCategories } });
    const serviceCategoryIds = foundCategories.map(c => c._id);
    
    console.log('Category mapping found:', foundCategories.map(c => ({ id: c._id, title: c.title })));

    const worker = await Worker.create({
      name,
      email: email || null,
      phone,
      aadhar: {
        number: aadharNumber,
        document: aadharUrl
      },
      vendorId,
      serviceCategories: serviceCategoryIds,
      address: {},
      status: 'active'
    });
    
    console.log('Worker created successfully:', worker);
    
    // Clean up
    await Worker.deleteOne({ _id: worker._id });
    console.log('Cleanup done.');

  } catch (error) {
    console.error('CRITICAL ERROR DURING WORKER CREATION:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
