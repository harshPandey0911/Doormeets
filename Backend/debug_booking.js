const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Booking = require('./models/Booking');
    const booking = await Booking.findById('6a4e185a61f5271f9f3e2493').lean();
    const VendorBill = require('./models/VendorBill');
    const bill = await VendorBill.findOne({ bookingId: '6a4e185a61f5271f9f3e2493' }).lean();
    console.log(JSON.stringify({
      booking,
      bill
    }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
