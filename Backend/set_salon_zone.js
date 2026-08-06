const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixSalonZones() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Zone = mongoose.model('Zone', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  const indoreZone = await Zone.findOne({ name: /indore/i }).lean();
  console.log('Indore Zone in DB:', indoreZone ? { id: indoreZone._id, name: indoreZone.name } : 'NOT FOUND');

  if (indoreZone) {
    const res = await Category.updateOne(
      { _id: '6a6edd0f1811e76bec9a8d85' },
      { $set: { zoneIds: [indoreZone._id] } }
    );
    console.log('Update Salon Category zoneIds result:', res);
  }

  const updatedSalon = await Category.findById('6a6edd0f1811e76bec9a8d85').lean();
  console.log('Updated Salon document:', {
    id: updatedSalon._id,
    title: updatedSalon.title,
    zoneIds: updatedSalon.zoneIds
  });

  await mongoose.disconnect();
}

fixSalonZones().catch(console.error);
