const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    const db = mongoose.connection.db;
    // Drop the old index
    await db.collection('pricingconfigs').dropIndex('categoryId_1_subCategoryId_1_serviceId_1_brandId_1_cityId_1');
    console.log('Successfully dropped old unique index.');
  } catch (err) {
    console.log('Error or index already dropped:', err.message);
  }
  process.exit(0);
}

run();
