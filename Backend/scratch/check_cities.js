const mongoose = require('mongoose');
require('dotenv').config();

const City = require('../models/City');
const Category = require('../models/Category');
const Profession = require('../models/Profession');

async function checkCityAndCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hardcodedCityId = '6a153cdfb02e3f00051d6156';
    
    // Check if this city exists
    const city = await City.findById(hardcodedCityId);
    console.log('City status in DB for hardcoded ID:', city ? `${city.name} (Active: ${city.isActive})` : 'NOT FOUND');
    
    // Check all active cities
    const activeCities = await City.find({ isActive: true });
    console.log('Active Cities in DB:', activeCities.map(c => ({ id: c._id, name: c.name })));
    
    // Check categories with the city ID
    const categoriesWithCity = await Category.find({ cityIds: hardcodedCityId });
    console.log('Categories linked to hardcoded City ID:', categoriesWithCity.length);
    
    // Check professions
    const activeProfessions = await Profession.find({ status: { $ne: 'deleted' } }).populate('categories');
    for (const p of activeProfessions) {
      console.log(`Profession: ${p.name}`);
      console.log('Linked Categories:', p.categories.map(c => ({ id: c._id, title: c.title, cityIds: c.cityIds })));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkCityAndCategories();
