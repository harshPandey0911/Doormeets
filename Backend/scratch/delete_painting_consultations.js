const { MongoClient } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Clear painting consultations
    const result1 = await db.collection('paintingconsultations').deleteMany({});
    console.log(`Deleted ${result1.deletedCount} painting consultations.`);
    
    // Clear painting quotations
    const result2 = await db.collection('paintingquotations').deleteMany({});
    console.log(`Deleted ${result2.deletedCount} painting quotations.`);
  } catch (error) {
    console.error('Error clearing collections:', error);
  } finally {
    await client.close();
  }
}

run();
