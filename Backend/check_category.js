const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Category = require('./models/Category');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const cat = await Category.findById('6a645a9e7525f78953e9a13d');
  console.log('Category:', cat?.title || 'Not found');
  await mongoose.disconnect();
}
run();
