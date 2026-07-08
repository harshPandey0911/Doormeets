const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ShopOwner = require('../models/ShopOwner');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  const owners = await ShopOwner.find({});
  console.log('Registered shop owners:', owners.map(o => ({ name: o.name, phone: o.phone, email: o.email })));
  await mongoose.connection.close();
}

run().catch(console.error);
