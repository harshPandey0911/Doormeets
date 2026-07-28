const { MongoClient } = require('mongodb');

// Source DB (Old DB where Harsh Kanojiya exists)
const sourceUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";
// Target DB (New DB currently used by Backend)
const targetUri = "mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority";

async function copy() {
  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    console.log('Connected to Source DB');
    const sourceDb = sourceClient.db();

    await targetClient.connect();
    console.log('Connected to Target DB');
    const targetDb = targetClient.db();

    const vendorPhone = '6263079701';
    
    // 1. Copy Vendor
    console.log(`Searching for vendor with phone ${vendorPhone} in Source DB...`);
    const vendor = await sourceDb.collection('vendors').findOne({ phone: vendorPhone });
    
    if (vendor) {
      console.log('Vendor found. Copying to Target DB...');
      await targetDb.collection('vendors').deleteOne({ _id: vendor._id });
      await targetDb.collection('vendors').insertOne(vendor);
      console.log('✅ Vendor copied successfully.');

      // 2. Copy Workers
      console.log(`Searching for workers of vendor ${vendor._id} in Source DB...`);
      const workers = await sourceDb.collection('workers').find({ vendorId: vendor._id }).toArray();
      
      if (workers.length > 0) {
        console.log(`Found ${workers.length} workers. Copying to Target DB...`);
        const workerIds = workers.map(w => w._id);
        await targetDb.collection('workers').deleteMany({ _id: { $in: workerIds } });
        await targetDb.collection('workers').insertMany(workers);
        console.log('✅ Workers copied successfully.');
      } else {
        console.log('No workers found for this vendor.');
      }
    } else {
      console.log('❌ Vendor not found in Source DB!');
    }

  } catch (error) {
    console.error('Error during copy:', error);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

copy();
