const { MongoClient } = require('mongodb');

const sourceUri = 'mongodb://127.0.0.1:27017/civilconnect';
const targetUri = 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function copyDatabase() {
  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    console.log('Connecting to source database...');
    await sourceClient.connect();
    const sourceDb = sourceClient.db();

    console.log('Connecting to target database...');
    await targetClient.connect();
    const targetDb = targetClient.db();

    // Get all collections from source
    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections to copy.`);

    for (let collectionInfo of collections) {
      const colName = collectionInfo.name;
      console.log(`\nCopying collection: ${colName}`);
      
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);
      
      // Clear target collection first
      await targetCol.deleteMany({});
      
      // Get all documents
      const docs = await sourceCol.find({}).toArray();
      if (docs.length > 0) {
        await targetCol.insertMany(docs);
        console.log(`Copied ${docs.length} documents for ${colName}`);
      } else {
        console.log(`No documents in ${colName}, skipped data insertion.`);
      }
    }

    console.log('\nDatabase copy completed successfully!');
  } catch (error) {
    console.error('Error during copy:', error);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

copyDatabase();
