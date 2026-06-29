require('dotenv').config();
const mongoose = require('mongoose');
const { createBooking } = require('./controllers/bookingControllers/userBookingController');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = require('./models/User');
  const Cart = require('./models/Cart');
  
  const user = await User.findOne({ phone: '7879363299' });
  const cart = await Cart.findOne({ userId: user._id });
  const cartItem = cart.items[0];
  
  const req = {
    user: { id: user._id.toString() },
    body: {
      bookingType: 'instant',
      serviceId: cartItem.serviceId.toString(),
      address: {
        type: 'home',
        addressLine1: 'No 169, UGF, Corporate House, RNT Marg, Flim Colony, South Tukoganj, Indore, Madhya Pradesh 452001, India',
        addressLine2: '',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        landmark: '',
        lat: null,
        lng: null
      },
      scheduledDate: new Date().toISOString(),
      scheduledTime: 'ASAP',
      timeSlot: { start: 'Now', end: '45 mins' },
      paymentMethod: 'pay_at_home',
      amount: 175,
      basePrice: 250,
      discount: 75,
      tax: 0,
      visitationFee: 0,
      bookedItems: [
        {
          brandName: cartItem.sectionTitle || '',
          brandIcon: cartItem.sectionIcon || null,
          card: cartItem.card,
          quantity: cartItem.serviceCount || 1
        }
      ],
      dynamicFields: []
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('API RESPONSE CODE:', this.statusCode || 200);
      console.log('API RESPONSE DATA:', JSON.stringify(data, null, 2));
    }
  };

  try {
    await createBooking(req, res);
  } catch (err) {
    console.error('CRITICAL ERROR CAUGHT:', err);
  }
  
  setTimeout(() => process.exit(0), 2000);
}

run();
