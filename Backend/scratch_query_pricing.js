const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const Booking = require('./models/Booking');

async function run() {
  await connectDB();
  const b = await Booking.findById('6a4b89ad1a5750709de63a01').lean();
  console.log('DYNAMIC FIELDS:', JSON.stringify(b.dynamicFields, null, 2));
  process.exit(0);
}

run();
