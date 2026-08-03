const mongoose = require('mongoose');
require('dotenv').config();
const CategoryTemplate = require('./models/CategoryTemplate');
const Category = require('./models/Category');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB Connected');
  
  const normalTemplate = await CategoryTemplate.findOne({ code: 'NORMAL_SERVICE' });
  if (!normalTemplate) {
    console.log('NORMAL_SERVICE template not found');
    process.exit(1);
  }

  const res = await Category.updateMany(
    { categoryType: 'service' },
    { templateId: normalTemplate._id }
  );
  console.log('Updated categories count:', res.modifiedCount);

  const categories = await Category.find({ categoryType: 'service' }).lean();
  console.log('Updated categories:', categories.map(c => ({ id: c._id, title: c.title, templateId: c.templateId })));

  process.exit(0);
}

fix();
