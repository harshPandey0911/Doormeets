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

async function inspect() {
  await mongoose.connect(env.MONGODB_URI);
  const Service = require('./models/Service');
  const service = await Service.findById('6a3cd0d7b06a136f3bf6fd17');
  console.log(JSON.stringify(service, null, 2));
  process.exit(0);
}

inspect();
