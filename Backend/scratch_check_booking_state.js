const mongoose = require('mongoose');
const Booking = require('./models/Booking');
require('dotenv').config();

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const id = '6a57501a97e741f8ce86fada';
    console.log('Fetching booking:', id);

    const booking = await Booking.findById(id).lean();

    if (!booking) {
      console.log('❌ Booking not found');
      return;
    }

    console.log('✅ Booking details:', {
      _id: booking._id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      basePrice: booking.basePrice,
      discount: booking.discount,
      workerId: booking.workerId,
      assignedAt: booking.assignedAt,
      workerPaymentStatus: booking.workerPaymentStatus,
      finalSettlementStatus: booking.finalSettlementStatus
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
