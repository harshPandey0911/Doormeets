require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Booking = require('./models/Booking');
  const booking = await Booking.findOne().sort({createdAt: -1});
  
  if (!booking) {
    console.log("No booking found");
  } else {
    console.log(JSON.stringify({
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      serviceName: booking.serviceName,
      categoryName: booking.categoryName,
      categoryId: booking.categoryId,
      address: booking.address,
      location: booking.location,
    }, null, 2));
  }
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
