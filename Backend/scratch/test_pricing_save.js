require('dotenv').config();
const mongoose = require('mongoose');
const PricingConfig = require('../models/PricingConfig');

async function testSave() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    try {
      const doc = new PricingConfig({
        categoryId: new mongoose.Types.ObjectId(),
        serviceId: new mongoose.Types.ObjectId(),
        variantId: 'Wall Cupboard Installation', // Invalid ObjectId
        customerPrice: 100,
        gstPercentage: 18,
        platformCommission: 25
      });
      await doc.save();
      console.log('✅ PricingConfig saved successfully:', doc);
    } catch (err) {
      console.error('❌ Save failed with error code:', err.code, 'message:', err.message);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testSave();
