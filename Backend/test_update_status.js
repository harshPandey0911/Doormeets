require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

async function testUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const cat = await Category.findOne({ title: 'Electricity' });
    if (!cat) {
      console.log('Electricity category not found');
      process.exit(0);
    }
    
    console.log('Current status:', cat.status);
    cat.status = 'inactive';
    await cat.save();
    console.log('Updated status successfully, now:', cat.status);
    
    // Re-fetch to double check
    const cat2 = await Category.findOne({ title: 'Electricity' });
    console.log('Re-fetched status:', cat2.status);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during update:', error);
    process.exit(1);
  }
}

testUpdate();
