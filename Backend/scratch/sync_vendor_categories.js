/**
 * One-time migration script to sync vendor categories from their professions.
 * Run this to fix existing vendors who have stale categories after admin updated professions.
 * 
 * Usage: node scratch/sync_vendor_categories.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Vendor = require('../models/Vendor');
const Profession = require('../models/Profession');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doormeets', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to DB. Starting vendor category sync...');
  
  try {
    // Find all vendors who have professions assigned
    const vendors = await Vendor.find({ 
      professions: { $exists: true, $ne: [] } 
    }).select('_id name professions categories service');

    console.log(`Found ${vendors.length} vendors with professions assigned.`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const vendor of vendors) {
      const allProfessionIds = (vendor.professions || []).map(p => p.toString());
      
      // Fetch all professions of this vendor
      const allProfessions = await Profession.find({ 
        _id: { $in: allProfessionIds }, 
        status: { $ne: 'deleted' } 
      }).select('name categories');

      // Merge categories from all professions
      const mergedCategories = new Set();
      for (const prof of allProfessions) {
        (prof.categories || []).forEach(catId => mergedCategories.add(catId.toString()));
      }

      const finalCategories = Array.from(mergedCategories);
      const currentCategories = (vendor.categories || []).map(c => c.toString()).sort();
      const newCategories = [...finalCategories].sort();

      // Only update if categories actually changed
      if (JSON.stringify(currentCategories) !== JSON.stringify(newCategories)) {
        await Vendor.findByIdAndUpdate(vendor._id, {
          $set: {
            categories: finalCategories,
            service: finalCategories
          }
        });
        
        const profNames = allProfessions.map(p => p.name).join(', ');
        console.log(`✅ Updated vendor "${vendor.name}" (${vendor._id}) | Professions: [${profNames}] | Categories: ${currentCategories.length} → ${finalCategories.length}`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\nDone! Updated: ${updatedCount}, Already in sync: ${skippedCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
    process.exit(0);
  }
}).catch(err => {
  console.error('Failed to connect to DB:', err);
  process.exit(1);
});
