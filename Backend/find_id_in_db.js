require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const collections = mongoose.connection.collections;
  const targetId = '6a3e1dc343871cc002f15fe0';
  
  console.log(`Searching for ID: ${targetId} across all collections...`);
  
  for (const name in collections) {
    const coll = collections[name];
    try {
      const doc = await coll.findOne({ _id: new mongoose.Types.ObjectId(targetId) });
      if (doc) {
        console.log(`\n🎉 Found in collection: ${name}`);
        console.log(JSON.stringify(doc, null, 2));
      }
    } catch (e) {
      // Some collections might not use ObjectId or other errors
    }
  }
  
  console.log('\nSearch completed.');
  process.exit(0);
}

run();
