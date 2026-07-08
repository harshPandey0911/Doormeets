const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Update vendor harsh pandey (6a13fdd2381a994f1815879a) to be a consultant and add Painting category
    const vendorId = new ObjectId('6a13fdd2381a994f1815879a');
    const paintingCategoryId = '6a293e391e686a11ee740000';
    
    const vendor = await db.collection('vendors').findOne({ _id: vendorId });
    if (!vendor) {
      console.log('Vendor harsh pandey not found.');
      return;
    }
    
    // Ensure painting category is in the categories array
    let categories = vendor.categories || [];
    if (!categories.includes(paintingCategoryId)) {
      categories.push(paintingCategoryId);
    }
    
    const res = await db.collection('vendors').updateOne(
      { _id: vendorId },
      { 
        $set: { 
          isConsultant: true,
          categories: categories,
          isOnline: true,
          availability: 'AVAILABLE'
        } 
      }
    );
    
    console.log(`Updated vendor ${vendor.name}. Modified count: ${res.modifiedCount}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

run();
