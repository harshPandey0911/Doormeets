require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Cart = require('./models/Cart');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users in database:`);
  for (const u of users) {
    console.log(`\nUser: ${u.name} (${u.phone})`);
    console.log(`ID: ${u._id}`);
    
    const cart = await Cart.findOne({ userId: u._id }).lean();
    if (cart) {
      console.log(`Cart items count: ${cart.items?.length || 0}`);
      console.log('Cart Items:', JSON.stringify(cart.items, null, 2));
    } else {
      console.log('No cart found');
    }
  }
  process.exit(0);
}

run();
