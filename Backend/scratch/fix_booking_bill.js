const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Booking = require('../models/Booking');
  const VendorBill = require('../models/VendorBill');

  const booking = await Booking.findOne({ bookingNumber: 'BK1784201397589VBK6F' });
  
  if (booking) {
    if (booking.bookingType === 'instant' && booking.instantMarkupCharged === 99) {
      if (booking.finalAmount === 400) {
        booking.finalAmount = 499;
        booking.userPayableAmount = 499;
        await booking.save();
        console.log("Updated booking finalAmount to 499");
      }

      if (booking.vendorBillId) {
        const bill = await VendorBill.findById(booking.vendorBillId);
        if (bill && bill.grandTotal === 400) {
          bill.grandTotal = 499;
          await bill.save();
          console.log("Updated VendorBill grandTotal to 499");
        }
      } else {
        const bill = await VendorBill.findOne({ bookingId: booking._id });
        if (bill && bill.grandTotal === 400) {
          bill.grandTotal = 499;
          await bill.save();
          console.log("Updated VendorBill by bookingId to 499");
        }
      }
    }
  }

  await mongoose.connection.close();
}

run().catch(console.error);
