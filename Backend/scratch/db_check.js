require('dotenv').config();
const mongoose = require('mongoose');

async function checkDB() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }), 'services');
    
    const matched = await Service.find({ slug: 'cupboard-door' });
    console.log('Orphaned matching services:', matched.map(m => m._id));

    if (matched.length > 0) {
      const deleteResult = await Service.deleteMany({ slug: 'cupboard-door' });
      console.log('Delete result:', deleteResult);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDB();
