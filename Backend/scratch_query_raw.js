const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Cart = require('./models/Cart');
const Settings = require('./models/Settings');
require('./models/Service');
require('./models/PricingConfig');
require('./models/Category');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  try {
    const carts = await Cart.find({}).lean();
    if (carts.length > 0) {
      const targetUserId = carts[1]?.userId || carts[0].userId; // Let's check second cart
      console.log('Querying for user:', targetUserId);
      const [user, cart, settings] = await Promise.all([
        User.findById(targetUserId).select('addresses phone name loyaltyPoints wallet'),
        Cart.findOne({ userId: targetUserId }).populate('items.serviceId', 'title iconUrl slug codAdvanceAmount packages').populate('items.categoryId', 'title slug'),
        Settings.findOne({ type: 'global' }).select('visitedCharges serviceGstPercentage partsGstPercentage loyaltyPointsRedemptionRate isInstantBookingEnabled instantBookingMarkup instantBookingWaitTime instantBookingWindowHours showArrivalTime paintingRates')
      ]);
      console.log('Cart Items returned:', JSON.stringify(cart?.items, null, 2));
    } else {
      console.log('No carts found');
    }
  } catch (error) {
    console.error('Failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
