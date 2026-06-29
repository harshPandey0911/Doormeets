require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
const Category = require('./models/Category');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const services = await Service.find({}).limit(5).lean();
  console.log(`Found ${services.length} services:`);
  for (const s of services) {
    console.log(`\nService: ${s.title}`);
    console.log(`ID: ${s._id}`);
    console.log(`Base Price: ${s.basePrice}`);
    console.log(`Category ID: ${s.categoryId}`);
  }
  
  const categories = await Category.find({}).limit(5).lean();
  console.log(`\nFound ${categories.length} categories:`);
  for (const c of categories) {
    console.log(`Category: ${c.title} (${c._id})`);
  }
  
  process.exit(0);
}

run();
