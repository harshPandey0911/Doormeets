const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const Booking = require('../models/Booking');
    const id = '6a62fd4f8c54c87e316e3a29';
    const booking = await Booking.findById(id);
    if (!booking) {
      console.log('Booking NOT found in DB!');
    } else {
      console.log('Booking found:');
      console.log('Status:', booking.status);
      console.log('VendorId:', booking.vendorId);
      console.log('UserId:', booking.userId);
      console.log('WorkerId:', booking.workerId);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
