const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ShopOwner = require('../models/ShopOwner');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const phone = '7879363299';
  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
  console.log('Cleaned phone to search:', cleanPhone);

  const shopOwner = await ShopOwner.findOne({ phone: cleanPhone });
  if (!shopOwner) {
    console.log('Error: ShopOwner not found for phone:', cleanPhone);
  } else {
    console.log('Success: ShopOwner found:', shopOwner.name);
  }
  await mongoose.connection.close();
}

run().catch(console.error);
