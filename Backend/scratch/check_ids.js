const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const Category = require('../models/Category');
    
    // All worker serviceCategory IDs from DB
    const ids = [
      '6a3a4e4fe17e70480747f848',
      '6a28ffd9d65b14fa11ce393e',
      '6a645a9e7525f78953e9a13d',
      '6a672be03c5df013cb20f37d'
    ];
    
    for (const id of ids) {
      const cat = await Category.findById(id).select('title slug status').lean();
      console.log(`ID ${id}: ${cat ? JSON.stringify(cat) : 'NOT FOUND in Category collection'}`);
    }

    // Also check SubCategory
    const SubCategory = require('../models/SubCategory');
    for (const id of ids) {
      const sub = await SubCategory.findById(id).select('title slug').lean();
      if (sub) console.log(`ID ${id} found in SubCategory: ${JSON.stringify(sub)}`);
    }

    // Also check Brand
    const Brand = require('../models/Brand');
    for (const id of ids) {
      const brand = await Brand.findById(id).select('title slug').lean();
      if (brand) console.log(`ID ${id} found in Brand: ${JSON.stringify(brand)}`);
    }

    // Also check Service
    const Service = require('../models/Service');
    for (const id of ids) {
      const svc = await Service.findById(id).select('title slug').lean();
      if (svc) console.log(`ID ${id} found in Service: ${JSON.stringify(svc)}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
