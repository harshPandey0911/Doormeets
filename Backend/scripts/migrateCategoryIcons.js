const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Category = require('../models/Category');

dotenv.config();

const migrateCategoryIcons = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Find all categories with icons
    const categories = await Category.find({
      homeIconUrl: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`📂 Found ${categories.length} categories with icons\n`);

    for (const category of categories) {
      const currentIconUrl = category.homeIconUrl;
      console.log(`🔄 Processing: ${category.title} (${category.slug})`);
      console.log(`   Current URL: ${currentIconUrl}`);

      // Check if URL already uses Doormeets folder
      if (currentIconUrl.includes('/Doormeets/')) {
        console.log(`   ✅ Already in Doormeets folder\n`);
        continue;
      }

      // Generate new Doormeets URL
      const iconFilename = currentIconUrl.split('/').pop();
      const newIconUrl = `https://res.cloudinary.com/shubhamcloudinary/image/upload/v1766136203/Doormeets/${category.slug}/icons/${iconFilename}`;

      console.log(`   New URL: ${newIconUrl}`);

      // Update category with new icon URL
      category.homeIconUrl = newIconUrl;
      await category.save();

      console.log(`   ✅ Updated in database\n`);
    }

    console.log('🎉 Category icon migration completed!');
    console.log('📋 All category icons now use Doormeets folder structure');

  } catch (error) {
    console.error('❌ Error migrating category icons:', error);
  } finally {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

migrateCategoryIcons();
