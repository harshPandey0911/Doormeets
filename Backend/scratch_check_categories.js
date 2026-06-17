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
  const Category = require('./models/Category');
  const CategoryTemplate = require('./models/CategoryTemplate');
  
  const cats = await Category.find({}).lean();
  console.log('--- ALL CATEGORIES ---');
  for (const cat of cats) {
    let templateName = 'None';
    if (cat.templateId) {
      const t = await CategoryTemplate.findById(cat.templateId).lean();
      templateName = t ? `${t.name} (${t.code})` : `Invalid templateId: ${cat.templateId}`;
    }
    console.log(`Title: "${cat.title}", ID: ${cat._id}, Template: ${templateName}, CityIds: ${JSON.stringify(cat.cityIds)}`);
  }
  
  process.exit(0);
}

run();
