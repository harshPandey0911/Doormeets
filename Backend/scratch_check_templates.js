const mongoose = require('mongoose');
const CategoryTemplate = require('./models/CategoryTemplate');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/doormeets');
  console.log('Connected to DB');
  const templates = await CategoryTemplate.find();
  console.log('Templates in DB:', JSON.stringify(templates, null, 2));
  mongoose.disconnect();
}

main().catch(console.error);
