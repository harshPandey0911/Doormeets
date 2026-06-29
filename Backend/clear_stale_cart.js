require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Cart = require('./models/Cart');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ phone: '7879363299' });
  if (user) {
    const result = await Cart.deleteOne({ userId: user._id });
    console.log(`Cart cleared for user harsh pandey (${user._id}):`, result);
  } else {
    console.log('User harsh pandey not found');
  }
  
  process.exit(0);
}

run();
