const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Vendor = require('./models/Vendor');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const harsh = await Vendor.findOne({ name: 'Harsh Pandey' });
  if (harsh) {
    console.log('Original Categories:', harsh.categories);
    const electricianId = '6a644e8cf2ba1733ab6f93d3';
    
    if (!harsh.categories.includes(electricianId)) {
      harsh.categories.push(electricianId);
      // Also ensure subCategories contains the subCategory ID for Raju's subCategory
      const subCatId = '6a68e6fd3fa86609e6e2ca6f'; // Switch/Socket subCategory ID
      if (!harsh.subCategories.includes(subCatId)) {
        harsh.subCategories.push(subCatId);
      }
      if (!harsh.subCategories.includes('Switch/Socket')) {
        harsh.subCategories.push('Switch/Socket');
      }

      await harsh.save();
      console.log('Updated Harsh Pandey categories successfully!');
      console.log('New Categories:', harsh.categories);
      console.log('New Subcategories:', harsh.subCategories);
    } else {
      console.log('Harsh Pandey already has Electrician category.');
    }
  } else {
    console.log('Harsh Pandey not found!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
