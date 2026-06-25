const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Cart = require('./models/Cart');
  
  const cart = await Cart.findOne({ 'items._id': '6a3a753dc09a846671ffa5cf' });
  if (!cart) {
    console.log('Cart not found');
    process.exit(1);
  }
  
  const item = cart.items.id('6a3a753dc09a846671ffa5cf');
  if (item) {
    item.serviceType = 'multi_visit';
    item.workflow = {
      workflowType: 'multi_visit',
      totalVisits: 2,
      frequency: 'none',
      steps: [
        { sequence: 1, title: 'Visit #1', daysAfterPreviousVisit: 0, schedulingType: 'auto_offset' },
        { sequence: 2, title: 'Visit #2', daysAfterPreviousVisit: 15, schedulingType: 'auto_offset' }
      ]
    };
    await cart.save();
    console.log('Cart item updated successfully');
  } else {
    console.log('Item not found in cart');
  }
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
