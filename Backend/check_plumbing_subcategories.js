const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log('Connected to DB');
  
  const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({}, { strict: false }));
  const subs = await SubCategory.find({ categoryId: '6a1e94fa4690f2aabe964b75' }).lean();
  console.log('Plumbing subcategories count:', subs.length);
  for (const s of subs) {
    console.log(`SubCategory ID: ${s._id}, Title: ${s.title}, Status: ${s.status}`);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
