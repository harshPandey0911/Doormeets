const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const Category = require('../models/Category');
const CategoryTemplate = require('../models/CategoryTemplate');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("=== Category Templates ===");
    const templates = await CategoryTemplate.find({});
    for (const t of templates) {
      console.log(`- ${t.name} (${t.code}) ID: ${t._id}`);
    }

    console.log("\n=== Categories ===");
    const categories = await Category.find({});
    for (const c of categories) {
      let tName = "None";
      if (c.templateId) {
        const found = templates.find(t => t._id.toString() === c.templateId.toString());
        if (found) tName = found.code;
      }
      console.log(`- Title: ${c.title}, Slug: ${c.slug}, Template: ${tName}, Status: ${c.status}, showOnHome: ${c.showOnHome}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
