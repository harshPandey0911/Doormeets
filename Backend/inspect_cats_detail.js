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
  const CategoryTemplate = require('./models/CategoryTemplate');
  const templates = await CategoryTemplate.find().lean();
  console.log('--- CATEGORY TEMPLATES ---');
  console.log(JSON.stringify(templates.map(t => ({
    id: t._id,
    code: t.code,
    name: t.name
  })), null, 2));

  console.log('--- CATEGORIES ---');
  const categories = await Category.find().lean();
  console.log(JSON.stringify(categories.map(c => ({
    id: c._id,
    title: c.title,
    status: c.status,
    templateId: c.templateId,
    template: c.template,
    cityIds: c.cityIds
  })), null, 2));

  process.exit(0);
}

run();
