const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function checkBooking() {
  await mongoose.connect(MONGODB_URI);
  
  const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));
  const b = await Booking.findById('6a17ee1cd470823a82cbb28b');
  console.log(JSON.stringify(b, null, 2));
  
  await mongoose.disconnect();
}

checkBooking().catch(console.error);
