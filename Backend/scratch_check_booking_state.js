const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Settings = require('./models/Settings');
const VendorBill = require('./models/VendorBill');
require('dotenv').config();

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const id = '6a57501a97e741f8ce86fada';
    console.log('Fetching booking:', id);

    const booking = await Booking.findById(id)
      .populate('userId', 'name phone email')
      .populate('vendorId', 'name businessName phone email address profilePhoto')
      .populate('serviceId', 'title description iconUrl images')
      .populate('categoryId', 'title slug sacCode')
      .populate('workerId', 'name phone rating totalJobs location profilePhoto');

    if (!booking) {
      console.log('❌ Booking not found');
      return;
    }

    console.log('✅ Booking found:', {
      _id: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      basePrice: booking.basePrice,
      discount: booking.discount
    });

    const bill = await VendorBill.findOne({ bookingId: booking._id });
    console.log('✅ Bill found:', bill ? bill._id : 'None');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
