const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function run() {
  await mongoose.connect('mongodb+srv://ac-ysrqqj9-shard-00-00.4a1n75n.mongodb.net/Doormeets?authSource=admin', {
    user: 'appzeto_user',
    pass: 'Appzeto2024'
  });
  console.log('Connected to DB');
  const b = await Booking.findById('6a4b8121df540804c3d51615').lean();
  console.log('STATUS:', b.status);
  console.log('PAYMENT_STATUS:', b.paymentStatus);
  console.log('PAYMENT_METHOD:', b.paymentMethod);
  console.log('isSelfJob:', b.isSelfJob);
  mongoose.disconnect();
}

run();
