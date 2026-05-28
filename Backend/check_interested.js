const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets';
    console.log('Connecting to MONGODB_URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');
    
    const Category = require('./models/Category');
    const totalCount = await Category.countDocuments({});
    console.log('Total Categories in DB:', totalCount);
    
    const categories = await Category.find({}).select('title status interestedUsers');
    console.log('All Categories in DB:', JSON.stringify(categories, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

connectDB();
