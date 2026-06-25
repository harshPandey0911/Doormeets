const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const SubCategory = require('../models/SubCategory');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("=== Subcategories ===");
    const subs = await SubCategory.find({});
    for (const s of subs) {
      console.log(`- Title: ${s.title}, CategoryId: ${s.categoryId}, Status: ${s.status}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
