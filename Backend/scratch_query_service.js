const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const Service = require('./models/Service');

async function run() {
  await connectDB();
  const s = await Service.findById('6a3cd0d7b06a136f3bf6fd17').lean();
  console.log('SERVICE DETAILS:', JSON.stringify(s, null, 2));
  process.exit(0);
}

run();
