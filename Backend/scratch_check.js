require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function checkLatestBooking() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
  const latestBooking = await Booking.findOne().sort({ createdAt: -1 }).lean();
  if (latestBooking) {
    console.log("Latest Booking ID:", latestBooking._id);
    console.log("Status:", latestBooking.status);
    console.log("Service Name:", latestBooking.serviceName);
    console.log("City:", latestBooking.address?.city);
    console.log("Category ID:", latestBooking.categoryId);
    console.log("Notified Vendors:", latestBooking.notifiedVendors);
    console.log("Potential Vendors:", JSON.stringify(latestBooking.potentialVendors, null, 2));
  } else {
    console.log("No bookings found.");
  }

  mongoose.disconnect();
}

checkLatestBooking().catch(console.error);
