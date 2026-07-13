require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../models/Service');

async function testSave() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    try {
      const doc = new Service({
        title: 'Cupboard Door',
        description: 'Test description',
        serviceType: 'package_base',
        variants: []
      });
      await doc.save();
      console.log('✅ Service saved successfully:', doc);
      // Clean it up immediately
      await Service.deleteOne({ _id: doc._id });
      console.log('Cleanup done');
    } catch (err) {
      console.error('❌ Save failed with error:', err);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testSave();
