const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Booking = require('./models/Booking');
const VendorBill = require('./models/VendorBill');
const Transaction = require('./models/Transaction');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const booking = await Booking.findOne().sort({ updatedAt: -1 });
  if (booking) {
    console.log('=== BOOKING ===');
    console.log('Number:', booking.bookingNumber);
    console.log('Status:', booking.status);
    console.log('PaymentStatus:', booking.paymentStatus);
    console.log('vendorShare:', booking.vendorShare);
    console.log('adminCommission:', booking.adminCommission);
    console.log('finalAmount:', booking.finalAmount);

    const bill = await VendorBill.findOne({ bookingId: booking._id });
    if (bill) {
      console.log('=== BILL ===');
      console.log('vendorTotalEarning:', bill.vendorTotalEarning);
      console.log('vendorServiceEarning:', bill.vendorServiceEarning);
      console.log('vendorPartsEarning:', bill.vendorPartsEarning);
      console.log('companyRevenue:', bill.companyRevenue);
      console.log('grandTotal:', bill.grandTotal);
    }

    const txns = await Transaction.find({ bookingId: booking._id });
    console.log('=== TRANSACTIONS ===');
    txns.forEach(t => {
      console.log(t.type, '| Amount:', t.amount, '| Desc:', t.description);
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
