const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config();

const HomeContent = require('../models/HomeContent');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log("=== Cleaning empty items or unwanted entries in featuredSections across all cities ===");
    const contents = await HomeContent.find({});
    
    for (const hc of contents) {
      if (hc.featuredSections && hc.featuredSections.length > 0) {
        console.log(`Checking HomeContent for city: ${hc.cityId || 'Global'}`);
        // Filter out sections that are empty, or clean their items
        const originalLength = hc.featuredSections.length;
        hc.featuredSections = hc.featuredSections.filter(sec => sec.items && sec.items.length > 0);
        
        if (hc.featuredSections.length !== originalLength) {
          hc.markModified('featuredSections');
          await hc.save();
          console.log(`Saved HomeContent. Removed empty sections. Remaining sections: ${hc.featuredSections.length}`);
        }
      }
    }

    console.log("Database clean complete.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
