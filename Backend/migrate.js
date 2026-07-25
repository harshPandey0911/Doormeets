const { MongoClient } = require('mongodb');

// Source and Target URIs
const sourceUri = 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';
const targetUri = 'mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority';

async function migrate() {
  let sourceClient, targetClient;
  try {
    console.log('Connecting to source database...');
    sourceClient = await MongoClient.connect(sourceUri);
    const sourceDb = sourceClient.db();
    console.log('Connected to source DB:', sourceDb.databaseName);

    console.log('Connecting to target database...');
    targetClient = await MongoClient.connect(targetUri);
    const targetDb = targetClient.db();
    console.log('Connected to target DB:', targetDb.databaseName);

    // List all collections from source
    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source database.`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      // Skip system collections if any
      if (colName.startsWith('system.')) continue;

      console.log(`\nMigrating collection: ${colName}...`);
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      // Fetch all documents
      const docs = await sourceCol.find({}).toArray();
      console.log(`- Fetched ${docs.length} documents from source.`);

      if (docs.length > 0) {
        // Drop target collection if exists to avoid duplicates
        try {
          await targetCol.drop();
          console.log(`- Dropped existing target collection: ${colName}`);
        } catch (dropErr) {
          // Ignore if collection doesn't exist
        }

        // Insert documents into target
        const insertResult = await targetCol.insertMany(docs);
        console.log(`- Successfully inserted ${insertResult.insertedCount} documents into target.`);
      } else {
        console.log(`- Collection is empty, skipping insertion.`);
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed with error:', error);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
    console.log('Database connections closed.');
  }
}

migrate();
