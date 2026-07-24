const mongoose = require('mongoose');
require('dotenv').config();

const Profession = require('../models/Profession');
const Category = require('../models/Category');

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Count documents
    const professionCount = await Profession.countDocuments({});
    const activeProfessionCount = await Profession.countDocuments({ status: { $ne: 'deleted' } });
    const categoryCount = await Category.countDocuments({});
    
    console.log('=== DATABASE STATUS ===');
    console.log('Total Professions in DB:', professionCount);
    console.log('Active Professions in DB:', activeProfessionCount);
    console.log('Total Categories in DB:', categoryCount);
    
    if (professionCount > 0) {
      const sample = await Profession.find({}).limit(5);
      console.log('Sample Professions:', JSON.stringify(sample, null, 2));
    }
    
    console.log('========================');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkDatabase();
